uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
    vec2 TextureUV = vec2(vUv.x, vUv.y);
    vec4 texture = texture2D(uTexture, TextureUV);

    gl_FragColor = texture;
}
