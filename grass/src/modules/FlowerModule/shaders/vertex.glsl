// flowerVertex.glsl
attribute vec2 instanceShear; // our per-instance shear
varying float vVisibility;
varying vec2 vUv;

mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    // columns:      X       Y            Z
    return mat3(
        vec3(1.0, 0.0, 0.0), // X stays the same
        vec3(0.0, c, s), // Y → (c·Y + s·Z)
        vec3(0.0, -s, c) // Z → (–s·Y + c·Z)
    );
}

uvec2 murmurHash21(uint src) {
    const uint M = 0x5bd1e995u;
    uvec2 h = uvec2(1190494759u, 2147483647u);
    src *= M;
    src ^= src >> 24u;
    src *= M;
    h *= M;
    h ^= src;
    h ^= h >> 13u;
    h *= M;
    h ^= h >> 15u;
    return h;
}
vec2 hash21(float src) {
    uvec2 h = murmurHash21(floatBitsToUint(src));
    return uintBitsToFloat(h & 0x007fffffu | 0x3f800000u) - 1.0;
}

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

void main() {
    // apply shear: bend x and z by y * shear
    vec3 pos = position;

    vec2 hashedInstanceID = hash21(float(gl_InstanceID)) * 2.0 - 1.0;
    float angle = remap(hashedInstanceID.x, -1.0, 1.0, -3.142, 3.142);

    pos *= rotateX(3.142 / 2.0 * (angle * 0.5));

    pos.x += instanceShear.x * position.y;
    pos.z += instanceShear.y * position.y;
    pos.y += 0.15;

    // now normal instanced transform
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;

    vVisibility = 1.0;
    vUv = uv;
}
