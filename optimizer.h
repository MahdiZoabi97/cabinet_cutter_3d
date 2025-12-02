#ifndef OPTIMIZER_H
#define OPTIMIZER_H

#include "panels.h"

typedef struct {
    float sheetLength;
    float sheetWidth;
} StockSheet;

void optimize_cuts(Panel* panels, int count, StockSheet sheet);

#endif
