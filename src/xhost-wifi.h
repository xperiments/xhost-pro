#ifndef XHOSTWIFIMANAGER_H
#define XHOSTWIFIMANAGER_H

#include <Arduino.h>

#ifdef ESP32
#include <WiFi.h>
#include <AsyncTCP.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#endif

float wifiConnectStartTime;
String device_hostname = "xhost.local";
bool nextLoopWiFiStart = false;
#define WIFI_CONNECT_TIMEOUT 15

#include "xhost-dns.h"

void wifiSetupAP()
{

    IPAddress apIP;
    apIP.fromString(xhostConfig.apIP);
    WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
#ifdef ESP8266
    WiFi.softAP(xhostConfig.apSsid, xhostConfig.apPassword, 11);
#elif defined ESP32
    WiFi.softAP(xhostConfig.apSsid.c_str(), xhostConfig.apPassword.c_str());
#endif
}

void wifiSetup()
{

#ifdef ESP8266
    WiFi.mode(WIFI_AP_STA);
#elif defined ESP32
    WiFi.mode(WIFI_MODE_APSTA);
#endif

    WiFi.hostname(device_hostname);

#ifdef ESP8266
    WiFi.setSleepMode(WIFI_NONE_SLEEP);
    WiFi.setOutputPower(16.0f);
#elif defined ESP32
    WiFi.setSleep(WIFI_PS_NONE);
    WiFi.setTxPower(WIFI_POWER_19_5dBm);
#endif

    wifiSetupAP();
}

void wifiSetupSTA()
{

#ifdef ESP8266
    WiFi.begin(xhostConfig.staSsid, xhostConfig.staPassword);
#elif defined ESP32
    WiFi.begin(xhostConfig.staSsid.c_str(), xhostConfig.staPassword.c_str());
#endif

    wifiConnectStartTime = millis();

    while (WiFi.status() != WL_CONNECTED && ((millis() - wifiConnectStartTime) < (1000 * WIFI_CONNECT_TIMEOUT)))
    {
        digitalWrite(15, HIGH);
        delay(1000);
        digitalWrite(15, LOW);
    }

    wifiConnectStartTime = 0;

    if (WiFi.status() == WL_CONNECTED)
    {

        if (xhostConfig.staIP != "")
        {
            IPAddress staIP;
            IPAddress gatewayIP;

            staIP.fromString(xhostConfig.staIP);
            gatewayIP.fromString(xhostConfig.gatewayIP);

            WiFi.config(staIP, gatewayIP, IPAddress(255, 255, 255, 0));

            // setupDNS("sta");
            saveConfiguration("/config.json", xhostConfig);
        }
    }
    else
    {

        digitalWrite(15, HIGH);
        delay(5);
        digitalWrite(15, LOW);
        delay(1);
        digitalWrite(15, HIGH);
        delay(5);
        digitalWrite(15, LOW);
        configResetToAP();
        wifiSetupAP();
    }
}

void wifiStart()
{
#ifdef ESP32
    if (xhostConfig.wifiMode != WIFI_MODE_AP)
    {
        wifiSetupSTA();
    }
#elif defined(ESP8266)
    if (xhostConfig.wifiMode != WIFI_AP)
    {
        wifiSetupSTA();
    }
#endif
}

void wifiServerLoop()
{
    if (nextLoopWiFiStart)
    {
        nextLoopWiFiStart = false;
        wifiStart();
    }
}

void webServerAugmentWifi(AsyncWebServer &server)
{

    server.on("/xhost/wifi/ssid", HTTP_GET, [](AsyncWebServerRequest *request)
              {
                          if (memFree())
                          {

                              StaticJsonDocument<80> doc;

#ifdef ESP32
                              doc["staIP"] = xhostConfig.wifiMode == WIFI_MODE_AP ? xhostConfig.apIP : WiFi.localIP().toString();
                              doc["gatewayIP"] = xhostConfig.wifiMode == WIFI_MODE_AP ? xhostConfig.apIP : WiFi.gatewayIP().toString();
#elif defined(ESP8266)
                              doc["staIP"] = xhostConfig.wifiMode == WIFI_AP ? xhostConfig.apIP : WiFi.localIP().toString();
                              doc["gatewayIP"] = xhostConfig.wifiMode == WIFI_AP ? xhostConfig.apIP : WiFi.gatewayIP().toString();
#endif

                              String output;
                              output.reserve(80);
                              serializeJson(doc, output);

                              AsyncWebServerResponse *response = request->beginResponse(200, "application/json", output);
                              request->send(response);
                          } });
    server.on("/xhost/wifi/connect", HTTP_POST, [](AsyncWebServerRequest *request)
              {
                if (memFree())
                {
                    request->send(200, "application/json", "true");

                    String ssid = request->arg("ssid");
                    String password = request->arg("password");
                    String staIP = request->arg("staIP");
                    String gatewayIP = request->arg("gatewayIP");

                    if (WiFi.isConnected())
                    {
                        WiFi.disconnect();
                    }
                    if (ssid.length()>0 && password.length()>0)
                    {
                        if (staIP.length()>0 && gatewayIP.length()>0)
                        {
                            configCustomSetSsid(ssid, password, staIP, gatewayIP);
                        }
                        else
                        {
                            configSetSsid(ssid, password);
                        }
                        nextLoopWiFiStart = true;
                    }
                    else {
                        configResetToAP();
                    }
                    
                    
                } });
}
#endif