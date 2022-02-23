const fs = require("fs");
const { argv } = require("process");
const { version } = require("../version.json");

const [target = "fw", context = "base"] = argv.slice(2);

let [major, minor, patch, revision] = version
  .split(".")
  .map((n) => parseInt(n, 10));
revision -= 1;

const XHOSTHeader = Buffer.from([88, 72, 79, 83, 84, 45, 80, 82, 79]);
const processBinary = (source, destination) => {
  const otaBytes = fs.readFileSync(source);

  const otaBytesOutput = Buffer.concat([
    XHOSTHeader,
    Buffer.from(new Uint16Array([major, minor, patch, revision]).buffer),
    otaBytes,
  ]);

  fs.writeFileSync(destination, otaBytesOutput);
};

const otaVersion = `${[major, minor, patch].join(".")}`;

if (!fs.existsSync("../release")) {
  fs.mkdirSync("../release");
}
if (target === "fw") {
  processBinary(
    `../.pio/build/d1/firmware.bin`,
    `../release/esp8266-${context}.fw.ota`
  );
  processBinary(
    `../.pio/build/esp32-s2/firmware.bin`,
    `../release/esp32-s2-${context}.fw.ota`
  );
} else {
  processBinary(
    `../.pio/build/d1/littlefs.bin`,
    `../release/esp8266-${context}.fs.ota`
  );
  processBinary(
    `../.pio/build/esp32-s2/.bin`,
    `../release/esp32-s2-${context}.fs.ota`
  );
}
