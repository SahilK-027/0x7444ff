uniform sampler2D uTexture;
uniform vec2 uResolution;
varying vec2 vUv;

// Function for calculating square distance
float squareDistance(vec2 uv) {
    vec2 p = abs(uv - 0.5);
    return max(p.x, p.y);
}

// Function for calculating hexagon distance
float hexagonDistance(vec2 uv) {
    vec2 s = vec2(1.0, 1.73205);
    vec2 p = abs(uv - 0.5);
    return max(dot(p, s * 0.5), p.x);
}

float octagonDistance(vec2 uv) {
    vec2 p = abs(uv - 0.5);
    vec2 r = vec2(0.4472135955, 1.847759065); // Constants for octagon shape
    return max(max(dot(r.xy, p), dot(r.yx, p)), max(p.x, p.y));
}

void main() {
    // Calculate aspect correction
    vec2 aspectCorrection = vec2(1.0, uResolution.y / uResolution.x);
    vec2 correctedUvs = (vUv - 0.5) * aspectCorrection + 0.5;

    // Sample texture with corrected coordinates
    vec4 texture = texture2D(uTexture, vUv);

    gl_FragColor = texture;
    // float distance = squareDistance(correctedUvs);
    // float distance = hexagonDistance(correctedUvs);
    // float distance = octagonDistance(correctedUvs);

    // gl_FragColor = vec4(vec3(distance), 1.0);
}