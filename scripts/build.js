/* eslint-disable */

const { exec } = require("pkg");

const OUTPUT_NAME = `nexus-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}${process.platform === "win32" ? ".exe" : ""}`;
const OUTPUT_PATH = `${__dirname}/../dist/${OUTPUT_NAME}`;

// build the binary file
exec([".", "--target", "host", "--compress", "Brotli", "--output", OUTPUT_PATH])
    .then(() => {
        console.log(`Successfully created binary file: ${OUTPUT_PATH}`);
    })
    .catch(() => {
        throw new Error("Could not build the binary!");
    });
