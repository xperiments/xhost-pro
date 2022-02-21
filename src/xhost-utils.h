#ifndef XHOSTUTILS_H
#define XHOSTUTILS_H

bool memFree()
{
    return ESP.getFreeHeap() > 10000;
}

#endif