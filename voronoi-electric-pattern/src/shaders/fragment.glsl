precision mediump float;
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;

#define TAU 2.0 * 3.142857

// Hash function uniforms
uniform vec2 uHashFract;
uniform float uHashDot;

// Rand01 uniforms
uniform vec3 uRandFract;
uniform float uRandDot;

// Noise uniforms
uniform float uNoiseSmoothness;

// FBM uniforms
uniform float uFbmAmp;
uniform float uFbmFreq;
uniform float uFbmFreqMult;
uniform float uFbmAmpMult;

// Voronoi uniforms
uniform float uVoronoiJitter;
uniform float uVoronoiAnimBase;
uniform float uVoronoiSinSpeed1;
uniform float uVoronoiSinSpeed2;
uniform float uVoronoiSinAmp1;
uniform float uVoronoiSinSpeed3;
uniform float uVoronoiSinSpeed4;
uniform float uVoronoiSinAmp2;
uniform float uVoronoiFbmScale1;
uniform float uVoronoiFbmSpeed1;
uniform float uVoronoiFbmScale2;
uniform float uVoronoiFbmSpeed2;
uniform float uVoronoiFbmDispl;

// Swirl uniforms
uniform float uSwirlSmoothStart;
uniform float uSwirlSmoothEnd;
uniform float uSwirlSpeedMult;
uniform float uSwirlNoiseAmp2;
uniform float uSwirlNoiseScale2;
uniform float uSwirlNoiseScale3;
uniform float uSwirlNoiseSpeed1;
uniform float uSwirlNoiseSpeed2;
uniform float uSwirlNoiseSpeed3;
uniform float uSwirlNoiseSpeed4;
uniform float uSwirlRadialFlow;

// Cell counts
uniform float uCellCount2;
uniform float uCellCount3;

// Layer speeds
uniform float uLayer2Speed;
uniform float uLayer2Twist;
uniform float uLayer2NoiseScale;
uniform float uLayer2NoiseAmp;
uniform float uLayer2TimeSpeed;
uniform float uLayer2Seed;

uniform float uLayer3Speed;
uniform float uLayer3Twist;
uniform float uLayer3NoiseScale;
uniform float uLayer3NoiseAmp;
uniform float uLayer3TimeSpeed;
uniform float uLayer3Seed;

// Edge uniforms
uniform float uEdgeNoiseScale;
uniform float uEdgeNoiseSpeed;
uniform float uEdgeWidthMin;
uniform float uEdgeWidthMax;
uniform float uBaseWidth;

uniform float uSecondaryEdgeWidth;
uniform float uSecondaryEdgePow;
uniform float uSecondaryEdgeStrength;

uniform float uTertiaryEdgeWidth;
uniform float uTertiaryEdgePow;
uniform float uTertiaryEdgeStrength;

// Glow uniforms
uniform float uGlow2Start;
uniform float uGlow2End;
uniform float uGlow2Pow;
uniform float uGlow2Strength;

uniform float uGlow3Start;
uniform float uGlow3End;
uniform float uGlow3Pow;
uniform float uGlow3Strength;

// Junction uniforms
uniform float uJunctionWidth;
uniform float uJunctionPow;
uniform float uJunctionStrength;

// Color noise uniforms
uniform float uColorNoise2Scale;
uniform float uColorNoise2Speed;
uniform float uColorNoise3Scale;
uniform float uColorNoise3Speed;
uniform float uEdgeBrightnessMin;
uniform float uEdgeBrightnessMax;

// Cell light uniforms
uniform float uCellLight2Mult;
uniform float uCellLight2Strength;
uniform float uCellLight3Mult;
uniform float uCellLight3Strength;

// Background uniforms
uniform float uBgNoiseScale;
uniform float uBgNoiseSpeed;
uniform float uBgDetailScale;
uniform float uBgDetailSpeed;
uniform float uBgValueMin;
uniform float uBgValueMax;
uniform float uBgNoiseStrength;
uniform float uBgDetailStrength;
uniform vec3 uBgColor;

// Caustic weights
uniform float uSecondaryWeight;
uniform float uTertiaryWeight;
uniform float uGlow2Weight;
uniform float uGlow3Weight;
uniform float uJunctionWeight;

// Color shift
uniform vec3 uColorShift;

// Color grading
uniform float uColorMultiplier;
uniform float uColorGamma;

// Fresnel
uniform float uFresnelPow;
uniform float uFresnelStrength;

float hash(vec2 p) {
    p = fract(p * uHashFract);
    p += dot(p, p + uHashDot);
    return fract(p.x * p.y);
}

vec2 rand01(vec2 p) {
    vec3 a = fract(p.xyx * uRandFract);
    a += dot(a, a + uRandDot);
    return fract(vec2(a.x * a.y, a.y * a.z));
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (uNoiseSmoothness - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amp = uFbmAmp;
    float freq = uFbmFreq;
    for (int i = 0; i < 1; i++) {
        value += amp * noise(p * freq);
        freq *= uFbmFreqMult;
        amp *= uFbmAmpMult;
    }
    return value;
}

vec3 voronoiF1F2F3(vec2 uv, float time, float seed, float cells) {
    float INF = 1e6;
    float min1 = INF;
    float min2 = INF;
    float min3 = INF;

    vec2 cellUv = fract(uv * cells) - 0.5;
    vec2 cellCoord = floor(uv * cells);

    for (float xo = -1.0; xo <= 1.0; xo += 1.0) {
        for (float yo = -1.0; yo <= 1.0; yo += 1.0) {
            vec2 off = vec2(xo, yo);
            vec2 nc = cellCoord + off;
            vec2 r = rand01(nc + seed);
            vec2 jitter = (r - 0.5) * uVoronoiJitter;

            vec2 sinPart = vec2(
                    sin(time * uVoronoiSinSpeed1 + r.x * TAU) + uVoronoiSinAmp1 * cos(time * uVoronoiSinSpeed2 + r.x * TAU * uVoronoiSinAmp1),
                    cos(time * uVoronoiSinSpeed3 + r.y * TAU) + uVoronoiSinAmp2 * sin(time * uVoronoiSinSpeed4 + r.y * TAU * uVoronoiSinSpeed2)
                ) * uVoronoiAnimBase;

            vec2 fb = vec2(
                    fbm(nc * uVoronoiFbmScale1 + vec2(time * uVoronoiFbmSpeed1)),
                    fbm(nc * uVoronoiFbmScale2 - vec2(time * uVoronoiFbmSpeed2))
                );
            vec2 fbDispl = (fb - 0.5) * uVoronoiFbmDispl;

            vec2 point = off + jitter + sinPart + fbDispl;
            float d = length(cellUv - point);

            if (d < min1) {
                min3 = min2;
                min2 = min1;
                min1 = d;
            } else if (d < min2) {
                min3 = min2;
                min2 = d;
            } else if (d < min3) {
                min3 = d;
            }
        }
    }

    return vec3(min1, min2, min3);
}

vec2 organicSwirlUV(vec2 uv, float speed, float twist, float noiseScale, float noiseAmp) {
    vec2 c = uv - 0.5;
    float r = length(c);
    float a = atan(c.y, c.x);

    float n = fbm(uv * noiseScale + vec2(uTime * uSwirlNoiseSpeed1));
    float n2 = fbm(uv * (noiseScale * uSwirlNoiseScale2) - vec2(uTime * uSwirlNoiseSpeed2));
    float n3 = fbm(uv * (noiseScale * uSwirlNoiseScale3) + vec2(uTime * uSwirlNoiseSpeed3, -uTime * uSwirlNoiseSpeed4));

    float fall = smoothstep(uSwirlSmoothStart, uSwirlSmoothEnd, r);
    a += speed * uSwirlSpeedMult * fall + twist * r * r + (n - 0.5) * noiseAmp + (n2 - 0.5) * noiseAmp * uSwirlNoiseAmp2;

    float radialFlow = (n3 - 0.5) * uSwirlRadialFlow * fall;
    r = max(0.0, r + radialFlow);

    vec2 rotated = vec2(cos(a), sin(a)) * r;
    return rotated + 0.5;
}

void main() {
    vec2 baseUV = vUv;

    // Layer 2 - Secondary detail
    vec2 uv2 = organicSwirlUV(baseUV, uLayer2Speed, uLayer2Twist, uLayer2NoiseScale, uLayer2NoiseAmp);
    vec3 F2 = voronoiF1F2F3(uv2, uTime * uLayer2TimeSpeed, uLayer2Seed, uCellCount2);

    // Layer 3 - Large flowing shapes
    vec2 uv3 = organicSwirlUV(baseUV, uLayer3Speed, uLayer3Twist, uLayer3NoiseScale, uLayer3NoiseAmp);
    vec3 F3 = voronoiF1F2F3(uv3, uTime * uLayer3TimeSpeed, uLayer3Seed, uCellCount3);

    // Edge calculations
    float e12_2 = F2.y - F2.x;
    float e12_3 = F3.y - F3.x;

    // Dynamic edge width
    float edgeNoise = fbm(uv2 * uCellCount2 * uEdgeNoiseScale + vec2(uTime * uEdgeNoiseSpeed));
    float widthMod = mix(uEdgeWidthMin, uEdgeWidthMax, edgeNoise);
    float baseWidth = uBaseWidth * widthMod;

    // Edges
    float secondaryEdge = pow(1.0 - smoothstep(0.0, baseWidth * uSecondaryEdgeWidth, e12_2), uSecondaryEdgePow) * uSecondaryEdgeStrength;
    float tertiaryEdge = pow(1.0 - smoothstep(0.0, baseWidth * uTertiaryEdgeWidth, e12_3), uTertiaryEdgePow) * uTertiaryEdgeStrength;

    // Glows
    float glow2 = pow(1.0 - smoothstep(baseWidth * uGlow2Start, baseWidth * uGlow2End, e12_2), uGlow2Pow) * uGlow2Strength;
    float glow3 = pow(1.0 - smoothstep(baseWidth * uGlow3Start, baseWidth * uGlow3End, e12_3), uGlow3Pow) * uGlow3Strength;

    // Junction hotspots
    float junction2 = pow(1.0 - smoothstep(0.0, baseWidth * uJunctionWidth, e12_2 + (F2.z - F2.y)), uJunctionPow) * uJunctionStrength;

    // Animated color variation
    float colorNoise2 = noise(uv2 * uCellCount2 * uColorNoise2Scale + vec2(uTime * uColorNoise2Speed));
    float colorNoise3 = noise(uv3 * uCellCount3 * uColorNoise3Scale - vec2(uTime * uColorNoise3Speed));
    float edgeBrightness = mix(uEdgeBrightnessMin, uEdgeBrightnessMax, colorNoise2);

    // Rich background
    float cellLight2 = exp(-F2.x * F2.x * uCellLight2Mult) * uCellLight2Strength;
    float cellLight3 = exp(-F3.x * F3.x * uCellLight3Mult) * uCellLight3Strength;

    float bgNoise = fbm(uv2 * uCellCount2 * uBgNoiseScale + vec2(uTime * uBgNoiseSpeed));
    float bgDetail = fbm(uv3 * uCellCount3 * uBgDetailScale - vec2(uTime * uBgDetailSpeed)) * 0.5;

    float bgValue = mix(uBgValueMin, uBgValueMax, cellLight2 + cellLight3);
    bgValue += bgNoise * uBgNoiseStrength + bgDetail * uBgDetailStrength;

    vec3 baseColor = vec3(bgValue) * uBgColor;

    // Build up caustic layers
    vec3 causticColor = vec3(edgeBrightness);
    vec3 color = baseColor;

    // Add edge contributions
    color += causticColor * (secondaryEdge * uSecondaryWeight + tertiaryEdge * uTertiaryWeight);

    // Add glow layers
    color += causticColor * (glow2 * uGlow2Weight + glow3 * uGlow3Weight);

    // Add junction hotspots
    color += vec3(0.9, 0.96, 1.0) * (junction2 * uJunctionWeight);

    // Add color variation
    color *= uColorShift;

    // Color grading
    color = clamp(color, 0.0, 1.0) * uColorMultiplier;
    color = pow(color, vec3(uColorGamma));

    gl_FragColor = vec4(color, 1.0);
}
