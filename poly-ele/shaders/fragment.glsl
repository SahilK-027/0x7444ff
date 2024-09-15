uniform float uRedShift;
uniform float uGreenShift;
uniform float uBlueShift;
varying vec2 vUv;

void main() {
    gl_FragColor = vec4(vUv.x * uRedShift, vUv.y * uGreenShift, uBlueShift, 1.0);
}