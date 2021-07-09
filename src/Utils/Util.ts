import { Track } from "../audio/Track";
import YouTube from "youtube-sr";
import { TrackInitOptions } from "../types/types";
import { parse as ParseTOML } from "toml";
import MiniTimer from "./MiniTimer";

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

    static get regex() {
        return {
            YOUTUBE_PLAYLIST: /(PL|UU|LL|RD|OL)[a-zA-Z0-9-_]{16,41}/
        };
    }

    static noop() {} // eslint-disable-line @typescript-eslint/no-empty-function

    static wait(t: number): Promise<void> {
        return new Promise((r) => setTimeout(r, t));
    }

    static getYTVideo(query: string): Promise<{ info: Track; next?: Track }> {
        return new Promise((resolve, reject) => {
            YouTube.getVideo(query)
                .then((video) => {
                    if (!video) return reject("No result");
                    const m = video.videos[0];
                    const next = new Track({
                        title: m.title,
                        url: m.url,
                        thumbnail: typeof m.thumbnail === "string" ? m.thumbnail : m.thumbnail.displayThumbnailURL(),
                        duration: m.duration,
                        author: m.channel.name,
                        created_at: new Date(Date.parse(m.uploadedAt)) || new Date(),
                        extractor: "Youtube"
                    });

                    return resolve({
                        info: new Track({
                            title: video.title,
                            url: video.url,
                            thumbnail: typeof video.thumbnail === "string" ? (m.thumbnail as unknown as string) : m.thumbnail.displayThumbnailURL(),
                            duration: video.duration,
                            author: video.channel.name,
                            created_at: new Date(Date.parse(video.uploadedAt)) || new Date(),
                            extractor: "Youtube"
                        }),
                        next
                    });
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

    static parseToml<T>(data: string): T {
        try {
            return ParseTOML(data);
        } catch {
            return null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static setInterval(cb: () => any, timeout: number) {
        const timer = new MiniTimer(cb, timeout);
        return timer;
    }
}

export { Util };
