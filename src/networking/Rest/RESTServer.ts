import express, { Request, Response, NextFunction } from "express";
import { Util } from "../../Utils/Util";
import PlayerRoutes from "./Routes/player";
import TrackRoutes from "./Routes/track";

class RESTServer {
    public ondebug: (m: string) => any = Util.noop; // eslint-disable-line @typescript-eslint/no-explicit-any
    public app = express();

    constructor(public readonly password: string, public readonly host: string, public readonly port: number) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.attachMiddleware();
        this.app.listen(this.port, this.host, () => {
            this.debug(`REST server started on port ${this.port}`);
        });
    }

    private attachMiddleware() {
        this.app.use((req, res, next) => {
            if (this.password && req.headers["authorization"] !== this.password) {
                return res.status(401).json({ error: "unauthorized" });
            }

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
            this.ondebug.call(this, `[${Date.now()}] ${m}`);
        } catch {} // eslint-disable-line no-empty
    }
}

export { RESTServer };
