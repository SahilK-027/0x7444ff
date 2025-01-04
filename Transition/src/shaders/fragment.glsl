uniform sampler2D uTexture;
uniform vec2 uResolution;
varying vec2 vUv;

vec3 gammaCorrect(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
}

// Hex grid generation
float hexagonDistance(vec2 uv) {
    vec2 s = vec2(1.0, 1.73205);
    vec2 p = abs(uv);
    return max(dot(p, s * 0.5), p.x);
}

vec4 sround(vec4 s) {
    return floor(s + 0.5);
}

vec4 hexCoordinates(vec2 uv) {
    vec2 s = vec2(1.0, 1.73205);
    vec4 hexCenter = sround(vec4(uv, uv - vec2(0.5, 1.0)) / s.xyxy);
    vec4 offset = vec4(uv - (hexCenter.xy * s), uv - ((hexCenter.zw + 0.5) * s));

    float dot1 = dot(offset.xy, offset.xy);
    float dot2 = dot(offset.zw, offset.zw);

    vec4 final1 = vec4(offset.xy, hexCenter.xy);
    vec4 final2 = vec4(offset.zw, hexCenter.zw);
    float diff = dot1 - dot2;
    vec4 final = mix(final1, final2, step(0.0, diff));

    return final;
}

vec2 scaleUvs(vec2 uv, vec2 aspectCorrection) {
    return (uv - 0.5) * aspectCorrection + 0.5;
}

// Square grid function
float squareGrid(vec2 uv, float gridSize, float lineWidth) {
    vec2 grid = fract(uv * gridSize);
    vec2 borders = smoothstep(0.0, lineWidth, grid) *
        smoothstep(0.0, lineWidth, 1.0 - grid);
    return 1.0 - min(borders.x, borders.y);
}

void main() {
    // Calculate aspect correction
    vec2 aspectCorrection = vec2(1.0, uResolution.y / uResolution.x);
    vec2 correctedUvs = scaleUvs(vUv, aspectCorrection);

    // Texture 
    vec4 texture = texture2D(uTexture, correctedUvs);
    gl_FragColor = texture;

    vec2 barrelDistortionUvs = scaleUvs(correctedUvs, vec2(float(1.0 + length(vUv - 0.5))));

    // Hex grid
    vec2 hexUv = barrelDistortionUvs * 30.0;
    vec4 hexCoords = hexCoordinates(hexUv);
    float hexDist = hexagonDistance(hexCoords.xy);
    float hexBorder = smoothstep(0.48, 0.52, hexDist);
    gl_FragColor = vec4(vec3(hexBorder), 1.0);

    // Square pixel grid
    float gridSize = 30.0;
    float lineWidth = 0.03; 
    float squareBorder = squareGrid(barrelDistortionUvs, gridSize, lineWidth);
    gl_FragColor = vec4(vec3(squareBorder), 1.0);
}