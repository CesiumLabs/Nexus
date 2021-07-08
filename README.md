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
**[Click Me](https://github.com/DevSnowflake/Nexus/tree/main/docs)**

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
- Make sure you have FFmpeg/Avconv on path or at the root with the name `ffmpeg` or `avconv`
- Download `youtube-dl`:
  - Either
  ```shell
    $ npm install @devsnowflake/youtube-dl-exec
  ```

  - Or download binary from **[here](https://github.com/ytdl-org/youtube-dl/releases/latest)** and specify binary path via `--ytdl-path`
- Run the binary file you downloaded using `./path/to/nexus --start`