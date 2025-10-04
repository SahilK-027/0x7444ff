uniform sampler2D uFlowerDiffuse;
// fragmentShader.glsl
uniform vec3 uColor;
varying float vVisibility;
varying vec2 vUv;

void main() {
    vec4 flowerTexture = texture2D(uFlowerDiffuse, vUv);
    // Alpha test
    if (flowerTexture.w < 0.5) {
        discard;
    }
    gl_FragColor = flowerTexture * 1.125;
}
