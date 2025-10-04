// Map v from [minVal, maxVal] → [0,1]
float inverseLerp(float v, float minVal, float maxVal) {
    return (v - minVal) / (maxVal - minVal);
}

// Remap v from [inMin, inMax] → [outMin, outMax]
float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

// Clamp x into the [0,1] range
float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

float easeOut(float x, float t) {
    return 1.0 - pow(1.0 - x, t);
}
