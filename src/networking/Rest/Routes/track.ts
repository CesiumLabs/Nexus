import { Router } from "express";
import ytdl, { YtResponse } from "@devsnowflake/youtube-dl-exec";
import { KnownSearchSource } from "../../../Utils/Constants";
import { TrackInitOptions } from "../../../types/types";
import { Util } from "../../../Utils/Util";
import YouTube from "youtube-sr";

const router = Router();

router.get("/search", async (req, res) => {
    if (!req.query.query) return res.status(400).json({ error: 'missing query "query"!' });
    const query = req.query.query as string;
    let identifier = (req.query.identifier ?? "ytsearch") as KnownSearchSource;
    if (!Object.values(KnownSearchSource).includes(identifier)) return res.status(400).json({ error: "invalid search identifier" });
    const matchYTPL = query.match(Util.regex.YOUTUBE_PLAYLIST);
    if (matchYTPL) identifier = KnownSearchSource.YOUTUBE_PLAYLIST;
    let limit = parseInt(req.query.limit as string) || 10;
    if (limit < 1 || !Number.isFinite(limit)) limit = 10;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = [];

    if ([KnownSearchSource.SOUNDCLOUD, KnownSearchSource.YOUTUBE].includes(identifier)) {
        if (identifier === KnownSearchSource.YOUTUBE) {
            result =
                (await YouTube.search(query, { type: "video", limit })
                    .then((resp) => {
                        return resp?.map((m) => ({
                            title: m.title,
                            author: m.channel?.name ?? "Unknown Artist",
                            duration: m.duration,
                            thumbnail: typeof m.thumbnail === "string" ? m.thumbnail : m.thumbnail.displayThumbnailURL(),
                            url: m.url,
                            created_at: m.uploadedAt,
                            extractor: "Youtube"
                        }));
                    })
                    .catch(() => [])) ?? [];
        } else {
            result =
                (await ytdl(`${identifier}${limit}:${query}`, { dumpSingleJson: "" })
                    .then((data) => {
                        return (data as unknown as { entries: YtResponse[] }).entries.map((m) => {
                            return {
                                title: m.title ?? m.alt_title ?? m.fulltitle,
                                author: m.uploader ?? m.artist ?? "Unknown artist",
                                duration: (m.duration ?? 0) * 1000,
                                thumbnail: m.thumbnail ?? null,
                                url: m.webpage_url ?? m.url,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                created_at: m.upload_date ? new Date(m.upload_date.slice(0, 4), m.upload_date.slice(4, 6), m.upload_date.slice(6)) : new Date(),
                                extractor: m.extractor_key
                            } as TrackInitOptions;
                        });
                    })
                    .catch(() => [])) ?? [];
        }
    } else if (identifier === KnownSearchSource.YOUTUBE_PLAYLIST) {
        result = await YouTube.getPlaylist(query)
            .then((x) => x.fetch(limit))
            .then((data) => {
                return {
                    playlist: true,
                    title: data.title,
                    extractor: "YoutubePlaylist",
                    id: data.id,
                    url: data.url,
                    author: data.channel.name,
                    tracks: data.videos.map((m) => ({
                        title: m.title,
                        author: m.channel?.name ?? "Unknown Artist",
                        duration: m.duration,
                        thumbnail: typeof m.thumbnail === "string" ? m.thumbnail : m.thumbnail.displayThumbnailURL(),
                        url: m.url,
                        created_at: m.uploadedAt,
                        extractor: "YoutubePlaylist"
                    }))
                };
            })
            .catch(() => []);
    }

    return res.json({
        query,
        identifier,
        results: result
    });
});

export default router;
