#include <stdio.h>
#include "optimizer.h"

void optimize_cuts(Panel* p, int count, StockSheet sheet) {
    float usedArea = 0;

    printf("\n--- CUTTING PLAN ---\n");

    for (int i = 0; i < count; i++) {
        float area = (p[i].length * p[i].width) * p[i].quantity;
        usedArea += area;

        printf("%s: %.1f × %.1f  x%d\n",
            p[i].name, p[i].length, p[i].width, p[i].quantity);
    }

    /* Summary by size (length × width), regardless of name */
    typedef struct {
        float length;
        float width;
        int totalQty;
    } SizeSummary;

    SizeSummary summary[200];
    int summaryCount = 0;

    for (int i = 0; i < count; i++) {
        int found = 0;
        for (int j = 0; j < summaryCount; j++) {
            if (summary[j].length == p[i].length &&
                summary[j].width  == p[i].width) {
                summary[j].totalQty += p[i].quantity;
                found = 1;
                break;
            }
        }
        if (!found && summaryCount < 200) {
            summary[summaryCount].length   = p[i].length;
            summary[summaryCount].width    = p[i].width;
            summary[summaryCount].totalQty = p[i].quantity;
            summaryCount++;
        }
    }

    printf("\n--- SIZE SUMMARY (HOW MANY OF EACH SIZE TO CUT) ---\n");
    for (int i = 0; i < summaryCount; i++) {
        printf("%.1f × %.1f  x%d pieces\n",
               summary[i].length, summary[i].width, summary[i].totalQty);
    }

    /* Assume we trim 2 cm off each edge of the sheet (4 cm total from each dimension) */
    float usableLength = sheet.sheetLength - 4.0f;
    float usableWidth  = sheet.sheetWidth  - 4.0f;
    if (usableLength < 0) usableLength = 0;
    if (usableWidth  < 0) usableWidth  = 0;

    float sheetArea = usableLength * usableWidth;
    float requiredSheets = usedArea / sheetArea;

    printf("\nTotal area needed: %.1f cm²\n", usedArea);
    printf("Full sheet size: %.1f × %.1f\n", sheet.sheetLength, sheet.sheetWidth);
    printf("Usable area after 2 cm edge trim on all sides: %.1f × %.1f\n",
           usableLength, usableWidth);
    printf("Estimated sheets required: %.2f\n", requiredSheets);
}
