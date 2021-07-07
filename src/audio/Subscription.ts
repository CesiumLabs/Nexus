import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, entersState, VoiceConnection, VoiceConnectionStatus, VoiceConnectionDisconnectReason, createAudioResource, StreamType } from "@discordjs/voice";
import { Util } from "../Utils/Util";
import { TypedEmitter as EventEmitter } from "tiny-typed-emitter";
import { Track } from "./Track";
import { Queue } from "./Queue";
import { Snowflake } from "discord-api-types";
import type { Client } from "./Client";
import { LoopMode } from "../Utils/Constants";

export interface VoiceEvents {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    error: (error: Error) => any;
    connectionError: (error: Error) => any;
    start: (resource: AudioResource<Track>) => any;
    finish: (resource: AudioResource<Track>) => any;
    trackAdd: (track: Track) => any;
    stop: () => any;
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

class SubscriptionManager extends EventEmitter<VoiceEvents> {
    public readonly audioPlayer: AudioPlayer;
    private readyLock = false;
    public paused = false;
    public audioResource: AudioResource<Track> = null;
    public queue = new Queue(this.voiceConnection.joinConfig.guildId as Snowflake, this);
    #lastVolume = 100;
    public loopMode = LoopMode.OFF;

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
                if (!this.paused) return void this.emit("start", this.audioResource);
            } else if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                if (!this.paused) {
                    void this.emit("finish", this.audioResource);
                    const previousTrack = this.audioResource?.metadata;
                    let nextTrack: Track;

                    if (this.loopMode === LoopMode.OFF) {
                        nextTrack = this.queue.tracks.shift();
                    } else if (this.loopMode === LoopMode.TRACK) {
                        nextTrack = this.audioResource.metadata;
                    } else if (this.loopMode === LoopMode.QUEUE) {
                        this.queue.addTrack(previousTrack);
                        nextTrack = this.queue.tracks.shift();
                    }

                    this.audioResource = null;
                    if (nextTrack) this.playStream(nextTrack, true);
                    else this.emit("stop");
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
            this.audioPlayer.stop(true);
            this.queue.tracks = [];
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
        this.#lastVolume = value;
        return true;
    }

    get volume() {
        if (!this.audioResource || !this.audioResource.volume) return 100;
        const currentVol = this.audioResource.volume.volume;
        return Math.round(Math.pow(currentVol, 1 / 1.660964) * 100);
    }

    get streamTime() {
        if (!this.audioResource) return 0;
        return this.audioResource.playbackDuration;
    }

    async playStream(track: Track = this.queue.playing, play = false) {
        if (!track) throw new Error("Audio resource is not available!");

        if (!play) {
            this.queue.addTrack(track);
            return this;
        }

        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Ready) await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30000);
        const resource = this.createAudioResource(track);
        if (!this.audioResource) this.audioResource = resource;
        this.audioPlayer.play(resource);
        this.setVolume(this.#lastVolume);

        return this;
    }

    createAudioResource(track: Track): AudioResource<Track> {
        const stream = track.createStream();
        return createAudioResource(stream, {
            metadata: track,
            inlineVolume: true,
            inputType: StreamType.Arbitrary
        });
    }
}

export { SubscriptionManager };
