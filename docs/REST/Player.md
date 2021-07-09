# Player

Player is the manager for guild player.

## GET /api/player/:guildId
Get player info

## POST /api/player/:guildId
Play/add to queue. If **[full track object](https://github.com/DevSnowflake/Nexus/blob/main/docs/REST/Tracks.md#ytsearchqueryquery)** is provided, it queues that track without parsing info. If provided `url` only, nexus will try to get info about that url and queue it.

```ts
/* BODY */
interface {
    tracks: [
        {
            url: string;
            initial?: boolean; // if this track needs to be pushed at index 0, defaults to false
        },
        ...
    ]
}
```

## PATCH /api/player/:guildId
Modify player (eg: updating loop mode, volume etc.). Returns `204` empty response.

```ts
/* BODY */
interface {
    data: {
        paused?: boolean;
        loop_mode?: 0 | 1 | 2;
        volume?: number;
    }
}
```

> On using this, `QUEUE_STATE_UPDATE` event is dispatched!

## DELETE /api/player/:guildId
End current track