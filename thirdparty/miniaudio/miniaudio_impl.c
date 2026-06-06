#define MINIAUDIO_IMPLEMENTATION
#include "miniaudio.h"
#include <stdio.h>

void* miniaudio_engine_create() {
    printf("Miniaudio engine created (dummy)\n");
    return malloc(1);
}

void miniaudio_engine_start(void* engine) {
    printf("Miniaudio engine started (dummy)\n");
}

void miniaudio_engine_stop(void* engine) {
    printf("Miniaudio engine stopped (dummy)\n");
}

void miniaudio_engine_uninit(void* engine) {
    printf("Miniaudio engine uninitialized (dummy)\n");
    free(engine);
}

int miniaudio_engine_play_file(void* engine, const char* filename) {
    printf("Miniaudio playing file: %s (dummy)\n", filename);
    return 0;
}
