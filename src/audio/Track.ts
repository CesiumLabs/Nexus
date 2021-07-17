import ytdlPromise, { raw as ytdl } from "@devsnowflake/youtube-dl-exec";
import { TrackInitOptions } from "../types/types";
import type { Readable } from "stream";

class Track {
    public readonly title = this.data.title;
    public readonly thumbnail = this.data.thumbnail;
    public readonly url = this.data.url;
    public readonly author = this.data.author;
    public readonly duration = this.data.duration;
    public readonly createdAt = this.data.created_at;
    public readonly initial = Boolean(this.data.initial);

    constructor(public readonly data: TrackInitOptions) {}

    createStream(): Readable {
        const ytdlProcess = ytdl(
            this.url,
            {
                o: "-",
                q: "",
                f: "bestaudio/best",
                noPlaylist: true
            },
            {
                stdio: ["ignore", "pipe", "ignore"]
            }
        );

        if (!ytdlProcess.stdout) throw new Error("No stdout");
        const stream = ytdlProcess.stdout;

        stream.on("error", () => {
            if (!ytdlProcess.killed) ytdlProcess.kill();
            stream.resume();
        });

        return stream;
    }

    static async getInfo(url: string) {
        try {
            const { uploader, artist, duration, title, thumbnail, webpage_url, upload_date, extractor_key } = await ytdlPromise(url, {
                dumpJson: ""
            });

            return {
                author: uploader || artist || "Unknown artist",
                duration: (duration || 0) * 1000,
                title: title || "Unknown stream",
                thumbnail: thumbnail || null,
                url: webpage_url || url,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                created_at: upload_date ? new Date(upload_date.slice(0, 4), upload_date.slice(4, 6), upload_date.slice(6)) : new Date(),
                extractor: extractor_key
            } as TrackInitOptions;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            return { error: "Could not parse track info" };
        }
    }

    toJSON() {
        return this.data;
    }
}

export { Track };
