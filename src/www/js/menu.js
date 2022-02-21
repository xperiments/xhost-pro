const menuData = {
  "xhost-pro": {
    items: [
      {
        name: "Network Setup",
        desc: "Setup Network connection params",
        action: "contextMenu",
        silent: true,
        actionParams: [
          {
            name$:
              "SSID: <span class='secondary'>{{xhostPro.config.staSsid}}</span>",
            desc$:
              "IP:<span class='secondary'>{{xhostPro.ssid.staIP}}</span> - Router:<span class='secondary'>{{xhostPro.ssid.gatewayIP}}</span>",
            guard: "wifiMode",
            guardParams: "sta",
            silent: "true",
          },
          {
            name: "Change SSID network (Easy)",
            guard: "wifiMode",
            action: "connectToSSID",
            actionParams: "easy",
            guardParams: "sta",
            silent: "true",
          },
          {
            name: "Change SSID network (Custom)",
            guard: "wifiMode",
            action: "connectToSSID",
            actionParams: "custom",
            guardParams: "sta",
            silent: "true",
          },
          {
            name: "Switch to AP",
            desc: "http://xhost.local",
            guard: "wifiMode",
            action: "switchToAP",
            guardParams: "sta",
            silent: "true",
          },
          /*----------------------------------------*/
          {
            name: "AP Mode - SSID: xhost-pro<br/>xhost.local",
            guard: "wifiMode",
            guardParams: "ap",
            silent: "true",
          },
          {
            name: "Connect Home WiFi (Easy)",
            guard: "wifiMode",
            action: "connectToSSID",
            actionParams: "easy",
            guardParams: "ap",
            silent: "true",
          },
          {
            name: "Connect Home WiFi (Custom)",
            guard: "wifiMode",
            action: "connectToSSID",
            actionParams: "custom",
            guardParams: "ap",
            silent: "true",
          },
        ],
      },
      {
        name: "Firmware",
        desc: "Update firmware [online/file]",
        action: "contextMenu",
        silent: true,
        actionParams: [
          {
            name: "Online Firmware Update",
            action: "downloadFirmware",
            actionParams: "http://6.6.6.7:8080/release/esp32-s2.fw.ota",
            silent: true,
          },
          {
            name: "Online Filesystem Update",
            action: "downloadFilesystem",
            actionParams: "http://6.6.6.7:8080/release/esp32-s2.fw.ota",
            silent: true,
          },
          {
            name: "Flash New Firmware",
            action: "uploadFimware",
            silent: true,
          },
          {
            name: "Flash new Filesystem",
            action: "uploadFilesystem",
            silent: true,
          },
        ],
      },
      {
        name: "System",
        desc: "Setup System settings",
        action: "contextMenu",
        silent: true,
        actionParams: [
          {
            name$: "XHOST-PRO<br/>v{{xhostPro.version}}",
            silent: true,
          },
          {
            name: "USB mount delay",
            action: "select",
            actionParams: {
              options: {
                Disabled: "0",
                "10s": "10000",
                "15s": "15000",
                "20s": "20000",
              },
              onchange: "usbDelay",
              store: "usbDelay",
            },
            silent: true,
          },
          // {
          //   name: "Micro SD",
          //   actionParams: {
          //     options: {
          //       enabled: "Enabled",
          //       disabled: "Disabled",
          //     },
          //     onchange: "microSD",
          //     store: "microSD",
          //   },
          //   silent: true,
          // },
        ],
      },
      {
        name: "Back to Host",
        action: "loadUrl",
        actionParams: "/",
        silent: true,
      },
    ],
  },
};
