uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec2 uResolution;
uniform float uTime;
uniform float uTransition;
uniform float uPattern;

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
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
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
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
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
float squareDistance(vec2 uv) {
    vec2 p = abs(uv);
    return max(p.x, p.y);
}

float hexagonDistance(vec2 uv) {
    vec2 s = vec2(1.0, 1.73205);
    vec2 p = abs(uv);
    return max(dot(p, s * 0.5), p.x);
}

float circleDistance(vec2 uv) {
    float dist = length(uv);
    float outerRadius = 0.49;
    float innerRadius = 0.45;
    return smoothstep(innerRadius - 0.02, innerRadius, dist) - smoothstep(outerRadius, outerRadius + 0.02, dist);
}

vec4 squareCoordinates(vec2 uv) {
    vec2 squareCenter = floor(uv) + 0.5;
    vec2 offset = uv - squareCenter;
    return vec4(offset, squareCenter);
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

vec4 circleCoordinates(vec2 uv) {
    vec2 circleCenter = floor(uv) + 0.5;
    vec2 offset = uv - circleCenter;
    float dist = length(offset);
    vec4 circleCoord = vec4(offset, circleCenter);
    return circleCoord;
}

void main() {
    vec2 aspectCorrection = vec2(1.0, uResolution.y * 1.75 / uResolution.x);
    vec2 correctedUvs = vUv;

    // Barrel distortion effect
    vec2 barrelDistortionUvs = scaleUvs(correctedUvs, vec2(1.0 + length(vUv - 0.5)));

    // Grid parameters
    float gridSize = 20.0;

    // Get all patterns with dynamic time distortion
    vec2 squareUv = barrelDistortionUvs * gridSize;
    vec4 squareCoords = squareCoordinates(squareUv);
    float squareDist = squareDistance(squareCoords.xy);
    float squareBorder = smoothstep(0.42, 0.5, squareDist);

    vec2 hexUv = barrelDistortionUvs * gridSize;
    vec4 hexCoords = hexCoordinates(hexUv);
    float hexDist = hexagonDistance(hexCoords.xy);
    float hexBorder = smoothstep(0.42, 0.50, hexDist);

    vec2 circleUv = barrelDistortionUvs * gridSize;
    vec4 circleCoords = circleCoordinates(circleUv);
    float circleDist = circleDistance(circleCoords.xy);
    float circleBorder = smoothstep(0.47, 0.48, circleDist);

    // Enhanced pattern blending using fract and time-based variation
    float patternFract = fract(uPattern);
    float patternBase = floor(uPattern);

    float currentPattern;
    vec2 blendedCoords;
    float patternDist;

    if(patternBase == 0.0) {
        currentPattern = mix(squareBorder, hexBorder, patternFract);
        blendedCoords = mix(squareCoords.zw, hexCoords.zw, patternFract);
        patternDist = mix(squareDist, hexDist, patternFract);
    } else if(patternBase == 1.0) {
        currentPattern = mix(hexBorder, circleBorder, patternFract);
        blendedCoords = mix(hexCoords.zw, circleCoords.zw, patternFract);
        patternDist = mix(hexDist, circleDist, patternFract);
    } else {
        currentPattern = mix(circleBorder, squareBorder, patternFract);
        blendedCoords = mix(circleCoords.zw, squareCoords.zw, patternFract);
        patternDist = mix(circleDist, squareDist, patternFract);
    }

    // Apply simplex noise and dynamic lighting influence
    float z = simplexNoise(blendedCoords * 0.5);
    float y = pow(1.0 - max(0.0, 0.5 - patternDist), 20.0) * 1.0;

    // Transition effects, controlled by pattern and time
    float offset = 0.2;
    float bounceTransition = 1.0 - smoothstep(0.0, 0.5, abs(uTransition - 0.5));
    float blendCut = smoothstep(vUv.y - offset, vUv.y + offset, remap(uTransition + z * 0.08 * bounceTransition, 0.0, 1.0, -1.0 * offset, 1.0 + offset));
    float merge = 1.0 - smoothstep(0.0, 0.5, abs(blendCut - 0.5));
    float cut = step(vUv.y, uTransition + (((y + z) * 0.15) * bounceTransition));

    vec2 textureUV = correctedUvs + (y * sin(vUv.y * 15.0 - uTime) * merge * 0.025);
    vec2 fromUV = textureUV;
    vec2 toUV = textureUV;
    float colorBlend = merge * currentPattern * bounceTransition;

    fromUV = scaleUvs(fromUV, vec2(1.0 + z * 0.2 * merge));
    toUV = scaleUvs(toUV, vec2(1.0 + z * 0.2 * blendCut));

    // Apply textures with smooth blending
    vec4 texture1 = texture2D(uTexture1, toUV);
    vec4 texture2 = texture2D(uTexture2, fromUV);

    // Final color mixing with gradient background and texture blend
    vec3 topColor = gammaCorrect(vec3(0.55, 0.5, 0.27), 1.2);
    vec3 bottomColor = gammaCorrect(vec3(0.32, 0.14, 0.8), 1.2);
    vec4 final_color = mix(texture1, texture2, cut) + vec4(mix(topColor, bottomColor, 0.5), 1.0) * colorBlend * 2.0;

    // Apply post-processing effects like bloom or light scattering (optional)
    final_color.rgb += (sin(uTime * 2.0) * 0.1) * colorBlend * 2.0;

    gl_FragColor = final_color;
}