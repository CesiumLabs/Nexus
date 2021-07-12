import { Router } from "express";
import findProcess from "find-process";
import pidusage from "pidusage";
import { cpus } from "os";
import clients from "../../WebSocket/clients";

const router = Router();

function getResourceUsage(p: { name: string; pid: string | number }) {
    return new Promise<pidusage.Status>((resolve) => {
        pidusage(p.pid, (err, stats) => {
            if (err) resolve(null);
            resolve(stats);
        });
    });
}

router.get("/", (req, res) => {
    return res.json({ message: "hello world" });
});

router.get("/stats", async (req, res) => {
    const FFmpegProcess = await findProcess("name", "ffmpeg")
        .then((x) =>
            x.map((m) => ({
                name: m.name,
                pid: m.pid
            }))
        )
        .catch(() => []);
    const usage = await Promise.all(FFmpegProcess.map((m) => getResourceUsage(m))).then((x) => x.filter((y) => !!y));

    const data = {
        timestamp: Date.now(),
        ffmpeg_process: {
            count: usage.length,
            stats: usage.map((m) => ({ cpu: m.cpu, memory: m.memory }))
        },
        process: {
            memory: {
                rss: process.memoryUsage().rss,
                array_buffers: process.memoryUsage().arrayBuffers,
                external: process.memoryUsage().external,
                heap_total: process.memoryUsage().heapTotal,
                heap_used: process.memoryUsage().heapUsed
            },
            cpu: {
                count: cpus().length,
                total_usage: cpus()
                    .map((m) => m.times.idle + m.times.irq + m.times.nice + m.times.sys + m.times.user)
                    .reduce((a, c) => a + c, 0),
                usage: process.cpuUsage()
            }
        },
        clients: {
            count: clients.size,
            subscriptions: clients.reduce((a, c) => a + c.subscriptions.size, 0)
        },
        uptime: Math.floor(process.uptime())
    };

    res.json(data);
});

export default router;
