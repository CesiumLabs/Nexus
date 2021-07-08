import express, { Request, Response, NextFunction } from "express";
import { Util } from "../../Utils/Util";
import PlayerRoutes from "./Routes/player";
import SubscriptionRoutes from "./Routes/subscriptions";
import TrackRoutes from "./Routes/track";
import clients from "../WebSocket/clients";

class RESTServer {
    public ondebug: (m: string) => any = Util.noop; // eslint-disable-line @typescript-eslint/no-explicit-any
    public app = express();

    constructor(public readonly password: string, public readonly host: string, public readonly port: number, public readonly blockedIP: string[] = []) {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.set("x-powered-by", "nexus");
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

            if (!req.headers["authorization"]) {
                this.debug(`[${req.method.toUpperCase()}] ${req.path} - Unauthorized request`);
                return res.status(401).json({ error: "unauthorized" });
            }

            const clientAccess = this.verifyClient(req.headers["authorization"]);
            if (!clientAccess) return res.status(403).json({ error: "unknown client" });

            this.debug(`[${req.method.toUpperCase()}] ${req.path} - Request incoming (Client ID: ${clientAccess.client_id})`);

            req.clientUserID = clientAccess.client_id;

            return next();
        });

        this.app.get("/", (req, res) => res.json({ message: "hello world" }));
        this.app.use("/api/subscription", SubscriptionRoutes);
        this.app.use("/api/player", PlayerRoutes);
        this.app.use("/api/tracks", TrackRoutes);

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

    private verifyClient(t: string) {
        if (!t) return null;
        const client_id_raw = t.split(".").shift();
        if (!client_id_raw) return null;
        const client_id = Buffer.from(client_id_raw, "base64").toString();
        if (clients.find((x) => x.id === client_id && x.secret === t))
            return {
                access_token: t,
                client_id
            };
        return null;
    }

    debug(m: string) {
        try {
            this.ondebug.call(this, `[${this.time}] | ${m}\n`);
        } catch {} // eslint-disable-line no-empty
    }

    get time() {
        return new Date().toLocaleString();
    }
}

export { RESTServer };
