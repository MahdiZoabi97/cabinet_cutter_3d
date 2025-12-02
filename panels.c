#include <stdio.h>
#include <string.h>
#include "panels.h"

int generate_panels(float W, float H, float D, float T, int shelves,
                    int cabinetIndex, int startIndex, Panel* out) {
    int count = startIndex;

    char nameBuf[30];

    snprintf(nameBuf, sizeof(nameBuf), "Cab%d Left Side", cabinetIndex);
    out[count++] = (Panel){ "", H, D, 1 };
    strncpy(out[count-1].name, nameBuf, sizeof(out[count-1].name)-1);
    out[count-1].name[sizeof(out[count-1].name)-1] = '\0';

    snprintf(nameBuf, sizeof(nameBuf), "Cab%d Right Side", cabinetIndex);
    out[count++] = (Panel){ "", H, D, 1 };
    strncpy(out[count-1].name, nameBuf, sizeof(out[count-1].name)-1);
    out[count-1].name[sizeof(out[count-1].name)-1] = '\0';

    snprintf(nameBuf, sizeof(nameBuf), "Cab%d Top Panel", cabinetIndex);
    out[count++] = (Panel){ "", W - 2*T, D, 1 };
    strncpy(out[count-1].name, nameBuf, sizeof(out[count-1].name)-1);
    out[count-1].name[sizeof(out[count-1].name)-1] = '\0';

    snprintf(nameBuf, sizeof(nameBuf), "Cab%d Bottom Panel", cabinetIndex);
    out[count++] = (Panel){ "", W - 2*T, D, 1 };
    strncpy(out[count-1].name, nameBuf, sizeof(out[count-1].name)-1);
    out[count-1].name[sizeof(out[count-1].name)-1] = '\0';

    for (int i = 0; i < shelves; i++) {
        snprintf(nameBuf, sizeof(nameBuf), "Cab%d Shelf", cabinetIndex);
        out[count++] = (Panel){ "", W - 2*T, D, 1 };
        strncpy(out[count-1].name, nameBuf, sizeof(out[count-1].name)-1);
        out[count-1].name[sizeof(out[count-1].name)-1] = '\0';
    }

    return count;
}
