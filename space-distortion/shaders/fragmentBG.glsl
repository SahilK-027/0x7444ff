precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D mask;
uniform float uMovementStrength;

varying vec2 vUv;

void main() {
    vec4 mask = texture2D(mask, vUv);

    float strength = mask.a;
    strength *= uMovementStrength;
    strength = min(1.0, strength);

    vec4 textureColor = texture2D(uTexture, vUv + (1.0 - strength) * 0.1);
    gl_FragColor = textureColor * strength;
    // gl_FragColor.a *= mask.a;
    // gl_FragColor = mask;
}
