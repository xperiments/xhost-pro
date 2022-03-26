#include <Arduino.h>

String xhostProVersionString = "0.9.5.2.xhost-pro";
boolean hasEnabled = false;
unsigned long enTime = 0;

#include "xhost-utils.h"
#include "xhost-usb.h"
#include "xhost-fs.h"
#include "xhost-config.h"
#include "xhost-wifi.h"
#include "xhost-webserver.h"
#include "xhost-updater.h"
#include "xhost-dns.h"
#include "xhost-ftp.h"

void setup()
{

#ifdef ESP8266
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
#elif defined(ESP32)
  // pinMode(15, OUTPUT);
#endif

  setupFS();
  setupConfig();
  wifiSetup();
  setupWebServer();

  webServerAugmentXHOST();
  webServerAugmentWifi(xhostWebServer);
  configAugmentXHOST(xhostWebServer);
  xhostFirmwareUpdate.begin(&xhostWebServer);
  wifiStart();
  xhostWebServer.begin();
  initFTP();
}

void loop()
{
  dnsServer.processNextRequest();
  xhostFirmwareUpdate.loop();
  ftpSrv.handleFTP();
  webServerLoop();

#ifdef ESP8266
  MDNS.update();
#endif

  checkUSBStatus();
  wifiServerLoop();
}
