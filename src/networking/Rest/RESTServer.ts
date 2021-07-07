import express, { Request, Response, NextFunction } from "express";
import { Util } from "../../Utils/Util";
import PlayerRoutes from "./Routes/player";
import TrackRoutes from "./Routes/track";

class RESTServer {
    public ondebug: (m: string) => any = Util.noop; // eslint-disable-line @typescript-eslint/no-explicit-any
    public app = express();

    constructor(public readonly password: string, public readonly host: string, public readonly port: number, public readonly blockedIP: string[] = []) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.attachMiddleware();
        this.app.listen(this.port, this.host, () => {
            this.debug(`REST server listening on port ${this.port}`);
        });
    }

    private attachMiddleware() {
        this.app.use((req, res, next) => {
            if (this.blockedIP?.includes((req.headers["x-forwarded-for"] || req.socket.remoteAddress) as string)) {
                this.debug(`[${req.method.toUpperCase()}] ${req.path} - Request from blocked ip`);
                return res.status(403).send({ error: "you are not allowed to connect" });
            }

            if (this.password && req.headers["authorization"] !== this.password) {
                this.debug(`[${req.method.toUpperCase()}] ${req.path} - Unauthorized request`);
                return res.status(401).json({ error: "unauthorized" });
            }

            this.debug(`[${req.method.toUpperCase()}] ${req.path} - Request incoming`);

            return next();
        });

        this.app.use("/api", PlayerRoutes);
        this.app.use("/tracks", TrackRoutes);

        this.app.all("*", (req, res) => {
            res.status(404).send({ error: "unknown route" });
        });

        this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
            if (res.headersSent) {
                return next(error);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return res.status(((error as any).status || (error as any).statusCode || 500) as number).send({ error: error.message || "internal server error" });
        });
    }

    debug(m: string) {
        try {
            this.ondebug.call(this, `[${new Date().toLocaleString()}] | ${m}\n`);
        } catch {} // eslint-disable-line no-empty
    }
}

export { RESTServer };
