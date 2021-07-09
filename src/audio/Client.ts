import Collection from "@discordjs/collection";
import { DiscordGatewayAdapterLibraryMethods, joinVoiceChannel, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import type WS from "ws";
import type { Snowflake } from "discord-api-types";
import { WSEvents, WSOpCodes } from "../Utils/Constants";
import { SubscriptionManager } from "./Subscription";

class Client {
    public readonly adapters = new Collection<Snowflake, DiscordGatewayAdapterLibraryMethods>();
    public readonly subscriptions = new Collection<Snowflake, SubscriptionManager>();

    constructor(public readonly socket: WS, public readonly secret: string, public readonly statusUpdateInterval: number) {}

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

        entersState(connection, VoiceConnectionStatus.Ready, 60000)
            .then((conn) => {
                const subscription = new SubscriptionManager(conn, this, guild);
                this.bindEvents(subscription, guild);
                this.subscriptions.set(guild, subscription);
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.VOICE_CONNECTION_READY,
                        d: {
                            guild_id: guild,
                            ping: conn.ping
                        }
                    })
                );
            })
            .catch((e) => {
                connection.destroy();
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.VOICE_CONNECTION_ERROR,
                        d: {
                            guild_id: guild,
                            message: `${e.message || e}`
                        }
                    })
                );
            });
    }

    kill(guild: Snowflake) {
        try {
            this.subscriptions.get(guild)?.timer?.clear();
            this.subscriptions.get(guild)?.audioResource?.playStream?.destroy();
            this.subscriptions.get(guild)?.disconnect();
            const existed = this.subscriptions.delete(guild);
            if (existed)
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.VOICE_CONNECTION_DISCONNECT,
                        d: {
                            guild_id: guild
                        }
                    })
                );
        } catch {} // eslint-disable-line no-empty
    }

    private bindEvents(subscription: SubscriptionManager, guildID: Snowflake) {
        subscription
            .on("connectionError", (e) => {
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.AUDIO_PLAYER_ERROR,
                        d: {
                            guild_id: guildID,
                            message: e.message || `${e}`
                        }
                    })
                );
            })
            .on("start", (resource) => {
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.TRACK_START,
                        d: {
                            guild_id: guildID,
                            track: resource?.metadata?.toJSON() || {}
                        }
                    })
                );
            })
            .on("finish", (resource) => {
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.TRACK_FINISH,
                        d: {
                            guild_id: guildID,
                            track: resource?.metadata?.toJSON() || {}
                        }
                    })
                );
            })
            .on("error", (err) => {
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.TRACK_ERROR,
                        d: {
                            guild_id: guildID,
                            message: err.message || `${err}`
                        }
                    })
                );
            })
            .on("trackAdd", (track) => {
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.TRACK_ADD,
                        d: {
                            guild_id: guildID,
                            track: track?.toJSON() || {}
                        }
                    })
                );
            })
            .on("tracksAdd", (tracks) => {
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.TRACKS_ADD,
                        d: {
                            guild_id: guildID,
                            track: tracks?.map(m => m.toJSON()) || []
                        }
                    })
                );
            })
            .on("stop", () => {
                this.socket.send(
                    JSON.stringify({
                        t: WSEvents.QUEUE_END,
                        d: {
                            guild_id: guildID
                        }
                    })
                );
            });
    }
}

export { Client };
