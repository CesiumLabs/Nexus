import { Snowflake } from "discord-api-types";
import type { Track } from "./Track";
import type { SubscriptionManager } from "./Subscription";

class Queue {
    public tracks: Track[] = [];

    constructor(public readonly guild: Snowflake, public readonly subscription: SubscriptionManager) {}

    addTrack(track: Track) {
        this.tracks.push(track);

        this.subscription.emit("trackAdd", track);
    }

    addTracks(tracks: Track[]) {
        // for events
        tracks.forEach((track) => this.addTrack(track));
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
