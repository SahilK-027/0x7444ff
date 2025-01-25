uniform float uTime;
varying vec2 vUv;

#include "./3DPerlinNoise.glsl";

void main()
{
    // Adding patterns
    float pattern = sin(0.01);
    pattern -= abs(cnoise(vec3(vUv * 5.0, uTime * 0.2)) * 0.15);

    // Colors
    vec3 color1 = vec3(1.0, 0.0, 0.35);
    vec3 color2 = vec3(0.01, 0.0, 0.0);

    float mixStrength = pattern * 2.0 + 0.25;
    vec3 mixColor = mix(color2, color1, mixStrength);

    if (mixStrength > 0.24) {
        mixColor += 1.0;
    }

    gl_FragColor = vec4(pow(mixColor, vec3(1.0 / 2.2)), 1.0);
}
