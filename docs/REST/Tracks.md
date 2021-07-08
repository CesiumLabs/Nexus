# Tracks
Endpoint for tracks (not related to subscription).

## /api/ytsearch?query={QUERY}
This route can be used to make youtube search. The data returned from this endpoint looks like this:

```json
{
    "tracks": [
        {
            "author": "Sub Urban",
            "duration": 142000,
            "title": "Sub Urban - PATCHWERK (with Two Feet) [Official Music Video]",
            "thumbnail": "https://i.ytimg.com/vi_webp/uaJIQYs0vm4/maxresdefault.webp?v=605d5da9",
            "url": "https://www.youtube.com/watch?v=uaJIQYs0vm4",
            "created_at": "2021-04-24T18:15:00.000Z",
            "extractor": "Youtube"
        },
        ...
    ],
    "latency": 200
}
```
