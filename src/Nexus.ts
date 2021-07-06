import { TypedEmitter as EventEmitter } from "tiny-typed-emitter";
import { NexusConstructOptions } from "./types/types";
import { WebSocket } from "./networking/WebSocket/WebSocket";
import { RESTServer } from "./networking/Rest/RESTServer";

interface NexusEvents {
    wsLog: (message: string) => any;
    restLog: (message: string) => any;
}

class Nexus extends EventEmitter<NexusEvents> {
    ws: WebSocket;
    rest: RESTServer;

    constructor(public readonly options: NexusConstructOptions) {
        super();

        this.ws = new WebSocket(this.options.password, this.options.host, this.options.port + 1);
        this.ws.ondebug = (m) => this.emit("wsLog", m);

        this.rest = new RESTServer(this.options.password, this.options.host, this.options.port);
        this.rest.ondebug = (m) => this.emit("restLog", m);
    }
}

export { Nexus };
