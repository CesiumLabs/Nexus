import { Track } from "../audio/Track";
import YouTube from "youtube-sr";
import { TrackInitOptions } from "../types/types";

class Util extends null {
    private constructor() {} // eslint-disable-line @typescript-eslint/no-empty-function

    static parse<T>(data: any): T {
        // eslint-disable-line @typescript-eslint/no-explicit-any
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
                            extractor: "YouTube"
                        } as TrackInitOptions;
                    });

                    return resolve(!track ? data : data.map((m) => new Track(m)));
                })
                .catch(() => reject("No result"));
        });
    }
}

export { Util };
