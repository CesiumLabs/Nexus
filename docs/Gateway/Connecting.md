# Gateway

## Connecting

Nexus comes with a WebSocket server that you need to be connected and identified before using the **RESTful** API to manage your guild player.
You have to create a connection to Nexus WebSocket like this:

```js
const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:PORT", {
    headers: {
        "Authorization": "YourPassword",
        "client-id": "DISCORD_CLIENT_ID"
    }
});
```

As soon as you make a websocket connection with Nexus, you should expect the `HELLO` payload with opcode `0`. After receiving the `HELLO`,
clients should send `IDENTIFY` payload with opcode `10`. On sending `IDENTIFY` payload, Nexus will dispatch `READY` event that looks something like this:

```json
{
    "t": "READY",
    "d": {
        "client_id": "xxxxxxx",
        "access_token": "xxxxxxx"
    }
}
```

You should store the `access_token` for future use. This `access_token` is necessary in order to make requests to the `Nexus REST API`.

> You should keep this token safe, otherwise anybody on your network can modify your queue.

## Op Codes

```ts
enum WSOpCodes {
    HELLO = 0,
    VOICE_STATE_UPDATE = 1,
    IDENTIFY = 10,
    PING = 11,
    PONG = 12
}
```

> If the opcode received is `1`, you need to send the `payload.d` to discord via your discord client:
> ```js
> if (msg.op === 1) {
>     client.guilds.cache.get(msg.d.d.guild_id)?.shard.send(msg.d);
> }
> ```
>
> You also have to send voice state related events to nexus:
> ```js
> client.ws.on(Constants.WSEvents.VOICE_SERVER_UPDATE, (payload) => {
>    NexusWS.send(JSON.stringify({ t: Constants.WSEvents.VOICE_SERVER_UPDATE, d: payload }));
> });
> client.ws.on(Constants.WSEvents.VOICE_STATE_UPDATE, (payload) => {
>     NexusWS.send(JSON.stringify({ t: Constants.WSEvents.VOICE_STATE_UPDATE, d: payload }));
> });
> ```

## WebSocket Events

```ts
enum WSEvents {
    READY = "READY",
    TRACK_START = "TRACK_START",
    TRACK_FINISH = "TRACK_FINISH",
    TRACK_ERROR = "TRACK_ERROR",
    QUEUE_STATE_UPDATE = "QUEUE_STATE_UPDATE",
    VOICE_CONNECTION_READY = "VOICE_CONNECTION_READY",
    VOICE_CONNECTION_ERROR = "VOICE_CONNECTION_ERROR",
    VOICE_CONNECTION_DISCONNECT = "VOICE_CONNECTION_DISCONNECT",
    AUDIO_PLAYER_ERROR = "AUDIO_PLAYER_ERROR",
    AUDIO_PLAYER_STATUS = "AUDIO_PLAYER_STATUS"
}
```

## WebSocket Close Codes

```ts
enum WSCloseCodes {
    UNKNOWN = 4000,
    NO_CLIENT_ID = 4001,
    NO_AUTH = 4002,
    NO_GUILD = 4003,
    DECODE_ERROR = 4004,
    UNKNOWN_OPCODE = 4005,
    SESSION_EXPIRED = 4006,
    SERVER_CLOSED = 4010,
    NOT_ALLOWED = 4011,
    ALREADY_CONNECTED = 4012,
    NOT_IDENTIFIED = 4013
}
```