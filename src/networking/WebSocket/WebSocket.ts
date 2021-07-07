import type { IncomingMessage } from "http";
import WS from "ws";
import { WSCloseCodes, WSCloseMessage, WSOpCodes } from "../../Utils/Constants";
import { Util } from "../../Utils/Util";
import { MessagePayload } from "../../types/types";
import { Client } from "../../audio/Client";
import { GatewayDispatchEvents } from "discord-api-types/v8";
import clients from "./clients";

class WebSocket {
    public ws: WS.Server;
    public ondebug: (message: string) => any = Util.noop; // eslint-disable-line @typescript-eslint/no-explicit-any

    constructor(public readonly password: string, public readonly host: string, public readonly port: number) {
        this.log("Initializing WebSocket server...");

        this.ws = new WS.Server({
            host,
            port
        });

        this.ws.on("listening", () => {
            this.log(`WebSocket server listening on port ${this.port}!`);
        });

        this.ws.on("connection", this.handleConnection.bind(this));
    }

    private handleConnection(ws: WS, request: IncomingMessage) {
        const clientID = request.headers["client-id"] as string;
        if (!clientID) return ws.close(WSCloseCodes.NO_CLIENT_ID, WSCloseMessage.NO_CLIENT_ID);
        if (this.password && request.headers.authorization !== this.password) return ws.close(WSCloseCodes.NO_AUTH, WSCloseMessage.NO_AUTH);
        if (clients.has(clientID)) {
            const previousSocket = clients.get(clientID)?.socket;
            if (previousSocket && previousSocket.readyState !== previousSocket.CLOSED) {
                previousSocket.close(WSCloseCodes.SESSION_EXPIRED, WSCloseMessage.SESSION_EXPIRED);
            }
        }

        // just in case
        Object.defineProperty(ws, "__client_id__", {
            value: clientID
        });

        const wsClient = new Client(ws);

        clients.set(clientID, wsClient);

        this.send(ws, {
            op: WSOpCodes.HELLO,
            d: {
                ready: Date.now()
            }
        });

        this.log(`HELLO dispatched to ${clientID}`);

        ws.on("message", this.handleWSMessage.bind(this, wsClient));
        ws.on("close", (code, reason) => {
            this.log(`Connection was closed for "${clientID}" with the code "${code}" and reason "${reason}"`);
            clients.delete(clientID);
        });
    }

    private handleWSMessage(client: Client, msg: WS.Data) {
        const message = Util.parse<MessagePayload>(msg);
        this.log(`Server got: ${msg}`);
        const ws = client.socket;

        if (!message) {
            this.log(`client ${this.getID(ws)} sent an invalid payload!`);
            return ws.close(WSCloseCodes.DECODE_ERROR, WSCloseMessage.DECODE_ERROR);
        }

        switch (message.t) {
            case GatewayDispatchEvents.VoiceStateUpdate:
                {
                    if (message.d.guild_id && message.d.session_id && message.d.user_id === this.getID(client.socket)) {
                        const adapter = client.adapters.get(message.d.guild_id);
                        adapter?.onVoiceStateUpdate(message.d);
                    }
                }
                break;
            case GatewayDispatchEvents.VoiceServerUpdate:
                {
                    const adapter = client.adapters.get(message.d.guild_id);
                    adapter?.onVoiceServerUpdate(message.d);
                }
                break;
            default:
                break;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send(ws: WS, data: any) {
        return ws.send(JSON.stringify(data), Util.noop);
    }

    close() {
        this.log("Closing the server...");

        this.ws.clients.forEach((client) => {
            if (client.readyState !== client.OPEN) return;
            client.close(WSCloseCodes.SERVER_CLOSED, WSCloseMessage.SERVER_CLOSED);
        });

        this.ws.close(Util.noop);
        clients.clear();
    }

    private getID(ws: WS) {
        return (ws as any)["__client_id__"]; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    private log(msg: string) {
        try {
            this.ondebug.call(this, `[${new Date().toLocaleString()}] ${msg}\n`);
        } catch {} // eslint-disable-line no-empty
    }
}

export { WebSocket };
