export interface NexusConstructOptions {
    password?: string;
    port?: number;
    host?: string;
}

export interface MessagePayload {
    op?: number;
    d?: any;
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
}
