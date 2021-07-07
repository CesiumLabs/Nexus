/* eslint-disable no-console */

import { Nexus } from "./Nexus";
import { Util } from "./Utils/Util";
import { readFile, existsSync } from "fs";
import type { NexusConstructOptions } from "./types/types";
import chalk from "chalk";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../package.json");
const path = "./nexus.config.json";

function initNexus() {
    process.env.YOUTUBE_DL_DIR = `${__dirname}/bin`;
    console.log(chalk.redBright(`[Nexus] version ${version}`));
    if (!existsSync(path)) throw new Error('[Nexus] Could not locate "nexus.config.json"');

    readFile(path, (error, data) => {
        if (error) throw new Error('[Nexus] Could not read "nexus.config.json"');
        const configData = Util.parse<NexusConstructOptions>(data);
        if (!configData) throw new Error("[Nexus] Invalid nexus config");

        const props = {
            ...configData,
            wsport: configData.wsport ?? 8947,
            restport: configData.restport ?? 7498
        } as NexusConstructOptions;

        const nexus = new Nexus(props);

        console.log(chalk.greenBright("[Nexus]"), chalk.whiteBright("Server config:"), chalk.cyanBright(`WS Port: ${nexus.options.wsport}`), chalk.cyanBright(`REST Port: ${nexus.options.restport}`));

        nexus.on("wsLog", (msg) => {
            console.log(chalk.cyanBright("[Nexus::WebSocket]"), chalk.whiteBright(msg));
        });

        nexus.on("restLog", (msg) => {
            console.log(chalk.greenBright("[Nexus::REST]"), chalk.whiteBright(msg));
        });
    });
}

initNexus();
