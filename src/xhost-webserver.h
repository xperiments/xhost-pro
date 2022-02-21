#ifndef XHOSTWEBSERVER_H
#define XHOSTWEBSERVER_H

#include <Arduino.h>
#ifdef ESP32
#include "FS.h"
#include "LittleFS.h"
#elif defined(ESP8266)
#include "FS.h"
#endif
#include <ESPAsyncWebServer.h>
#include "xhost-config.h"
#include "xhost-updater.h"
#include "www/setup_html.h"

AsyncWebServer xhostWebServer(80);
WiFiClient client;
String pendingPayload = "";
IPAddress remotePayloadIP;

void routeNotFound(AsyncWebServerRequest *request)
{
    request->redirect("/xhost/setup");
    // request->send(404, "text/plain", "XHOST-PRO: Route not found");
}

String staticVarProcessor(const String &var)
{
    if (var == "HELLO_FROM_TEMPLATE")
        return F("Hello world!");
    return String();
}

void setupWebServer()
{
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");

    xhostWebServer.onNotFound(routeNotFound);

    xhostWebServer
        .serveStatic("/", LittleFS, "/")
        .setDefaultFile("index.html")
        .setTemplateProcessor(staticVarProcessor);
}

void resetPendingPayload()
{
    pendingPayload = "";
}

bool postBinaryFile(String payload)
{

    File dataFile = LittleFS.open(payload, "r");

    if (!dataFile)
    {
        // Serial.println("UNABLE OPEN DATAFILE");
        client.stop();
        resetPendingPayload();
        return false;
    }

    // Serial.println("OPEN DATAFILE");
    while (dataFile.available())
    {
        client.write(dataFile.read());
    }
    client.flush();
    dataFile.close();

    client.stop();
    resetPendingPayload();
    LittleFS.remove("/tmp/payload.bin");
    return true;
}

void webServerLoop()
{
    if (pendingPayload != "")
    {
        // Serial.println("pendingPayload");
        if (client.connect(remotePayloadIP, 9090))
        {
            // Serial.println("9090");
            postBinaryFile(pendingPayload);
            return;
        }
        else
        {
            if (client.connect(remotePayloadIP, 9020))
            {
                // Serial.println("9020");
                postBinaryFile(pendingPayload);
                return;
            }
        }
    }
}

void webServerAugmentXHOST()
{

    xhostWebServer.on("/xhost/version", HTTP_GET, [](AsyncWebServerRequest *request)
                      {
                        if (memFree())
                        {
                            StaticJsonDocument<512> doc;
                            doc["flashVersion"] = xhostProVersionString;
#ifdef ESP32
                            doc["board"] = "ESP32";
#elif defined(ESP8266)
                            doc["board"] = "ESP8266";
#endif
                            String output;
                            output.reserve(64);
                            serializeJson(doc, output);
                            // Serial.println("sending web page");
                            request->send(200, "application/json", output);
                        } });

    xhostWebServer.on("/xhost/usb/on", HTTP_GET, [](AsyncWebServerRequest *request)
                      {
                          if (memFree())
                          {
                              enableUSB();
                              request->send(200, "text/html", "USB-ON");
                          } });

    xhostWebServer.on("/xhost/usb/off", HTTP_GET, [](AsyncWebServerRequest *request)
                      {
                          if (memFree())
                          {
                              disableUSB();
                              request->send(200, "text/html", "USB-OFF");
                          } });

    xhostWebServer.on("/xhost/setup", HTTP_GET, [](AsyncWebServerRequest *request)
                      {
                          if (memFree())
                          {
                              AsyncWebServerResponse *response = request->beginResponse_P(200, "text/html", setup_html, setup_html_len);
                              response->addHeader("Content-Encoding", "gzip");
                              request->send(response);
                          } });

    xhostWebServer.on(
        "/xhost/binary", HTTP_POST,
        [](AsyncWebServerRequest *request)
        {
            if (memFree())
            {
                remotePayloadIP = request->client()->remoteIP();
                request->send(200, "application/json", "{\"success\":\"processing payload\"}");
                return;
            }
        },
        [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final)
        {
            if (!index)
            {

                request->_tempFile = LittleFS.open("/tmp/payload.bin", "w");
            }
            if (len)
            {

                request->_tempFile.write(data, len);
            }
            if (final)
            {

                request->_tempFile.close();
                pendingPayload = "/tmp/payload.bin";
            }
        });

    // xhostWebServer.begin(); // Webserver for the site
}
#endif