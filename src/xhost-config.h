#ifndef XHOSTCONFIG_H
#define XHOSTCONFIG_H

#include <Arduino.h>
#include <ArduinoJson.h>
#ifdef ESP32
#include "LittleFS.h"
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#endif

struct Config
{
#ifdef ESP32
    int wifiMode = WIFI_MODE_AP; // 0 AP - 1 STA
#elif defined(ESP8266)
    int wifiMode = WIFI_AP; // 0 AP - 1 STA
#endif
    String staSsid = "";
    String staPassword = "";
    String staIP = "";
    String gatewayIP = "";
    String apIP = "";
    String apSsid = "";
    String apPassword = "";
    String usbDelay = "";
    String usbMode = "";
};

Config xhostConfig;

void setWifiMode(String mode)
{
#ifdef ESP32
    xhostConfig.wifiMode = mode == "ap" ? WIFI_MODE_AP : WIFI_MODE_STA;
#elif defined(ESP8266)
    xhostConfig.wifiMode = mode == "ap" ? WIFI_AP : WIFI_STA;
#endif
}
// Loads the configuration from a file
bool loadConfiguration(const char *filename, Config &config)
{

    File file = LittleFS.open(filename, "r");
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, file);
    if (error)
    {
        // Serial.println(F("Failed to read file, using default configuration"));
        return false;
    }

    xhostConfig.wifiMode = doc["wifiMode"];
    xhostConfig.staSsid = doc["staSsid"].as<String>();
    xhostConfig.staPassword = doc["staPassword"].as<String>();
    xhostConfig.staIP = doc["staIP"].as<String>();
    xhostConfig.gatewayIP = doc["gatewayIP"].as<String>();
    xhostConfig.apIP = doc["apIP"].as<String>();
    xhostConfig.apSsid = doc["apSsid"].as<String>();
    xhostConfig.apPassword = doc["apPassword"].as<String>();
    xhostConfig.usbDelay = doc["usbDelay"].as<String>();
    xhostConfig.usbMode = doc["usbMode"].as<String>();

    file.close();
    return true;
}

// Saves the configuration to a file
bool saveConfiguration(const char *filename, const Config &config)
{
    LittleFS.remove(filename);
    File file = LittleFS.open(filename, "w");

    if (!file)
    {
        // Serial.println(F("Failed to create file"));
        return false;
    }

    StaticJsonDocument<256> doc;

    doc["wifiMode"] = config.wifiMode;
    doc["staSsid"] = config.staSsid;
    doc["staPassword"] = config.staPassword;
    doc["staIP"] = config.staIP;
    doc["gatewayIP"] = config.gatewayIP;
    doc["apIP"] = config.apIP;
    doc["apSsid"] = config.apSsid;
    doc["apPassword"] = config.apPassword;
    doc["usbDelay"] = config.usbDelay;
    doc["usbMode"] = config.usbMode;

    if (serializeJson(doc, file) == 0)
    {
        // Serial.println(F("Failed to write to file"));
        return false;
    }
    file.close();
    return true;
}

void resetToAP()
{
    // xhostConfig.wifiMode = WIFI_AP;
    setWifiMode("ap");

    xhostConfig.apIP = "6.6.6.6";
    xhostConfig.apSsid = "xhost-pro";
    xhostConfig.apPassword = "12345678";

    xhostConfig.staSsid = "";
    xhostConfig.staPassword = "";
    xhostConfig.staIP = "";
    xhostConfig.gatewayIP = "";
}

void setupConfig()
{
    if (!loadConfiguration("/config.json", xhostConfig))
    {
        resetToAP();

#ifdef ESP32
        xhostConfig.usbDelay = "10000";
        xhostConfig.usbMode = "auto";
#elif defined(ESP8266)
        xhostConfig.usbDelay = "0";
        xhostConfig.usbMode = "manual";
#endif
        saveConfiguration("/config.json", xhostConfig);
    }
}

void configResetToAP()
{
    resetToAP();
    saveConfiguration("/config.json", xhostConfig);
}

void configSetSsid(String ssid, String password)
{
    setWifiMode("sta");
    xhostConfig.staSsid = ssid;
    xhostConfig.staPassword = password;
    xhostConfig.staIP = "";
    xhostConfig.gatewayIP = "";
    saveConfiguration("/config.json", xhostConfig);
}

void configCustomSetSsid(String ssid, String password, String staIP, String gatewayIP)
{
    setWifiMode("sta");
    xhostConfig.staSsid = ssid;
    xhostConfig.staPassword = password;
    xhostConfig.staIP = staIP;
    xhostConfig.gatewayIP = gatewayIP;
    saveConfiguration("/config.json", xhostConfig);
}

void configAugmentXHOST(AsyncWebServer &server)
{

    server.on("/xhost/config", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                  if (memFree())
                  {
                      request->send(200, "application/json", "true");

                      xhostConfig.usbDelay = request->hasArg("usbDelay") ? request->arg("usbDelay"): xhostConfig.usbDelay;
                      xhostConfig.usbMode = request->hasArg("usbMode") ? request->arg("usbMode"): xhostConfig.usbMode;

                      saveConfiguration("/config.json", xhostConfig);
                      delay(200);
                  } });
}

#endif