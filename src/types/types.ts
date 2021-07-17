export interface NexusConstructOptions {
    server?: {
        host?: string;
        port?: number;
    };
    config?: {
        password?: string;
        blockedIP?: string[];
        updatePlayerStatusInterval?: number;
        playlistMaxPage?: number;
    };
}

export interface MessagePayload {
    op?: number;
    d?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    t?: string;
}

export interface TrackInitOptions {
    title: string;
    url: string;
    thumbnail: string;
    duration: number;
    author: string;
    created_at: Date;
    extractor: string;
    initial?: boolean;
}

export interface PlayerPatchData {
    paused?: boolean;
    volume?: number;
    encoder_args?: string[];
}
