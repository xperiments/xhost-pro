#ifndef XHOSTFTP_H
#define XHOSTFTP_H

#include <Arduino.h>

#ifdef ESP8266
#include <ESP8266WiFi.h>
#include <LittleFS.h>
#elif defined ESP32
#include <WiFi.h>
#include <FS.h>
#include <LittleFS.h>
#endif

#include "SimpleFTPServer.h"

FtpServer ftpSrv;

void initFTP()
{
    ftpSrv.begin("xhost-pro", "12345678");
    // Serial.println("FTP Initialized");
}
#endif