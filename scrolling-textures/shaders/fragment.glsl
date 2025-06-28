varying vec2 vUv;
uniform float uTime;
uniform float uAmplitude;
uniform float uScrollSpeed;

uniform sampler2D uDiffuse;

float inverseLerp(float v, float minVal, float maxVal) {
    return (v - minVal) / (maxVal - minVal);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i + vec2(0.0, 0.0));
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    float n0 = mix(a, b, u.x);
    float n1 = mix(c, d, u.x);
    return mix(n0, n1, u.y);
}

float fbm(in vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
        v += amp * noise2D(p);
        p = rot * p * 2.0;
        amp *= 0.5;
    }
    return v;
}

void main() {
    // 1) scroll the diffuse texture UV (e.g. down‐right)
    vec2 waterTextureScroll = vec2(1.0, 1.0) * uScrollSpeed * uTime;
    vec2 waterScrolledUv = vUv + waterTextureScroll;

    // 2) scroll the displacement map UV (e.g. up‐right)
    vec2 dispMapScroll = vec2(-1.0, 1.0) * uScrollSpeed * uTime;
    vec2 dispScrolledUv = vUv + dispMapScroll;

    // 3) sample the displacement map
    float noise = clamp(fbm(dispScrolledUv * 15.0 + uTime * 0.2), 0.0, 1.0);
    vec2 offset = vec2(noise - 0.5) * uAmplitude;

    // 4) apply the displacement offset to the already‐scrolled water UV
    vec2 finalUv = waterScrolledUv + offset;

    // 5) sample your diffuse at the displaced, scrolled UV
    vec4 color = texture2D(uDiffuse, finalUv);

    gl_FragColor = color;
}
