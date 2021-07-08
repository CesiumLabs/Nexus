/* eslint-disable no-console */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../package.json");
import { Util } from "./Utils/Util";
import { readFile, existsSync } from "fs";
import type { NexusConstructOptions } from "./types/types";
import chalk from "chalk";
import { Command as Commander } from "commander";
import { generateDependencyReport } from "@discordjs/voice";

const commander = new Commander();
commander.version(version);
commander.configureHelp({
    commandUsage: () => "nexus [options]"
});
commander.allowUnknownOption(false);
commander.option("-s, --start", "Start Nexus").option("-ytdl, --ytdl-path <path>", "Set youtube-dl binary path").option("-c, --config <path>", "Set Nexus config path").option("-gr, --generate-report", "Get Nexus dependency report");

commander.parse(process.argv);
const options = commander.opts();

process.env.YOUTUBE_DL_DIR = options.ytdlPath || "./node_modules/@devsnowflake/youtube-dl-exec/bin";

// load it later
import { Nexus } from "./Nexus";

if (options.generateReport) {
    console.log(`${generateDependencyReport()}\nYouTube DL\n- path: ${process.env.YOUTUBE_DL_DIR}\n${"-".repeat(50)}`);
}

function initNexus() {
    const path = findPath() ?? `${__dirname}/${Date.now()}`; // placeholder
    console.log(chalk.redBright(`\n[Nexus] version ${version}\n`));

    readFile(path, (_, data) => {
        const configData = data ? Util.parse<NexusConstructOptions>(data) : null;

        const props = {
            ...configData,
            wsport: configData?.wsport ?? 8947,
            restport: configData?.restport ?? 7498
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

function findPath() {
    const paths = ["./nexus.config.js", "./nexus.config.json", "./.nexusconfig", "./.nexus.config"];

    if (options.config) paths.unshift(options.config);

    for (const path of paths) {
        if (existsSync(path)) return path;
        if (path === options.config) throw new Error(`Could not locate specified nexus config: ${path}`);
    }
}

if (options.start) initNexus();
