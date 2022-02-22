#ifndef XHOSTFS_H
#define XHOSTFS_H

#include <Arduino.h>
#include "FS.h"
#include "LittleFS.h"

#include <ESPAsyncWebServer.h>

void setupFS()
{

    if (!LittleFS.begin())
    {
        LittleFS.format();
    }
}

#endif