#include <stdio.h>
#include "panels.h"
#include "optimizer.h"

int main() {
    float W, H, D, T;
    int shelves;
    int numCabinets;

    printf("How many cabinets do you want to enter? ");
    scanf("%d", &numCabinets);

    if (numCabinets <= 0) {
        printf("Nothing to do.\n");
        return 0;
    }

    Panel panels[200];
    int totalCount = 0;

    for (int c = 1; c <= numCabinets; c++) {
        printf("\n--- Cabinet %d ---\n", c);

        printf("Enter cabinet width (cm): ");
        scanf("%f", &W);

        printf("Enter cabinet height (cm): ");
        scanf("%f", &H);

        printf("Enter cabinet depth (cm): ");
        scanf("%f", &D);

        printf("Enter material thickness (cm): ");
        scanf("%f", &T);

        printf("Number of shelves: ");
        scanf("%d", &shelves);

        totalCount = generate_panels(W, H, D, T, shelves, c, totalCount, panels);
    }

    printf("\n--- PANEL LIST ---\n");
    for (int i = 0; i < totalCount; i++) {
        printf("%s: %.1f × %.1f (x%d)\n",
            panels[i].name,
            panels[i].length,
            panels[i].width,
            panels[i].quantity);
    }

    StockSheet sheet = {244.0, 122.0};
    optimize_cuts(panels, totalCount, sheet);

    return 0;
}
