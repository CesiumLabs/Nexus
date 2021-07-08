import { Router } from "express";
import ytdl, { YtResponse } from "@devsnowflake/youtube-dl-exec";
import { KnownSearchSource } from "../../../Utils/Constants";
import { TrackInitOptions } from "../../../types/types";
import { Util } from "../../../Utils/Util";

const router = Router();

router.get("/search", async (req, res) => {
    if (!req.query.query) return res.status(400).json({ error: 'missing query "query"!' });
    const query = req.query.query as string;
    let identifier = (req.query.identifier ?? "ytsearch") as KnownSearchSource;
    if (!Object.values(KnownSearchSource).includes(identifier)) return res.status(400).json({ error: "invalid search identifier" });
    const matchYTPL = query.match(Util.regex.YOUTUBE_PLAYLIST);
    if (matchYTPL) identifier = KnownSearchSource.YOUTUBE_PLAYLIST;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = [];

    if ([KnownSearchSource.SOUNDCLOUD, KnownSearchSource.YOUTUBE].includes(identifier)) {
        result =
            (await ytdl(`${identifier}10:${query}`, { dumpSingleJson: "" })
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
    } else if (identifier === KnownSearchSource.YOUTUBE_PLAYLIST) {
        result =
            (await ytdl(matchYTPL?.[0] ?? query, { dumpSingleJson: "" })
                .then((x) => {
                    return {
                        playlist: true,
                        title: x.title,
                        extractor: x.extractor_key,
                        id: x.id,
                        url: x.url,
                        author: x.uploader,
                        tracks: (x as unknown as { entries: YtResponse[] }).entries.map(
                            (m) =>
                                ({
                                    title: m.title ?? m.alt_title ?? m.fulltitle,
                                    author: m.uploader ?? m.artist ?? "Unknown artist",
                                    duration: (m.duration ?? 0) * 1000,
                                    thumbnail: m.thumbnail ?? null,
                                    url: m.webpage_url ?? m.url,
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    created_at: m.upload_date ? new Date(m.upload_date.slice(0, 4), m.upload_date.slice(4, 6), m.upload_date.slice(6)) : new Date(),
                                    extractor: m.extractor_key ?? "Youtube"
                                } as TrackInitOptions)
                        )
                    };
                })
                .catch(() => [])) ?? [];
    }

    return res.json({
        query,
        identifier,
        results: result
    });
});

export default router;
