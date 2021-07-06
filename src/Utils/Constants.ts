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
    TRACK_START = 2,
    TRACK_FINISH = 3,
    TRACK_ERROR = 4,
    VOICE_CONNECTION_READY = 5,
    VOICE_CONNECTION_ERROR = 6,
    AUDIO_PLAYER_ERROR = 7
}
