import { Router } from "express";
import clients from "../../WebSocket/clients";
import { Snowflake } from "discord-api-types";

const router = Router();

router.get("/:guildID/:channelID", (req, res) => {
    const { guildID, channelID } = req.params;
    const clientID = req.clientUserID;
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

router.post("/:guildID/:channelID", async (req, res) => {
    const { guildID, channelID } = req.params;
    const clientID = req.clientUserID;
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

    const success = await client.subscribe(guildID as Snowflake, channelID as Snowflake, Boolean(req.query.self_deaf));

    return res.status(201).json({
        success
    });
});

router.delete("/:guildID/:channelID", (req, res) => {
    const { guildID, channelID } = req.params;
    const clientID = req.clientUserID;
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

export default router;
