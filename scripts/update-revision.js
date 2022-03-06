const fs = require("fs");
const { version } = require("../version.json");
let [major, minor, patch, revision] = version
  .split(".")
  .map((n) => parseInt(n, 10));

const target = "xhost-pro";

fs.writeFileSync(
  "../version.json",
  JSON.stringify({ version: `${major}.${minor}.${patch}.${++revision}` })
);

const arduinoCode = fs
  .readFileSync("../src/main.cpp", "utf8")
  .replace(
    /String xhostProVersionString = ".+?"/g,
    `String xhostProVersionString = "${version}.${target}"`
  );
fs.writeFileSync("../src/main.cpp", arduinoCode, "utf8");

const webusb = fs
  .readFileSync("../webusb/webusb.manifest.json", "utf8")
  .replace(/"version": "(.+?)"/g, `"version": "${version}.${target}"`);
fs.writeFileSync("../webusb/webusb.manifest.json", webusb, "utf8");
