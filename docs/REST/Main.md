# GET /stats
Returns node stats.

Response Example:

```js
{
    // timestamp when stats were checked
    "timestamp": 12345,

    // resource usage in bytes
    "ffmpeg_process": {
        "count": 0,
        "stats": []
    },
    "process": {
        "memory": {
            "rss": 12345,
            "heap_total": 12345,
            "heap_used": 12345,
            "external": 12345,
            "array_buffers": 12345
        },
        "cpu": {
            "count": 12345,
            "total_usage": 12345,
            "usage": {
                "user": 12345,
                "system": 12345
            }
        }
    },
    "clients": {
        "count": 1, // total clients
        "subscriptions": 1 // total voice subscriptions
    },
    "uptime": 300 // seconds
}
```