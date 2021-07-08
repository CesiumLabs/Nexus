import { AudioPlayerStatus } from "@discordjs/voice";
import { Snowflake } from "discord-api-types";
import { Router } from "express";
import { Track } from "../../../audio/Track";
import { PlayerPatchData, TrackInitOptions } from "../../../types/types";
import { LoopMode, WSEvents } from "../../../Utils/Constants";
import { Util } from "../../../Utils/Util";
import clients from "../../WebSocket/clients";

const router = Router();

router.post("/:guildID", async (req, res) => {
    const { guildID } = req.params;
    const clientID = req.clientUserID;

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

router.patch("/:guildID", (req, res) => {
    const { guildID } = req.params;
    const clientID = req.clientUserID;

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
        loop_mode: subscription.loopMode,
        guild_id: guildID
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
            loop_mode: subscription.loopMode,
            guild_id: guildID
        }
    };

    subscription.client.socket.send(
        JSON.stringify({
            t: WSEvents.QUEUE_STATE_UPDATE,
            d: payloadData
        })
    );

    return res.json(payloadData);
});

router.delete("/:guildID", (req, res) => {
    const { guildID } = req.params;
    const clientID = req.clientUserID;

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

router.get("/:guildID", (req, res) => {
    const { guildID } = req.params;
    const clientID = req.clientUserID;

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
