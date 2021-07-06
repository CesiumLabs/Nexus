import Collection from "@discordjs/collection";
import { DiscordGatewayAdapterLibraryMethods, joinVoiceChannel, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import type WS from "ws";
import type { Snowflake } from "discord-api-types";
import { WSOpCodes } from "../Utils/Constants";
import { SubscriptionManager } from "./Subscription";

class Client {
    public readonly adapters = new Collection<Snowflake, DiscordGatewayAdapterLibraryMethods>();
    public readonly subscriptions = new Collection<Snowflake, SubscriptionManager>();

    constructor(public readonly socket: WS) {}

    get id() {
        return (this.socket as any).__client_id__ as Snowflake; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    public subscribe(guild: Snowflake, channel: Snowflake, deaf?: boolean) {
        const connection = joinVoiceChannel({
            channelId: channel,
            guildId: guild,
            selfDeaf: Boolean(deaf),
            adapterCreator: (methods) => {
                this.adapters.set(guild, methods);

                return {
                    sendPayload: (data) => {
                        this.socket.send(
                            JSON.stringify({
                                op: WSOpCodes.VOICE_STATE_UPDATE,
                                d: data
                            })
                        );

                        return true;
                    },
                    destroy: () => {
                        this.adapters.delete(guild);
                        this.subscriptions.delete(guild);
                    }
                };
            }
        });

        entersState(connection, VoiceConnectionStatus.Ready, 30000)
            .then((conn) => {
                const subscription = new SubscriptionManager(conn);
                this.bindEvents(subscription);
                this.subscriptions.set(guild, subscription);
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.VOICE_CONNECTION_READY,
                        d: {
                            ping: conn.ping
                        }
                    })
                );
            })
            .catch((e) => {
                connection.destroy();
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.VOICE_CONNECTION_ERROR,
                        d: {
                            message: `${e.message || e}`
                        }
                    })
                );
            });
    }

    private bindEvents(subscription: SubscriptionManager) {
        subscription
            .on("connectionError", (e) => {
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.AUDIO_PLAYER_ERROR,
                        d: {
                            message: e.message || `${e}`
                        }
                    })
                );
            })
            .on("start", (resource) => {
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.TRACK_START,
                        d: resource?.metadata?.toJSON() || {}
                    })
                );
            })
            .on("finish", (resource) => {
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.TRACK_FINISH,
                        d: resource?.metadata?.toJSON() || {}
                    })
                );
            })
            .on("error", (err) => {
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.TRACK_ERROR,
                        d: err.message || `${err}`
                    })
                );
            })
            .on("trackAdd", (track) => {
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.TRACK_ADD,
                        d: track?.toJSON() || {}
                    })
                );
            })
            .on("stop", () => {
                this.socket.send(
                    JSON.stringify({
                        op: WSOpCodes.QUEUE_END,
                        d: {}
                    })
                );
            });
    }
}

export { Client };
