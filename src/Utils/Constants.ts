export enum WSCloseCodes {
    UNKNOWN = 4000,
    NO_CLIENT_ID = 4001,
    NO_AUTH = 4002,
    NO_GUILD = 4003,
    DECODE_ERROR = 4004,
    UNKNOWN_OPCODE = 4005,
    SESSION_EXPIRED = 4006,
    SERVER_CLOSED = 4010
}

export enum WSCloseMessage {
    UNKNOWN = "Unknown Error",
    NO_CLIENT_ID = "Missing client-id in request headers",
    NO_AUTH = "Missing authorization in request headers",
    NO_GUILD = "No guild available",
    DECODE_ERROR = "Invalid payload",
    UNKNOWN_OPCODE = "Unknown opcode",
    SESSION_EXPIRED = "Session expired",
    SERVER_CLOSED = "Server Closed"
}

export enum WSOpCodes {
    HELLO = 0,
    VOICE_STATE_UPDATE = 1,
    TRACK_ADD = 2,
    TRACK_START = 3,
    TRACK_FINISH = 4,
    TRACK_ERROR = 5,
    VOICE_CONNECTION_READY = 6,
    VOICE_CONNECTION_ERROR = 7,
    AUDIO_PLAYER_ERROR = 8,
    QUEUE_END = 9,
    QUEUE_STATE_UPDATE = 10,
    VOICE_DISCONNECT = 11
}

export enum LoopMode {
    OFF = 0,
    TRACK = 1,
    QUEUE = 2
}
