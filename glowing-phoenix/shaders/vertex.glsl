uniform float uTriScale;
uniform float uProgress;
uniform float uMosaic;
uniform float uTime;
uniform vec2 uMousePosition;
uniform float uHover;
uniform vec2 uMouseVelocity;
attribute vec3 center;
varying vec2 vUv;
varying vec3 vNormal;
varying float vDisplacement;
varying vec3 vPosition;
#include noise.glsl;

const float PI = 3.14159265359;

float backOut(float pregress, float swing) {
    float p = pregress - 1.0;
    return (p * p * ((swing + 1.0) * p + swing) + 1.0);
}

void main() {
    vUv = uv;
    vNormal = normal;
    vPosition = position;
    // Subtle scaling effect
    float scale = uTriScale + sin(uTime * 0.5) * 0.02;
    vec3 pos = (position - center) * scale + center;

    // Gentle wave effect
    float wave = sin(pos.y * 5.0 + uTime) * 0.005;
    pos.x += wave;
    pos.z += wave;

    // Subtle noise-based displacement
    float noise = cnoise(vec4(pos * 2.0, uTime * 0.1)) * 0.01;
    pos += normal * noise;

    // Mouse interaction effect
    vec3 mouseDelta = vec3(uMousePosition, 0.0) - pos;
    float mouseDistance = length(mouseDelta);
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDistance) * uHover;
    pos += normalize(mouseDelta) * mouseInfluence * 0.02;

    float transformStart = -(position.z * 0.5 + 0.5) * 4.0;
    float transformProgress = backOut(clamp(uProgress * 5.0 + transformStart, 0.0, 1.0), 5.0);

    vec3 posPixelated = floor(pos * uMosaic + 0.5) / uMosaic;
    pos += mix(pos, posPixelated, transformProgress);

    // Calculate displacement for fragment shader
    vDisplacement = noise + mouseInfluence * 2.0;

    // Apply model view projection matrix
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}