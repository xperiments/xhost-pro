#ifndef XHOSTFirmwareUpdate_h
#define XHOSTFirmwareUpdate_h

#include "Arduino.h"
#include "stdlib_noniso.h"

#include "ESPAsyncWebServer.h"

#ifdef ESP32
#include <Update.h>
#include <esp_int_wdt.h>
#include <esp_task_wdt.h>
#endif

class XhostUpdater
{

public:
    void begin(AsyncWebServer *server)
    {
        _server = server;
        _server->on(
            "/xhost/update", HTTP_POST, [&](AsyncWebServerRequest *request)
            {
                if (memFree())
                {
 
                    AsyncWebServerResponse *response = request->beginResponse((Update.hasError()) ? 500 : 200, "text/plain", (Update.hasError()) ? "FAIL" : "OK");
                    // response->addHeader("Connection", "close");
                    request->client()->setNoDelay(true);
                    request->send(response);
                    delay(100);
                    request->client()->stop();
                    restartRequiredTime = millis();
                    restartRequired = true;
                } },
            [&](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final)
            {
                // Upload handler chunks in data
                if (!index)
                {
                    if (!request->hasParam("MD5", true))
                    {
                        return request->send(400, "text/plain", "MD5 parameter missing");
                    }

                    if (!Update.setMD5(request->getParam("MD5", true)->value().c_str()))
                    {
                        return request->send(400, "text/plain", "MD5 parameter invalid");
                    }

#if defined(ESP8266)

                    int cmd = (filename == "filesystem") ? U_FS : U_FLASH;
                    Update.runAsync(true);
                    size_t fsSize = ((size_t)&_FS_end - (size_t)&_FS_start);
                    uint32_t maxSketchSpace = (ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000;
                    if (!Update.begin((cmd == U_FS) ? fsSize : maxSketchSpace, cmd))
                    { // Start with max available size
#elif defined(ESP32)
                    int cmd = (filename == "filesystem") ? U_SPIFFS : U_FLASH;
                    if (!Update.begin(UPDATE_SIZE_UNKNOWN, cmd))
                    { // Start with max available size
#endif
                        Update.printError(Serial);
                        return request->send(400, "text/plain", "OTA could not begin");
                    }
                }

                // Write chunked data to the free sketch space
                if (len)
                {
                    if (Update.write(data, len) != len)
                    {
                        return request->send(400, "text/plain", "OTA could not begin");
                    }
                }

                if (final)
                { // if the final flag is set then this is the last frame of data
                    if (!Update.end(true))
                    { // true to set the size to the current progress
                        Update.printError(Serial);

                        return request->send(400, "text/plain", "Could not end OTA");
                    }
                }
                else
                {
                    return;
                }
            });
    }

    void loop()
    {
        if (restartRequired && millis() - restartRequiredTime > 3000)
        {
            restartRequired = false;
            yield();
            delay(1000);
            yield();
#if defined(ESP8266)
            ESP.restart();
#elif defined(ESP32)
            // ESP32 will commit sucide
            esp_task_wdt_init(1, true);
            esp_task_wdt_add(NULL);
            while (true)
                ;
#endif
        }
    }

private:
    AsyncWebServer *_server;
    bool restartRequired = false;
    float restartRequiredTime = 0;
};

XhostUpdater xhostFirmwareUpdate;
#endif