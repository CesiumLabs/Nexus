import ytdl from "ytdl-core";
import { TrackInitOptions } from "../types/types";
import type { Readable } from "stream";

class Track {
    public readonly title = this.data.title;
    public readonly thumbnail = this.data.thumbnail;
    public readonly url = this.data.url;
    public readonly author = this.data.author;
    public readonly duration = this.data.duration;
    public readonly createdAt = this.data.created_at;

    constructor(public readonly data: TrackInitOptions) {}

    createStream(): Readable {
        const stream = ytdl(this.url, {
            filter: "audioonly",
            highWaterMark: 1 << 25
        });

        stream.on("error", () => {
            if (!stream.destroyed) stream.destroy();
        });

        return stream;
    }

    static async getInfo(url: string) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const info = (await ytdl.getInfo(url).catch(() => {})) as ytdl.videoInfo;

            return {
                author: info.videoDetails.author.name,
                duration: parseInt(info.videoDetails.lengthSeconds) * 1000 || 0,
                title: info.videoDetails.title,
                thumbnail: info.videoDetails.thumbnails[0].url,
                url: info.videoDetails.video_url,
                created_at: info.videoDetails.uploadDate as unknown as Date,
                extractor: "YouTube"
            } as TrackInitOptions;
        } catch (e) {
            return { error: "Could not parse track info" };
        }
    }

    toJSON() {
        return this.data;
    }
}

export { Track };
