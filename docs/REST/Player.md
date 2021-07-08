# Player

Player is the manager for guild player.

## GET /api/player/:guildId
Get player info

## POST /api/player/:guildId
Play/add to queue

```ts
/* BODY */
interface {
    track: {
        url: string;
    }
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