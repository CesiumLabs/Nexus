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
    }
}
```

## PUT /api/player/:guildId
Same as `POST` method but allows you to queue multiple tracks at once. (useful for playlists)

```ts
/* BODY */
interface {
    tracks: [
        {
            url: string;
        },
        ...
    ]
}
```

## PATCH /api/player/:guildId
Modify player (eg: updating loop mode, volume etc.)

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