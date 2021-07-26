# Player

Player is the manager for guild player.

## GET /api/player/:guildId
Get player info

## POST /api/player/:guildId
Play/add to queue. If **[full track object](https://github.com/DevSnowflake/Nexus/blob/main/docs/REST/Tracks.md#ytsearchqueryquery)** is provided, it queues that track without parsing info. If provided `url` only, nexus will try to get info about that url and queue it.

```ts
/* BODY */
interface {
    track: {
        url: string;
        config?: {
            encoder_args?: string[];
            volume?: number;
        }
    }
}
```

## PATCH /api/player/:guildId
Modify player (eg: updating loop mode, volume etc.). Returns `204` empty response.

```ts
/* BODY */
interface {
    data: {
        paused?: boolean;
        volume?: number;
        encoder_args?: string[];
    }
}
```

> On using this, `PLAYER_STATE_UPDATE` event is dispatched!

## DELETE /api/player/:guildId
End current track