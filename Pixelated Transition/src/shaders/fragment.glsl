uniform sampler2D uTexture;
varying vec2 vUv;

// Function to calculate square distance
float squareDistance(vec2 uv) {
    vec2 p = abs(uv); // Absolute position relative to the center
    return max(p.x, p.y); // Distance to the square edge
}

void main() {
    // Adjusting the texture coordinates for proper centering and scaling
    vec2 uv = (vUv - 0.5);
    vec4 texture = texture2D(uTexture, vUv);
    gl_FragColor = texture;

    float square = squareDistance(uv);
    gl_FragColor = vec4(vec3(square), 1.0);
}
