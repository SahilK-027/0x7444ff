uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec2 uResolution;
uniform float uTime;
uniform float uTransition;

varying vec2 vUv;

/* 
* * Helpers
*/
vec3 gammaCorrect(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
}

vec4 sround(vec4 s) {
    return floor(s + 0.5);
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

/*
* * Grid generators
*/
float hexagonDistance(vec2 uv) {
    vec2 s = vec2(1.0, 1.73205);
    vec2 p = abs(uv);
    return max(dot(p, s * 0.5), p.x);
}

float octagonalDistance(vec2 uv) {
    vec2 p = abs(uv);

    float square = max(p.x, p.y);
    float diagonal = (p.x + p.y) * 0.7071067811865476; // 1.0 / sqrt(2)

    // Use min to get the octagonal distance
    return max(square, diagonal);
}

float squareDistance(vec2 uv) {
    vec2 p = abs(uv);
    return max(p.x, p.y); // Maximum of the x and y components defines the square distance
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

vec4 octCoordinates(vec2 uv) {
    // Constants for octagon geometry
    float a = 1.0 + sqrt(2.0); // Length of octagon side
    vec2 s = vec2(a, a); // Scale factors for octagonal grid

    // Calculate centers of potential octagon cells
    vec4 octCenter = sround(vec4(uv, uv - vec2(0.5, 1.0)) / s.xyxy);

    // Calculate offsets from centers
    vec4 offset = vec4(uv - (octCenter.xy * s), uv - ((octCenter.zw + 0.5) * s));

    // Calculate distances to determine closest center
    float dot1 = dot(offset.xy, offset.xy);
    float dot2 = dot(offset.zw, offset.zw);

    // Create final coordinates with offsets and centers
    vec4 final1 = vec4(offset.xy, octCenter.xy);
    vec4 final2 = vec4(offset.zw, octCenter.zw);

    // Choose the closest center
    float diff = dot1 - dot2;
    vec4 final = mix(final1, final2, step(0.0, diff));

    return final;
}

vec4 squareCoordinates(vec2 uv) {
    vec2 squareCenter = floor(uv) + 0.5; // Center of the closest square cell
    vec2 offset = uv - squareCenter;     // Offset from the square center

    // Return both the offset and the coordinates of the square center
    return vec4(offset, squareCenter);
}

void main() {
    // Calculate aspect correction
    vec2 aspectCorrection = vec2(1.0, uResolution.y * 1.75 / uResolution.x);
    vec2 correctedUvs = vUv;

    vec2 barrelDistortionUvs = scaleUvs(correctedUvs, vec2(float(1.0 + length(vUv - 0.5))));

    // Grid parameters
    float gridSize = 20.0;

    // Get hex and octagon patterns
    vec2 hexUv = barrelDistortionUvs * gridSize;
    vec4 hexCoords = hexCoordinates(hexUv);
    float hexDist = hexagonDistance(hexCoords.xy);
    float hexBorder = smoothstep(0.47, 0.50, hexDist);

    // Octagon setup using new coordinate system
    vec2 squareUv = barrelDistortionUvs * gridSize;
    vec4 squareCoords = squareCoordinates(squareUv);
    float squareDist = squareDistance(squareCoords.xy);
    float squareBorder = smoothstep(0.47, 0.49, squareDist);

    // Transition logic
    float transitionPeriod = 16.0;
    float t = mod(uTime, transitionPeriod) / transitionPeriod;
    float blend = smoothstep(0.0, 1.0, (sin(t * 6.28318) + 1.0) * 0.5);

    // Blend between patterns
    float currentPattern = mix(hexBorder, squareBorder, blend);

    // Blend coordinates for noise
    vec2 blendedCoords = mix(hexCoords.zw, squareCoords.zw, blend);
    float z = simplexNoise(blendedCoords * 0.5);

    float y = mix(pow(1.0 - max(0.0, 0.5 - hexDist), 10.0) * 1.5, pow(1.0 - max(0.0, 0.5 - squareDist), 10.0) * 1.5, blend);

    float offset = 0.2;
    float bounceTransition = 1.0 - smoothstep(0.0, 0.5, abs(uTransition - 0.5));
    float blendCut = smoothstep(vUv.y - offset, vUv.y + offset, remap(uTransition + z * 0.08 * bounceTransition, 0.0, 1.0, -1.0 * offset, 1.0 + offset));
    float merge = 1.0 - smoothstep(0.0, 0.5, abs(blendCut - 0.5));
    float cut = step(vUv.y, uTransition + (((y + z) * 0.15) * bounceTransition));
    vec2 textureUV = correctedUvs + (y * sin(vUv.y * 15.0 - uTime) * merge * 0.025);
    vec2 fromUV = textureUV;
    vec2 toUV = textureUV;
    float colorBlend = merge * currentPattern * bounceTransition;

    fromUV = fromUV, vec2((1.0 + z) * 0.2 * merge + uTransition);
    toUV = toUV, vec2((1.0 + z) * 0.2 * blendCut + uTransition);

    // Textures
    vec4 texture1 = texture2D(uTexture1, fromUV);
    vec4 texture2 = texture2D(uTexture2, toUV);

    vec4 final = mix(texture1, texture2, cut);
    vec3 topColor = gammaCorrect(vec3(1.0, 0.84, 0.15), 1.2);
    vec3 bottomColor = gammaCorrect(vec3(0.44, 0.15, 1.0), 1.2);

    final += vec4(mix(topColor, bottomColor, 0.5), 1.0) * colorBlend * 2.0;
    gl_FragColor = final;
}