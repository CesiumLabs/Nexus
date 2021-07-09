# Getting Started
- download a binary for your os from **[here](https://github.com/DevSnowflake/Nexus/releases/latest)**
- (optional) create `nexus.config.toml` at the root (or specify the path via `--config`) and fill it up:
  
  ```toml
    [server]
    port = 3000
    # host = "localhost"

    [config]
    password = "SwagLordNitroUser12345"
    # How frequently the server should send player status updates to the client
    # -1 for none
    updatePlayerStatusInterval = 5000 
    # blockedIP = [] # List of blacklisted IPs
  ```
- Make sure you have FFmpeg/Avconv on path or at the root with the name `ffmpeg` or `avconv`
- Download `youtube-dl`:
  - Either
  ```shell
    $ npm install @devsnowflake/youtube-dl-exec
  ```

  - Or download binary from **[here](https://github.com/ytdl-org/youtube-dl/releases/latest)** and specify binary path via `--ytdl-path`
- Run the binary file you downloaded using `./path/to/nexus --start`