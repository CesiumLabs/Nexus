# Getting Started
- download `nexus` using `npm i reflect-nexus`
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
- Make sure you have `Python` installed for `youtube-dl`
- Run the binary file you downloaded using `reflect-nexus --start`