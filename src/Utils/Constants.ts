export enum WSCloseCodes {
    UNKNOWN = 4000,
    NO_CLIENT_ID = 4001,
    NO_AUTH = 4002,
    NO_GUILD = 4003,
    DECODE_ERROR = 4004,
    UNKNOWN_OPCODE = 4005,
    SESSION_EXPIRED = 4006,
    SERVER_CLOSED = 4010,
    NOT_ALLOWED = 4011,
    ALREADY_CONNECTED = 4012,
    NOT_IDENTIFIED = 4013
}

export enum WSCloseMessage {
    UNKNOWN = "Unknown Error",
    NO_CLIENT_ID = "Missing client-id in request headers",
    NO_AUTH = "Missing authorization in request headers",
    NO_GUILD = "No guild available",
    DECODE_ERROR = "Invalid payload",
    UNKNOWN_OPCODE = "Unknown opcode",
    SESSION_EXPIRED = "Session expired",
    SERVER_CLOSED = "Server Closed",
    NOT_ALLOWED = "Not allowed to connect",
    ALREADY_CONNECTED = "Already connected",
    NOT_IDENTIFIED = "This client is not identified"
}

export enum WSOpCodes {
    HELLO = 0,
    VOICE_STATE_UPDATE = 1,
    IDENTIFY = 10
}

export enum WSEvents {
    READY = "READY",
    TRACK_ADD = "TRACK_ADD",
    TRACKS_ADD = "TRACKS_ADD",
    TRACK_START = "TRACK_START",
    TRACK_FINISH = "TRACK_FINISH",
    TRACK_ERROR = "TRACK_ERROR",
    QUEUE_END = "QUEUE_END",
    QUEUE_STATE_UPDATE = "QUEUE_STATE_UPDATE",
    VOICE_CONNECTION_READY = "VOICE_CONNECTION_READY",
    VOICE_CONNECTION_ERROR = "VOICE_CONNECTION_ERROR",
    VOICE_CONNECTION_DISCONNECT = "VOICE_CONNECTION_DISCONNECT",
    AUDIO_PLAYER_ERROR = "AUDIO_PLAYER_ERROR",
    AUDIO_PLAYER_STATUS = "AUDIO_PLAYER_STATUS"
}

export enum LoopMode {
    OFF = 0,
    TRACK = 1,
    QUEUE = 2
}

export enum KnownSearchSource {
    YOUTUBE = "ytsearch",
    SOUNDCLOUD = "scsearch",
    YOUTUBE_PLAYLIST = "ytplaylist"
}
