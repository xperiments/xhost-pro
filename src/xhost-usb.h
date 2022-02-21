#ifndef XHOSTUSB_H
#define XHOSTUSB_H

#define XHOST_USB_DISABLE_TIMEOUT 15000

#ifdef ESP32

#include "exfathax.h"
#include "USB.h"
#include "USBMSC.h"

USBMSC dev;

static int32_t onRead(uint32_t lba, uint32_t offset, void *buffer, uint32_t bufsize)
{
    if (lba > 4)
    {
        lba = 4;
    }
    memcpy(buffer, exfathax[lba] + offset, bufsize);
    return bufsize;
}

void enableUSB()
{
    dev.vendorID("PS4");
    dev.productID("ESP32 Server");
    dev.productRevision("1.0");
    dev.onRead(onRead);
    dev.mediaPresent(true);
    dev.begin(8192, 512);
    USB.begin();
    enTime = millis();
    hasEnabled = true;
}

void disableUSB()
{
    enTime = 0;
    hasEnabled = false;
    dev.end();
}
#elif defined(ESP8266)

#define USB_SWITCH_PIN 13

void enableUSB()
{
    digitalWrite(USB_SWITCH_PIN, HIGH);
    enTime = millis();
    hasEnabled = true;
}

void disableUSB()
{
    digitalWrite(USB_SWITCH_PIN, LOW);
    enTime = 0;
    hasEnabled = false;
}

#endif

void checkUSBStatus()
{
    if (hasEnabled && millis() >= (enTime + XHOST_USB_DISABLE_TIMEOUT))
    {
        disableUSB();
    }
}

#endif