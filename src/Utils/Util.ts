import { Track } from "../audio/Track";
import YouTube from "youtube-sr";
import { TrackInitOptions } from "../types/types";

class Util extends null {
    private constructor() {} // eslint-disable-line @typescript-eslint/no-empty-function

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parse<T>(data: any): T {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    static noop() {} // eslint-disable-line @typescript-eslint/no-empty-function

    static wait(t: number): Promise<void> {
        return new Promise((r) => setTimeout(r, t));
    }

    static ytSearch(query: string, track?: false): Promise<TrackInitOptions[]>;
    static ytSearch(query: string, track?: true): Promise<Track[]>;
    static ytSearch(query: string, track?: boolean): Promise<TrackInitOptions[] | Track[]> {
        return new Promise((resolve, reject) => {
            YouTube.search(query, { limit: 10, type: "video" })
                .then((videos) => {
                    if (!videos.length) return reject("No result");
                    const data = videos.map((m) => {
                        return {
                            title: m.title,
                            url: m.url,
                            thumbnail: typeof m.thumbnail === "string" ? m.thumbnail : m.thumbnail.displayThumbnailURL(),
                            duration: m.duration,
                            author: m.channel.name,
                            created_at: new Date(Date.parse(m.uploadedAt)) || Date.now(),
                            extractor: "Youtube"
                        } as TrackInitOptions;
                    });

                    return resolve(!track ? data : data.map((m) => new Track(m)));
                })
                .catch(() => reject("No result"));
        });
    }

    static isTrackFull(track: TrackInitOptions) {
        const props = ["title", "url", "thumbnail", "duration", "author", "created_at", "extractor"];
        let valid = false;

        for (const prop of props) {
            if (prop in track) valid = true;
            if (prop === "url" && typeof track[prop] !== "string") valid = false;
            if (prop === "duration" && typeof track[prop] !== "number") valid = false;
        }

        return valid;
    }
}

export { Util };
