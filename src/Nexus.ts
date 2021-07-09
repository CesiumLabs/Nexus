import { TypedEmitter as EventEmitter } from "tiny-typed-emitter";
import { NexusConstructOptions } from "./types/types";
import { WebSocket } from "./networking/WebSocket/WebSocket";
import { RESTServer } from "./networking/Rest/RESTServer";
import { createServer } from "http";

interface NexusEvents {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    wsLog: (message: string) => any;
    restLog: (message: string) => any;
    /* eslint-enable @typescript-eslint/no-explicit-any */
}

class Nexus extends EventEmitter<NexusEvents> {
    ws: WebSocket;
    rest: RESTServer;
    server = createServer();

    constructor(public readonly options: NexusConstructOptions) {
        super();

        this.ws = new WebSocket(this.options.config?.password, this.options.config?.blockedIP ?? [], this.server, typeof this.options.config.updatePlayerStatusInterval === "number" ? this.options.config.updatePlayerStatusInterval : -1);
        this.ws.ondebug = (m) => this.emit("wsLog", m);

        this.rest = new RESTServer(this.options.config?.blockedIP ?? []);
        this.rest.ondebug = (m) => this.emit("restLog", m);

        this.server.on("request", this.rest.app);

        this.server.listen(this.options.server?.port, this.options.server?.host);

        this.server.on("listening", () => {
            this.rest.debug(`Server listening on port ${this.options.server?.host ?? "localhost"}:${this.options.server?.port}!`);
            this.ws.debug(`Server listening on port ${this.options.server?.host ?? "localhost"}:${this.options.server?.port}!`);
        });
    }
}

export { Nexus };
