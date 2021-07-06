import { Router } from "express";
import { Util } from "../../../Utils/Util";

const router = Router();

router.get("/ytsearch", (req, res) => {
    if (!req.query.query) return res.status(400).json({ error: 'missing query "query"!' });

    const start = Date.now();
    Util.ytSearch(req.query.query as string)
        .then((data) => {
            res.json({
                tracks: data,
                latency: Date.now() - start
            });
        })
        .catch(() => {
            res.status(404).json({
                error: "no results found",
                latency: Date.now() - start
            });
        });
});

export default router;
