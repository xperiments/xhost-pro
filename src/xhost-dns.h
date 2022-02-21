#ifndef XHOSTDNS_H
#define XHOSTDNS_H

#include <Arduino.h>

#include <DNSServer.h>
#ifdef ESP8266
#include <ESP8266mDNS.h>
#elif defined ESP32
#include <ESPmDNS.h>
#endif

#include "xhost-wifi.h"

DNSServer dnsServer;

void setupDNS(String wifiMode)
{
    String mdnsHost = device_hostname;
    mdnsHost.replace(".local", "");
    MDNS.begin(mdnsHost.c_str());
    dnsServer.stop();
    dnsServer.setTTL(300);
    dnsServer.setErrorReplyCode(DNSReplyCode::ServerFailure);
    if (wifiMode == "ap")
    {
        dnsServer.start(53, "*", WiFi.softAPIP());
    }
    else
    {
        dnsServer.start(53, "*", WiFi.localIP());
    }
}

#endif