# XHOST-PRO 0.9 public beta

> This is a WIP document. More detailed documentation will come in the future

A multi service HOST for PS4 jailbreak

# Features

- Web Server
- FTP Server (Upload any HOST!!)
- WiFi Home Network(STA) or Alone(AP) Modes
- Local/Online OTA Updates
- Exfathax auto mount
- Public endpoint API
- USB storage emulation
- Selectable USB Delay
- Only 1 code base

## Compatible Boards

- ESP-S2 Family of boards (4mb boards seem)
- ESP8266

## Roadmap

- **0.9.1** - First Public ßeta with the above features included
- **0.9.x** - Add basic ESP32 board compability
- **0.9.y** - Add SD card support
- **0.9.y** - Add localization support with i18n
- **1.0.0** - Public Release

## First Installation

- Flash the correct binary from [releases] to your board (requires python & esptool.py installed)

  ```sh
  #esp32-s2
  esptool.py --chip esp32s2 --port PORT write_flash 0x00000 YOUR_BOARD.bin
  ```

  ```sh
  #esp8266
  esptool.py --port PORT write_flash 0x00000 YOUR_BOARD.bin
  ```

  > Depending on you OS you may use other tools like the Espressif download tool

## First login

- Connect to AP

  ```sh
  [SSID] xhost-pro
  [PASS] 12345678
  ```

- Navigate to

  ```sh
  http://6.6.6.6/xhost/setup
  ```

- Configure USB Delay

  ```sh
  Settings-> XHOST-PRO Setup-> System-> USB mount delay
  ```

- Configure WiFi if needed

  ```sh
  Settings->XHOST-PRO Setup->Network Setup
  ```

- You are done! Navigate to main host page

  ```sh
  http://6.6.6.6
  ```

## FTP Server

- Use only plainFTP (insecure)
- Limit number of connections to 1

```sh
user: xhost-pro
pass: 12345678
```

## Firmware upgrade methods

There are 5 ways to update your board.

- Full firmware replacement via cable `(.bin)`
- Update Firmware from PC `(.fw.ota)`
- Update Filesystem from PC `(.fs.ota)`
- Update Firmware online from PS4 `(.fw.ota)`
- Update Filesystem online from PS4 `(.fs.ota)`

Needed files will be found in the `releases` folder.

## API

Main xhost-pro server setup page

- `http://6.6.6.6/xhost/setup`

This are the avaliable server API end points

- `/xhost/wifi/connect` Manages Network Mode (POST)
- `/xhost/wifi/ssid` Gets SSID info (GET)
- `/xhost/version` Gets xhost-pro version number (GET)
- `/xhost/usb/on` Enables USB (GET)
- `/xhost/usb/off` Disables USB (GET)
- `/xhost/update` Manages ota updates (POST)
