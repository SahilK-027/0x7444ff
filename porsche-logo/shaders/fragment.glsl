precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D mask;

varying vec2 vUv;

void main() {
    vec4 textureColor = texture2D(uTexture, vUv);
    vec4 mask = texture2D(mask, vUv);
    // gl_FragColor = textureColor;
    gl_FragColor = mask;
}
