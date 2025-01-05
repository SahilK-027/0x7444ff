uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec2 uResolution;
uniform float uTime;
uniform float uTransition;

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

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float floatNoise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);

    // Four corners of the cell
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
}
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float simplexNoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
    0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
    -0.577350269189626,  // -1.0 + 2.0 * C.x
    0.024390243902439); // 1.0 / 41.0
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float remap(float value, float a, float b, float c, float d) {
    return c + (value - a) * (d - c) / (b - a);
}

void main() {
    // Calculate aspect correction
    vec2 aspectCorrection = vec2(1.0, uResolution.y * 1.75 / uResolution.x);
    vec2 correctedUvs = vUv;

    vec2 barrelDistortionUvs = scaleUvs(correctedUvs, vec2(float(1.0 + length(vUv - 0.5))));

    // Grid parameters
    float gridSize = 20.0;
    float lineWidth = 0.03;

    // Hex grid
    vec2 hexUv = barrelDistortionUvs * gridSize;
    vec4 hexCoords = hexCoordinates(hexUv);
    float hexDist = hexagonDistance(hexCoords.xy);
    float hexBorder = smoothstep(0.47, 0.50, hexDist);

    float y = pow(1.0 - max(0.0, 0.5 - hexDist), 10.0) * 1.5;
    float z = simplexNoise(hexCoords.zw * 0.5);

    float offset = 0.2;
    float bounceTransition = 1.0 - smoothstep(0.0, 0.5, abs(uTransition - 0.5));
    float blendCut = smoothstep(vUv.y - offset, vUv.y + offset, remap(uTransition + z * 0.08 * bounceTransition, 0.0, 1.0, -1.0 * offset, 1.0 + offset));
    float merge = 1.0 - smoothstep(0.0, 0.5, abs(blendCut - 0.5));
    float cut = step(vUv.y, uTransition + (((y + z) * 0.15) * bounceTransition));
    vec2 textureUV = correctedUvs + (y * sin(vUv.y * 15.0 - uTime) * merge * 0.025);
    vec2 fromUV = textureUV;
    vec2 toUV = textureUV;
    float colorBlend = merge * hexBorder * bounceTransition;

    fromUV = fromUV, vec2((1.0 + z) * 0.2 * merge + uTransition);
    toUV = toUV, vec2((1.0 + z) * 0.2 * blendCut + uTransition);

    // Textures
    vec4 texture1 = texture2D(uTexture1, fromUV);
    vec4 texture2 = texture2D(uTexture2, toUV);

    vec4 final = mix(texture1, texture2, cut);
    final += vec4(gammaCorrect(vec3(0.44, 0.15, 1.0), 1.2), 1.0) * colorBlend * 2.0;
    gl_FragColor = final;
    // gl_FragColor = vec4(colorBlend);

    // Square pixel grid
    // float squareBorder = squareGrid(barrelDistortionUvs, gridSize, lineWidth);

    // Circular grid
    // float circleBorder = circularGrid(barrelDistortionUvs, gridSize, lineWidth);

    // Octagonal grid
    // float octagonBorder = octagonalGrid(barrelDistortionUvs, gridSize, lineWidth);

    // To switch between patterns, uncomment one of these:
    // gl_FragColor = vec4(vec3(octagonBorder), 1.0);
    // gl_FragColor = vec4(vec3(squareBorder), 1.0);
    // gl_FragColor = vec4(vec3(circleBorder), 1.0);

    // Mix circle + octagon patterns
    // float weightCircle = 0.25;
    // float weightOctagon = 0.35;

    // Combine patterns using weights
    // float combinedPattern = weightCircle * circleBorder + weightOctagon * octagonBorder;

    // gl_FragColor = vec4(vec3(combinedPattern), 1.0);
}