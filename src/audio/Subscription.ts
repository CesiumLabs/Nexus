import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, entersState, VoiceConnection, VoiceConnectionStatus, VoiceConnectionDisconnectReason } from "@discordjs/voice";
import { Util } from "../Utils/Util";
import { TypedEmitter as EventEmitter } from "tiny-typed-emitter";
import { Track } from "./Track";

export interface VoiceEvents {
    error: (error: Error) => any;
    connectionError: (error: Error) => any;
    start: (resource: AudioResource<Track>) => any;
    finish: (resource: AudioResource<Track>) => any;
}

class SubscriptionManager extends EventEmitter<VoiceEvents> {
    public readonly audioPlayer: AudioPlayer;
    private readyLock = false;
    public paused = false;
    public audioResource: AudioResource<Track> = null;

    constructor(public readonly voiceConnection: VoiceConnection) {
        super();
        this.audioPlayer = createAudioPlayer();

        this.voiceConnection.on("stateChange", async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    try {
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5000);
                    } catch {
                        this.voiceConnection.destroy();
                    }
                } else if (this.voiceConnection.rejoinAttempts < 5) {
                    await Util.wait(this.voiceConnection.rejoinAttempts++ * 5000);
                    this.voiceConnection.rejoin();
                } else {
                    this.voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                this.end();
            } else if (!this.readyLock && (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)) {
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20000);
                } catch {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();
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
                    this.audioResource = null;
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
            this.voiceConnection.destroy();
        } catch {}
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

    async playStream(resource: AudioResource<Track> = this.audioResource) {
        if (!resource) throw new Error("Audio resource is not available!");
        if (!this.audioResource) this.audioResource = resource;
        if (this.voiceConnection.state.status !== VoiceConnectionStatus.Ready) await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30000);
        this.audioPlayer.play(resource);

        return this;
    }
}

export { SubscriptionManager };
