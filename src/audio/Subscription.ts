import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, entersState, VoiceConnection, VoiceConnectionStatus, VoiceConnectionDisconnectReason, createAudioResource, StreamType } from "@discordjs/voice";
import { Util } from "../Utils/Util";
import { TypedEmitter as EventEmitter } from "tiny-typed-emitter";
import { Track } from "./Track";
import { Snowflake } from "discord-api-types";
import type { Client } from "./Client";
import { WSEvents, FFmpegArgs } from "../Utils/Constants";
import type MiniTimer from "../Utils/MiniTimer";
import { FFmpeg } from "prism-media";
import type { Readable } from "stream";
import wsclients from "../networking/WebSocket/clients";

export interface VoiceEvents {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    error: (error: Error) => any;
    connectionError: (error: Error) => any;
    start: (resource: AudioResource<Track>) => any;
    finish: (resource: AudioResource<Track>) => any;
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

class SubscriptionManager extends EventEmitter<VoiceEvents> {
    public readonly audioPlayer: AudioPlayer;
    private readyLock = false;
    public paused = false;
    public audioResource: AudioResource<Track> = null;
    public encoderArgs: string[] = [];
    public timer: MiniTimer = null;
    public filtersUpdate = false;
    public lastVolume = 100;

    constructor(public readonly voiceConnection: VoiceConnection, public readonly client: Client, public readonly guildID: Snowflake) {
        super();
        this.audioPlayer = createAudioPlayer();

        this.voiceConnection.on("stateChange", async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    try {
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5000);
                    } catch {
                        this.client.kill(this.guildID);
                    }
                } else if (this.voiceConnection.rejoinAttempts < 5) {
                    await Util.wait(this.voiceConnection.rejoinAttempts++ * 5000);
                    this.voiceConnection.rejoin();
                } else {
                    this.client.kill(this.guildID);
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                this.end();
            } else if (!this.readyLock && (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)) {
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20000);
                } catch {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
                        this.client.kill(this.guildID);
                    }
                } finally {
                    this.readyLock = false;
                }
            }
        });

        this.audioPlayer.on("stateChange", (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Playing) {
                if (!this.timer && this.client.statusUpdateInterval > 0 && Number.isFinite(this.client.statusUpdateInterval)) {
                    this.timer = Util.setInterval(() => {
                        this.client.socket.send(this.createPlayerStatusPayload(), Util.noop);
                    }, this.client.statusUpdateInterval);
                    this.timer.start();
                } else if (this.timer?.paused) this.timer.resume();

                if (oldState.status === AudioPlayerStatus.Paused || this.filtersUpdate) return;
                this.emit("start", this.audioResource);
                this.filtersUpdate = false;
            } else if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                if (!this.paused || !this.filtersUpdate) {
                    this.emit("finish", this.audioResource);
                    this.audioResource = null;
                    this.encoderArgs = [];
                    this.timer?.pause();
                    // sent status after pause (to get latest update)
                    this.client.socket.send(this.createPlayerStatusPayload(), Util.noop);
                }
            }
        });

        this.voiceConnection.on("error", (error) => void this.emit("connectionError", error));
        this.audioPlayer.on("error", (error) => void this.emit("error", error));
        this.voiceConnection.subscribe(this.audioPlayer);
    }

    end() {
        this.audioPlayer.stop();
    }

    disconnect() {
        try {
            this.timer?.clear();
            this.timer = null;
            this.audioPlayer.stop(true);
            this.audioResource = null;
            this.voiceConnection.destroy();
        } catch {} // eslint-disable-line no-empty
    }

    pause() {
        const success = this.audioPlayer.pause(true);
        this.paused = success;
        return success;
    }

    resume() {
        const success = this.audioPlayer.unpause();
        this.paused = !success;
        return success;
    }

    setVolume(value: number) {
        if (!this.audioResource || isNaN(value) || value < 0 || value > Infinity) return false;
        this.audioResource.volume.setVolumeLogarithmic(value / 100);
        this.lastVolume = value;
        return true;
    }

    get volume() {
        if (!this.audioResource || !this.audioResource.volume) return this.lastVolume ?? 100;
        const currentVol = this.audioResource.volume.volume;
        return Math.round(Math.pow(currentVol, 1 / 1.660964) * 100);
    }

    get streamTime() {
        if (!this.audioResource) return 0;

        const duration = this.audioResource.playbackDuration;
        return duration;
    }

    async playStream(track: Track) {
        if (!track) throw new Error("Audio resource is not available!");

        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Ready) {
            const entersStateResult = await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 60000).catch(() => null);
            if (entersStateResult === null) return this.client.kill(this.guildID);
        }

        const resource = this.createAudioResource(track);
        this.audioResource = resource;
        this.filtersUpdate = false;
        this.audioPlayer.play(resource);
        this.setVolume(this.lastVolume);

        return this;
    }

    createAudioResource(track: Track): AudioResource<Track> {
        const stream = track.createStream();

        return createAudioResource(this.createFFmpegStream(stream), {
            metadata: track,
            inlineVolume: true,
            inputType: StreamType.Raw
        });
    }

    createFFmpegStream(stream: Readable) {
        const transcoder = new FFmpeg({
            args: [...FFmpegArgs, ...this.encoderArgs],
            shell: false
        });

        transcoder.on("close", () => {
            transcoder.destroy();
        });

        transcoder.on("error", () => {
            transcoder.destroy();
        });

        const output = stream.pipe(transcoder);

        output.on("error", () => {
            if (!transcoder.destroyed) transcoder.destroy();
        });

        this.encoderArgs = [];

        return output;
    }

    updateFFmpegStream() {
        if (!this.audioResource) return;

        const stream = this.audioResource.metadata.createStream();
        const nextStream = this.createFFmpegStream(stream);
        const resource = createAudioResource(nextStream, {
            metadata: this.audioResource.metadata,
            inputType: StreamType.Raw,
            inlineVolume: true
        });

        // buffering timeout
        setTimeout(() => {
            this.filtersUpdate = true;
            this.audioResource = resource;
            this.audioPlayer.play(resource);
            this.setVolume(this.lastVolume);
        }, 3000);
    }

    createPlayerStatusPayload() {
        return JSON.stringify({
            t: WSEvents.AUDIO_PLAYER_STATUS,
            d: {
                guild_id: this.guildID,
                timestamp: Date.now(),
                stream_time: this.streamTime,
                volume: this.volume,
                paused: this.paused,
                latency: this.voiceConnection?.ping ?? {},
                current: this.audioResource?.metadata?.toJSON() || null,
                subscribers: {
                    self_subscription_count: this.client.subscriptions.size,
                    total_subscription_count: wsclients.reduce((a, c) => a + c.subscriptions.size, 0),
                    connected: wsclients.size
                }
            }
        });
    }
}

export { SubscriptionManager };
