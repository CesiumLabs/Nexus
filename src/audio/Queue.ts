import { Snowflake } from "discord-api-types";
import type { Track } from "./Track";
import type { SubscriptionManager } from "./Subscription";

class Queue {
    public tracks: Track[] = [];

    constructor(public readonly guild: Snowflake, public readonly subscription: SubscriptionManager) {}

    addTrack(track: Track, emit = true) {
        track.initial ? this.tracks.unshift(track) : this.tracks.push(track);

        if (emit) this.subscription.emit("trackAdd", track);
    }

    addTracks(tracks: Track[]) {
        // for events
        tracks.forEach((track) => this.addTrack(track, tracks.length === 1));
        if (tracks.length > 1) this.subscription.emit("tracksAdd", tracks);
    }

    shuffle() {
        if (!this.tracks.length || this.tracks.length < 3) return false;
        const currentTrack = this.tracks.shift();

        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
        }

        this.tracks.unshift(currentTrack);

        return true;
    }

    get playing() {
        return this.subscription.audioResource?.metadata ?? this.tracks[0];
    }
}

export { Queue };
