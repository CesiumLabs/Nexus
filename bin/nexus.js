#!/usr/bin/env node

const { version } = require("../package.json");
const { Util } = require("../dist/index");
const { readFile, existsSync } = require("fs");
const chalk = require("chalk");
const { Command: Commander } = require("commander");
const { generateDependencyReport } = require("@discordjs/voice");

const commander = new Commander();
commander.version(version);
commander.configureHelp({
    commandUsage: () => "nexus [options]"
});
commander.allowUnknownOption(false);
commander.option("-s, --start", "Start Nexus");
commander.option("-ytdl, --ytdl-path <path>", "Set youtube-dl binary path");
commander.option("-c, --config <path>", "Set Nexus config path");
commander.option("-gr, --generate-report", "Get Nexus dependency report");
commander.option("-p, --port <port>", "Set web server port for Nexus");
commander.option("-h, --host <hostname>", "Set web server hostname for Nexus");
commander.option("-pass, --password <password>", "Set password for Nexus");
commander.option("-upsi, --update-player-status-interval <interval>", "Set interval to send player status to clients");

commander.parse(process.argv);
const options = commander.opts();

process.env.YOUTUBE_DL_DIR = options.ytdlPath || "./node_modules/@devsnowflake/youtube-dl-exec/bin";

// load it later
const { Nexus } = require("../dist/index");

if (options.generateReport) {
    console.log(`${generateDependencyReport()}\nYouTube DL\n- path: ${process.env.YOUTUBE_DL_DIR}\n${"-".repeat(50)}`);
}

function initNexus() {
    console.log(
        chalk.greenBright(`\n
 _        _______                    _______
( (    /|(  ____ \\|\\     /||\\     /|(  ____ \\
|  \\  ( || (    \\/( \\   / )| )   ( || (    \\/
|   \\ | || (__     \\ (_) / | |   | || (_____
| (\\ \\) ||  __)     ) _ (  | |   | |(_____  )
| | \\   || (       / ( ) \\ | |   | |      ) |
| )  \\  || (____/\\( /   \\ )| (___) |/\\____) |
|/    )_)(_______/|/     \\|(_______)\\_______)\n
`)
    );
    const path = findPath() ?? `${__dirname}/${Date.now()}`; // placeholder
    console.log(chalk.redBright(`\n[Nexus] version ${version} | Nodejs ${process.version}\n`));

    readFile(path, { encoding: "utf-8" }, (_, data) => {
        const configData = data ? Util.parseToml(data) : null;

        const props = {
            server: {
                host: options?.hostname ?? configData?.server?.host,
                port: parseInt(options?.port) || process.env.PORT || configData?.server?.port || 4957
            },
            config: {
                password: options?.password ?? configData?.config?.password,
                blockedIP: configData?.config.blockedIP ?? [],
                playlistMaxPage: configData?.config.playlistMaxPage ?? 100,
                updatePlayerStatusInterval: parseInt(options?.upsi) || configData?.config?.updatePlayerStatusInterval || -1
            }
        };

        const nexus = new Nexus(props);

        console.log(chalk.greenBright("[Nexus]"), chalk.whiteBright("Server config:"), chalk.cyanBright(`Port: ${nexus.options.server?.port}`));

        nexus.on("wsLog", (msg) => {
            console.log(chalk.cyanBright("[Nexus::WebSocket]"), chalk.whiteBright(msg));
        });

        nexus.on("restLog", (msg) => {
            console.log(chalk.greenBright("[Nexus::REST]"), chalk.whiteBright(msg));
        });
    });
}

function findPath() {
    const paths = ["./nexus.config.toml", "./.nexusconfig.toml", "./.nexus.config.toml", "./.nexus.toml"];

    if (options.config) paths.unshift(options.config);

    for (const path of paths) {
        if (existsSync(path)) return path;
        if (path === options.config) throw new Error(`Could not locate specified nexus config: ${path}`);
    }
}

if (options.start) initNexus();