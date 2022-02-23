xhostAppData = {
  ...xhostAppData,
  xhostPro: {
    config: {},
    ssid: {},
    version: "",
  },
};

selectStores = { ...selectStores, microSD: "disabled" };

const select__usbDelay = (option) => {
  const value = option.value;
  const mode = value === "0" ? "manual" : "auto";
  selectStores.usbDelay = value;
  selectStores.usbMode = mode;
  const formData = new FormData();
  formData.append("usbMode", mode);
  formData.append("usbDelay", value);

  fetch("/xhost/config", {
    method: "POST",
    body: formData,
  }).then(() => {
    notify("Configuration Updated");
  });
};

const select__microSD = (option) => {
  alert(option.innerText + " select__microSD ," + option.value);
};

selects = {
  ...selects,
  select__usbDelay,
  select__microSD,
};

const loadSsidConfig = () => {
  return fetch("/xhost/wifi/ssid")
    .then((r) => r.json())
    .then((r) => {
      xhostAppData.xhostPro.ssid = r;
      return r;
    });
};
const loadConfig = () =>
  fetch("/config.json")
    .then((r) => r.json())
    .then((config) => {
      const { usbDelay, usbMode } = config;
      window.XHOST_USB_MODE = usbMode || "manual";
      xhostAppData.xhostPro.config = config;
      selectStores = {
        ...selectStores,
        usbDelay,
        usbMode,
      };
    });

const loadVersion = () => {
  return fetch("/xhost/version")
    .then((r) => r.json())
    .then((result) => {
      const { flashVersion } = result;
      xhostAppData.xhostPro.version = flashVersion.replace(".xhost-pro", "");
      return flashVersion;
    });
};

/* semver compare */
const semverCompare = (a, b) => {
  const pa = a.split(".");
  const pb = b.split(".");
  for (var i = 0; i < 3; i++) {
    const na = Number(pa[i]);
    const nb = Number(pb[i]);
    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!isNaN(na) && isNaN(nb)) return 1;
    if (isNaN(na) && !isNaN(nb)) return -1;
  }
  return 0;
};

const isValidHeader = (headerArray) => {
  return (
    [88, 72, 79, 83, 84, 45, 80, 82, 79]
      .map((e, idx) => {
        return e === headerArray[idx];
      })
      .filter((e) => e === false).length === 0
  );
};

const fileMD5 = (file) => {
  return new Promise((resolve, reject) => {
    const blobSlice =
      File.prototype.slice ||
      File.prototype["mozSlice"] ||
      File.prototype["webkitSlice"];

    const chunkSize = 2097152; // Read in chunks of 2MB
    const chunks = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    let currentChunk = 0;

    const loadNext = () => {
      const start = currentChunk * chunkSize;
      const end =
        start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    };

    let major;
    let minor;
    let patch;
    let revision;
    let fwTarget = "xhost-pro";

    fileReader.onload = (e) => {
      if (currentChunk === 0) {
        const result = e.target.result;

        if (!isValidHeader(new Uint8Array(result.slice(0, 9)))) {
          reject("Invalid Header");
        }
        const uint16VersionArray = new Uint16Array(result.slice(9, 17));
        major = uint16VersionArray[0];
        minor = uint16VersionArray[1];
        patch = uint16VersionArray[2];
        revision = uint16VersionArray[3];

        spark.append(result.slice(17)); // Append array buffer
      } else {
        spark.append(e.target.result); // Append array buffer
      }
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        notify(
          `Updating firmware v${[major, minor, patch, revision, fwTarget].join(
            "."
          )}<br/>It can take several minutes<br/>Please wait...`,
          1,
          0,
          20000
        );

        resolve([spark.end(), major, minor, patch, revision, fwTarget]); // Compute hash
      }
    };

    fileReader.onerror = function () {
      notify("Oops, something went wrong.", 1);
      reject();
    };

    loadNext();
  });
};

const updateOTA = (file) => {
  if (!file) {
    return;
  }

  fetch("/xhost/version")
    .then((r) => r.json())
    .then((result) => {
      const { flashVersion } = result;
      const [flashMajor, flashMinor, flashPatch, flashRevision, flashTarget] =
        flashVersion.split(".").map((e, i) => {
          if (i < 4) {
            return parseInt(e, 10);
          }
          return e;
        });

      fileMD5(file)
        .then(([md5, major, minor, patch, revision, fwVersion]) => {
          if (fwVersion !== flashTarget) {
            notify("Invalid Board Firmware", 1);
            return;
          }
          const formData = new FormData();
          const request = new XMLHttpRequest();
          request.addEventListener("load", () => {
            if (request.status === 200) {
              notify(`Firmware Update Completed!<br/>Reseting...`);
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            } else if (request.status === 500) {
              notify("Unknown server Error. Please Retry", 1);
            } else {
              notify(request.responseText, 1);
            }
          });
          // request.withCredentials = true;
          let reader = new FileReader();
          reader.onload = function (e) {
            if (
              semverCompare(
                [major, minor, patch].join("."),
                [flashMajor, flashMinor, flashPatch].join(".")
              ) === -1
            ) {
              notify(
                `Invalid Firmware version ${[
                  flashMajor,
                  flashMinor,
                  flashPatch,
                ].join(
                  "."
                )}.<br/>Only same or newer FW versions can be updated via OTA.`,
                1,
                0,
                8000
              );
              return;
            }

            const blob = new Blob([new Uint8Array(e.target.result).slice(17)], {
              type: "application/octet-stream",
            });
            const filename = file.name.includes(".fw.ota")
              ? "firmware"
              : "filesystem";
            const fileBlob = new File([blob], filename, {
              type: "application/octet-stream",
            });
            formData.append("MD5", md5);
            formData.append(filename, fileBlob, filename);
            request.open("post", "/xhost/update");
            request.send(formData);
          };
          reader.readAsArrayBuffer(file);
        })
        .catch((error) => {
          notify(error || "Unknown error while uploading Firmware", 1);
        });
    });
};

const downloadOTA = (url) => {
  return fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buffer) => {
      return new Blob([new Uint8Array(buffer)], {
        type: "application/octet-stream",
      });
    });
};

const downloadUpdateOTA = (url) => {
  if (!url) {
    return;
  }

  fetch("/xhost/version")
    .then((r) => r.json())
    .then((result) => {
      const { flashVersion } = result;
      const [flashMajor, flashMinor, flashPatch, flashRevision, flashTarget] =
        flashVersion.split(".").map((e, i) => {
          if (i < 4) {
            return parseInt(e, 10);
          }
          return e;
        });

      let otaBlob;
      downloadOTA(url)
        .then((file) => {
          otaBlob = file;
          return fileMD5(file);
        })
        .then(([md5, major, minor, patch, revision, fwVersion]) => {
          if (fwVersion !== flashTarget) {
            notify("Invalid Board Firmware", 1);
            return;
          }
          const formData = new FormData();
          const request = new XMLHttpRequest();
          request.addEventListener("load", () => {
            if (request.status === 200) {
              notify(`Firmware Update Completed!<br/>Reseting...`);
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            } else if (request.status === 500) {
              notify("Server Error", 1);
            } else {
              notify(request.responseText, 1);
            }
          });

          let reader = new FileReader();
          reader.onload = function (e) {
            if (
              semverCompare(
                [major, minor, patch].join("."),
                [flashMajor, flashMinor, flashPatch].join(".")
              ) === -1
            ) {
              notify(
                `Invalid Firmware version ${[
                  flashMajor,
                  flashMinor,
                  flashPatch,
                ].join(
                  "."
                )}.<br/>Only same or newer FW versions can be updated via OTA.`,
                1,
                0,
                8000
              );
              return;
            }

            const blob = new Blob([new Uint8Array(e.target.result).slice(17)], {
              type: "application/octet-stream",
            });
            const filename = file.name.includes(".fw.ota")
              ? "firmware"
              : "filesystem";
            const fileBlob = new File([blob], filename, {
              type: "application/octet-stream",
            });
            formData.append("MD5", md5);
            formData.append(filename, fileBlob, filename);
            request.open("post", "/xhost/update");
            request.send(formData);
          };
          reader.readAsArrayBuffer(otaBlob);
        })
        .catch((error) => {
          notify(error || "Unknown error while uploading Firmware", 1);
        });
    });
};

const wifiConnect = (ssid, password, staIP, gatewayIP) => {
  const formData = new FormData();
  formData.append("ssid", ssid);
  formData.append("password", password);
  if (staIP) {
    formData.append("staIP", staIP);
    formData.append("gatewayIP", gatewayIP);
  }

  return fetch("/xhost/wifi/connect", {
    method: "POST",
    body: formData,
  });
};

const isPS4 = () => {
  const ua = navigator.userAgent;
  return ua.includes("PlayStation 4");
};

///////////////////////

const action__uploadFimware = () => {
  const input = $(".xhost__firmware-input");
  if (!isPS4()) {
    input.setAttribute("accept", ".ota");
    input.click();
  } else {
    notify(
      "PS4 Browser does not support file uploads.\nUse a desktop browser for firmware update",
      1
    );
  }
};

const action__uploadFilesystem = () => {
  const input = $(".xhost__firmware-input");
  if (!isPS4()) {
    input.setAttribute("accept", ".ota");
    input.click();
  } else {
    notify(
      "PS4 Browser does not support file uploads.<br/>Please use a desktop browser",
      1
    );
  }
};

const guard__wifiMode = (mode) => {
  const modes = {
    ap: 2,
    sta: 1,
  };
  return xhostAppData.xhostPro.config.wifiMode === modes[mode];
};

guard__isXHOSTPRO = () => {
  return true;
};

guards = {
  ...guards,
  guard__wifiMode,
  guard__isXHOSTPRO,
};

const action__downloadFirmware = ({ basePath, mode }) => {
  const board = xhostAppData.xhostPro.config.board;
  const url = `${basePath}/ota/${board}-base.${mode}.ota`;

  downloadUpdateOTA(url);
};

const action__downloadFilesystem = () => {};

$(".xhost__firmware-input").addEventListener("change", (event) => {
  const file = event.target["files"][0];

  if (file.name.includes(".fw.ota") || file.name.includes(".fs.ota")) {
    updateOTA(file);
    return;
  }

  notify("Invalid ota file extension. Aborting...", 1);
});

const action__connectToSSID = (mode = "easy") => {
  const ssid = prompt("⚙ Enter your 📶 wireless network 🌐 SSID");
  if (!ssid) {
    return;
  }

  const pass = prompt("Enter your 📶 wireless network 🔒 PASSWORD");
  if (!pass) {
    return;
  }
  let staIP;
  let gatewayIP;
  if (mode !== "easy") {
    staIP = prompt("Enter STA Static IP Address", "192.168.0.106");
    if (!staIP) {
      return;
    }
    if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(staIP)) {
      notify("Invalid Static IP Address", 1);
      return;
    }
    gatewayIP = prompt("Enter Router IP Address", "192.168.0.254");
    if (!gatewayIP) {
      return;
    }
    if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(gatewayIP)) {
      notify("Invalid Static IP Address", 1);
      return;
    }
  }

  if (mode === "easy") {
    wifiConnect(ssid, pass).then(() => {
      notify(`Connecting to SSID ${ssid}. Reloading... Please wait`);
      setTimeout(() => {
        window.location.href = "/xhost/setup";
      }, 15000);
    });
  } else {
    wifiConnect(ssid, pass, staIP, gatewayIP).then(() => {
      notify(
        `Connecting to SSID ${ssid}.<br/>IP: ${staIP}<br>ROUTER: ${gatewayIP}<br/>Reloading... Please wait`
      );
      setTimeout(() => {
        window.location.href = "/xhost/setup";
      }, 15000);
    });
  }
};

const action__switchToAP = () => {
  notify("Redirecting to AP  http://6.6.6.6");
  wifiConnect("", "");
  setTimeout(() => {
    window.location.href = "http://6.6.6.6/xhost/setup";
  }, 2000);
};

actions = {
  ...actions,
  action__uploadFimware,
  action__uploadFilesystem,
  action__downloadFirmware,
  action__downloadFilesystem,
  action__connectToSSID,
  action__switchToAP,
};
contextMenuItemsMeta = {
  ...contextMenuItemsMeta,
  currentSSID: "pepe",
};

xhostMain = () => {
  const menuJson = removeHiddenMenus(menuData);
  mainMenu = menuJson;
  mainMenuKeys = Object.keys(mainMenu);
  mainMenuLength = mainMenuKeys.length;
  action__showPayloads();
  generateMainMenu();
  renderMainMenu();
};

loadSsidConfig().then(loadVersion).then(loadConfig).then(xhostMain);
