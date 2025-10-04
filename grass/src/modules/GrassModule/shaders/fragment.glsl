uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uGrassParams;
uniform vec3 uBaseColorDarkBlade;
uniform vec3 uTipColorDarkBlade;
uniform vec3 uBaseColorLightBlade;
uniform vec3 uTipColorLightBlade;
uniform vec3 uBaseColorMediumBlade;
uniform vec3 uTipColorMediumBlade;
uniform sampler2D uGrassDisplacementMap;
uniform sampler2D uGrassTexture;
uniform vec2 uGrassColorStep;

varying vec4 vGrassData;
varying float vHeightPercentage;
varying vec2 vUv;
varying vec2 vMapUv;
varying vec3 vDebugColor;

float inverseLerp(float v, float minVal, float maxVal) {
    return (v - minVal) / (maxVal - minVal);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = inverseLerp(v, inMin, inMax);
    return mix(outMin, outMax, t);
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

void main() {
    // Sample the displacement texture
    // the source texture is “black & white.” That vec4 is typically (R, G, B, A).
    // When the displacement map is truly grayscale, all three color channels are identical (R = G = B),
    // so you only need to read one of them—commonly the red channel—because it already contains the luminance you care about.

    // Add inner vein to grass
    float grassX = vGrassData.x;
    float grassY = vGrassData.y;

    // Texture mask
    float mask = texture2D(uGrassDisplacementMap, vMapUv).r;
    mask = smoothstep(uGrassColorStep.x, uGrassColorStep.y, mask);
    vec3 c1 = mix(uBaseColorDarkBlade, uTipColorDarkBlade, vHeightPercentage);
    vec3 c2 = mix(uBaseColorLightBlade, uTipColorLightBlade, vHeightPercentage);
    vec3 grassMixColor = mix(c1, c2, mask);

    vec3 baseColor = mix(grassMixColor, grassMixColor, smoothstep(0.009, 0.0009, abs(grassX)));

    // Shadow drop
    float ao = remap(pow(vHeightPercentage, 1.0), 0.0, 1.0, 0.75, 1.0);

    vec3 finalColor = vec3(baseColor);
    gl_FragColor = vec4(finalColor, 1.0);

    // Using texture as color
    // vec4 grassTexture = texture2D(uGrassTexture, vUv) * mask;
    // // Alpha test
    // if (grassTexture.w < 0.5) { discard; }
    // gl_FragColor = grassTexture;

    // gl_FragColor = vec4(vDebugColor, 1.0); // ! DEBUG
}
