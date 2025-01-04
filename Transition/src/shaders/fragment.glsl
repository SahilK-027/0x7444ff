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

// Square grid function
float squareGrid(vec2 uv, float gridSize, float lineWidth) {
    vec2 grid = fract(uv * gridSize);
    vec2 borders = smoothstep(0.0, lineWidth, grid) *
        smoothstep(0.0, lineWidth, 1.0 - grid);
    return 1.0 - min(borders.x, borders.y);
}

// Circular grid function
float circularGrid(vec2 uv, float gridSize, float lineWidth) {
    vec2 grid = fract(uv * gridSize) - 0.5;
    float dist = length(grid);
    return smoothstep(0.4 - lineWidth, 0.4, dist) *
        smoothstep(0.5, 0.5 - lineWidth, dist);
}

// Octagonal grid function
float octagonalGrid(vec2 uv, float gridSize, float lineWidth) {
    vec2 grid = fract(uv * gridSize) - 0.5;
    float angle = atan(grid.y, grid.x);
    float r = length(grid);

    // Create 8 sides
    float sides = 8.0;
    float polygon = cos(floor(0.5 + angle * sides / 6.28318) * 6.28318 / sides - angle);
    polygon = r * polygon;

    return smoothstep(0.35 - lineWidth, 0.35, polygon) *
        smoothstep(0.4, 0.4 - lineWidth, polygon);
}

vec2 scaleUvs(vec2 uv, vec2 aspectCorrection) {
    return (uv - 0.5) * aspectCorrection + 0.5;
}

void main() {
    // Calculate aspect correction
    vec2 aspectCorrection = vec2(1.0, uResolution.y / uResolution.x);
    vec2 correctedUvs = scaleUvs(vUv, aspectCorrection);

    // Texture 
    vec4 texture = texture2D(uTexture, correctedUvs);
    gl_FragColor = texture;

    vec2 barrelDistortionUvs = scaleUvs(correctedUvs, vec2(float(1.0 + length(vUv - 0.5))));

    // Grid parameters
    float gridSize = 30.0;
    float lineWidth = 0.03;

    // Hex grid
    vec2 hexUv = barrelDistortionUvs * gridSize;
    vec4 hexCoords = hexCoordinates(hexUv);
    float hexDist = hexagonDistance(hexCoords.xy);
    float hexBorder = smoothstep(0.48, 0.52, hexDist);

    // Square pixel grid
    float squareBorder = squareGrid(barrelDistortionUvs, gridSize, lineWidth);

    // Circular grid
    float circleBorder = circularGrid(barrelDistortionUvs, gridSize, lineWidth);

    // Octagonal grid
    float octagonBorder = octagonalGrid(barrelDistortionUvs, gridSize, lineWidth);

    // Combine all grids (you can modify this part to show different patterns)
    // Example: showing octagonal grid
    // gl_FragColor = vec4(vec3(octagonBorder), 1.0);

    // To switch between patterns, uncomment one of these:
    gl_FragColor = vec4(vec3(hexBorder), 1.0);
    gl_FragColor = vec4(vec3(squareBorder), 1.0);
    gl_FragColor = vec4(vec3(circleBorder), 1.0);
}