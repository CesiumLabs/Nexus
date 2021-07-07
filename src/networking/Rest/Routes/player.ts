import { AudioPlayerStatus } from "@discordjs/voice";
import { Snowflake } from "discord-api-types";
import { Router } from "express";
import { Track } from "../../../audio/Track";
import { PlayerPatchData, TrackInitOptions } from "../../../types/types";
import { LoopMode, WSOpCodes } from "../../../Utils/Constants";
import { Util } from "../../../Utils/Util";
import clients from "../../WebSocket/clients";

const router = Router();

router.post("/:clientID/:guildID/player", async (req, res) => {
    const { clientID, guildID } = req.params;

    if (!clientID || !guildID) {
        return res.status(400).json({ error: 'missing "client" or "guild" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    const subscription = client.subscriptions.get(guildID as Snowflake);
    if (!subscription) {
        return res.status(404).json({ error: `subscription is not available for ${guildID}` });
    }

    const track = req.body.track as TrackInitOptions;
    if (!track || !track.url) return res.status(400).json({ error: "track was not found in the request payload" });
    const info = await Track.getInfo(track.url).catch(Util.noop);
    if (!info || (info as { error: string }).error) return res.status(404).json({ error: "track not found" });

    const song = new Track(info as TrackInitOptions);

    try {
        res.json(info);
        subscription.queue.addTrack(song);
        if (subscription.audioPlayer.state.status !== AudioPlayerStatus.Idle) return;
        subscription.playStream(subscription.queue.tracks.shift(), true);
    } catch {
        res.status(500).send({ error: "could not play the track" });
    }
});

router.patch("/:clientID/:guildID/player", (req, res) => {
    const { clientID, guildID } = req.params;

    if (!clientID || !guildID) {
        return res.status(400).json({ error: 'missing "client" or "guild" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    const subscription = client.subscriptions.get(guildID as Snowflake);
    if (!subscription) {
        return res.status(404).json({ error: `subscription is not available for ${guildID}` });
    }

    const data = (req.body?.data ?? {}) as PlayerPatchData;
    const oldState = {
        volume: subscription.volume,
        paused: subscription.paused,
        loop_mode: subscription.loopMode
    };

    if ("paused" in data) {
        // eslint-disable-next-line no-extra-boolean-cast
        if (oldState.paused !== Boolean(data.paused)) Boolean(data.paused) ? subscription.pause() : subscription.resume();
    }

    if ("volume" in data) {
        const vol = parseInt(data.volume as unknown as string);
        if (oldState.volume !== vol && !isNaN(vol) && Number.isFinite(vol) && vol > 0) subscription.setVolume(vol);
    }

    if ("loop_mode" in data) {
        if (Object.values(LoopMode).includes(data.loop_mode)) {
            subscription.loopMode = data.loop_mode;
        }
    }

    const payloadData = {
        old_state: oldState,
        new_state: {
            volume: subscription.volume,
            paused: subscription.paused,
            loop_mode: subscription.loopMode
        }
    };

    subscription.client.socket.send(
        JSON.stringify({
            op: WSOpCodes.QUEUE_STATE_UPDATE,
            d: payloadData
        })
    );

    return res.json(payloadData);
});

router.delete("/:clientID/:guildID/player", (req, res) => {
    const { clientID, guildID } = req.params;

    if (!clientID || !guildID) {
        return res.status(400).json({ error: 'missing "client" or "guild" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    const subscription = client.subscriptions.get(guildID as Snowflake);
    if (!subscription) {
        return res.status(404).json({ error: `subscription is not available for ${guildID}` });
    }

    subscription.end();

    return res.status(204).send();
});

router.get("/:clientID/:guildID/:channelID/subscription", (req, res) => {
    const { clientID, guildID, channelID } = req.params;
    if (!clientID || !guildID || !channelID) {
        return res.status(400).json({ error: 'missing "client", "guild" or "channel" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    const subscription = client.subscriptions.get(guildID as Snowflake);
    if (!subscription) {
        return res.status(404).json({ error: `subscription is not available for ${guildID}` });
    }

    return res.json({
        guild: subscription.voiceConnection.joinConfig.guildId,
        channel: subscription.voiceConnection.joinConfig.channelId,
        self_deaf: subscription.voiceConnection.joinConfig.selfDeaf,
        latency: subscription.voiceConnection.ping
    });
});

router.post("/:clientID/:guildID/:channelID/subscription", (req, res) => {
    const { clientID, guildID, channelID } = req.params;
    if (!clientID || !guildID || !channelID) {
        return res.status(400).json({ error: 'missing "client", "guild" or "channel" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    if (client.subscriptions.has(guildID as Snowflake)) {
        return res.status(403).json({ error: `subscription is already available for ${guildID}` });
    }

    client.subscribe(guildID as Snowflake, channelID as Snowflake, req.query.self_deaf === "true");

    return res.status(201).json({
        message: `subscription created for ${guildID}`
    });
});

router.delete("/:clientID/:guildID/:channelID/subscription", (req, res) => {
    const { clientID, guildID, channelID } = req.params;
    if (!clientID || !guildID || !channelID) {
        return res.status(400).json({ error: 'missing "client", "guild" or "channel" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    const subscription = client.subscriptions.get(guildID as Snowflake);
    if (!subscription) {
        return res.status(404).json({ error: `subscription is not available for ${guildID}` });
    }

    subscription.disconnect();

    client.subscriptions.delete(guildID as Snowflake);

    return res.status(204).json();
});

router.get("/:clientID/:guildID/player/playing", (req, res) => {
    const { clientID, guildID } = req.params;

    if (!clientID || !guildID) {
        return res.status(400).json({ error: 'missing "client" or "guild" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    const subscription = client.subscriptions.get(guildID as Snowflake);
    if (!subscription) {
        return res.status(404).json({ error: `subscription is not available for ${guildID}` });
    }

    return res.json({
        current: subscription.queue.playing.toJSON(),
        next: (subscription.loopMode === LoopMode.TRACK ? subscription.queue.playing?.toJSON() : subscription.queue.tracks[0]?.toJSON()) ?? null,
        stream_time: subscription.streamTime
    });
});

router.get("/:clientID/:guildID/player", (req, res) => {
    const { clientID, guildID } = req.params;

    if (!clientID || !guildID) {
        return res.status(400).json({ error: 'missing "client" or "guild" param' });
    }

    const client = clients.find((c) => c.id === clientID);

    if (!client) {
        return res.status(403).json({ error: `client ${clientID} has no active websocket connection` });
    }

    const subscription = client.subscriptions.get(guildID as Snowflake);
    if (!subscription) {
        return res.status(404).json({ error: `subscription is not available for ${guildID}` });
    }

    return res.json({
        current: subscription.queue.playing?.toJSON() ?? null,
        stream_time: subscription.streamTime,
        loop_mode: subscription.loopMode,
        volume: subscription.volume,
        paused: subscription.paused,
        latency: subscription.voiceConnection.ping,
        tracks: subscription.queue.tracks.map((m) => m.toJSON())
    });
});

export default router;
