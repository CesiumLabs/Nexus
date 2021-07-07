# Nexus
Simple and minimalistic audio node for Discord based on **[@discordjs/voice](https://github.com/discordjs/voice)**

# WIP

# Features
- Standalone binary
- REST & WebSocket
- Easy to setup
- Multiple clients support
- Authorization support

# Documentation
Soon™️

# How to use
- download a binary for your os from **[here](https://github.com/DevSnowflake/Nexus/releases/latest)**
- create `nexus.config.json` at the root (or specify it via `--config`) and fill it up:
  
  ```json
    {
        "wsport": 3500,
        "restport": 3000,
        "password": "SwagLordNitroUser12345"
    }
  ```
- Download `youtube-dl`:
  - Either
  ```shell
    $ npm install @devsnowflake/youtube-dl-exec
  ```

  - Or download binary from **[here](https://github.com/ytdl-org/youtube-dl/releases/latest)** and specify binary path via `--ytdl-path`
- Run the binary file you downloaded using `./path/to/nexus --start`
- Now connect to the Nexus server (Discord.js example):
  
  ```js
    const { GatewayDispatchEvents } = require("discord-api-types/v8");
    const { WebSocket } = require("ws");
    const ws = new WebSocket("ws://localhost:3500", {
        headers: {
            "client-id": "YOUR_DISCORD_CLIENT_ID",
            "authorization": "SwagLordNitroUser12345"
        }
    });

    // setup event handler
    ws.on("message", data => {
        const message = JSON.parse(data);

        if (message.op === 1) client.guilds.cache.get(message.d.d.guild_id)?.shard.send(message.d);
    });

    client.ws.on(Constants.WSEvents.VOICE_SERVER_UPDATE, (payload) => {
        ws.send(JSON.stringify({ t: GatewayDispatchEvents.VoiceServerUpdate, d: payload }));
    });

    client.ws.on(Constants.WSEvents.VOICE_STATE_UPDATE, (payload) => {
        ws.send(JSON.stringify({ t: GatewayDispatchEvents.VoiceStateUpdate, d: payload }));
    });

    // join a voice channel
    fetch(`http://localhost:3000/api/${client.user.id}/${message.guild.id}/${message.member.voice.channelId}/subscription`, {
        method: "POST",
        headers: {
            authorization: "SwagLordNitroUser12345"
        }
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.error) return message.channel.send("Could not join the voice channel");
        return message.channel.send("Joined your voice channel!");
    })
    .catch(() => {
        message.channel.send("Could not join the voice channel");
    });

    // play a song
    fetch(`http://localhost:3000/api/${client.user.id}/${message.guild.id}/player`, {
        method: "POST",
        headers: {
            authorization: "SwagLordNitroUser",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            track: {
                url: someTrackURLHere
            }
        })
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.error) return message.channel.send("Could not play your song");
        message.channel.send(`Queued **${data.title}**`);
    })
    .catch(() => {
        message.channel.send("Could not play your song");
    });
  ```