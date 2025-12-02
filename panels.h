#ifndef PANELS_H
#define PANELS_H

typedef struct {
    char name[30];
    float length;
    float width;
    int quantity;
} Panel;

int generate_panels(float W, float H, float D, float T, int shelves,
                    int cabinetIndex, int startIndex, Panel* output);

#endif
