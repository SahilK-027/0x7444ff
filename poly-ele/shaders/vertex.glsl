uniform float uTriScale;
uniform float uProgress;
uniform float uMosaic;
uniform float uTime;
attribute vec3 center;
varying vec2 vUv;
varying vec2 vNormal;
#include noise.glsl;
#include rotation.glsl;

float PI = 3.14285714286;

float backOut(float pregress, float swing) {
    float p = pregress - 1.0;
    return (p * p * ((swing + 1.0) * p + swing) + 1.0);
}

void main() {
    vUv = uv;
    vec3 pos = (position - center) * uTriScale + center;

    float transformStart = -(position.z * 0.5 + 0.5) * 4.0;
    float transformProgress = backOut(clamp(uProgress * 5.0 + transformStart, 0.0, 1.0), 5.0);

    vec3 posPixelated = floor(pos * uMosaic + 0.5) / uMosaic;
    pos = mix(pos, posPixelated, transformProgress);

    float noise = cnoise(vec4(pos, uTime * 0.3));
    float rotation = noise * PI * 0.05;

    pos = rotate(pos, vec3(1.0, 0.0, 0.0), rotation);
    pos = rotate(pos, vec3(0.0, 1.0, 0.0), rotation);
    pos = rotate(pos, vec3(0.0, 0.0, 1.0), rotation);

    float scale = 1.0 + noise * 0.03;
    pos *= scale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}