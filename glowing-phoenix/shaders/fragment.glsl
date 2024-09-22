varying vec2 vUv;
varying vec3 vNormal;
varying float vDisplacement;
uniform float uTime;

uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
uniform vec3 uAccentColor;

float fresnel(vec3 viewDirection, vec3 normal, float power) {
    return pow(1.0 - dot(viewDirection, normal), power);
}

// Improved noise function for more natural-looking effects
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec3 viewDirection = normalize(cameraPosition - vNormal);

    // Enhanced base color with emissive glow
    vec3 color = mix(uBaseColor, uGlowColor, vDisplacement * 0.5);

    // Pulsating ember effect
    float ember = sin(0.5) * 0.5 + 0.5;
    color += uGlowColor * ember * 0.3;

    // Intense rim lighting for a constant magical aura
    float rim = fresnel(viewDirection, vNormal, 3.0);
    color += rim * uGlowColor * 1.2;

    // Dynamic fire-like effect
    float fire = noise(vUv * 10.0 * 0.1);
    fire = smoothstep(0.4, 0.6, fire);
    color += fire * uAccentColor * 0.4;

    // Shimmering effect for magical appearance
    float shimmer = noise(vUv * 20.0 * 0.2);
    color += shimmer * uGlowColor * 0.2;

    // Enhanced feather detail
    float featherDetail = noise(vUv * 30.0);
    color = mix(color, uAccentColor, featherDetail * 0.15);

    // Soft vignette for focus
    float vignette = smoothstep(0.7, 0.3, length(vUv - 0.5));
    color *= vignette * 0.7 + 0.3;

    // Gamma correction for more accurate color representation
    color = pow(color, vec3(0.4545));

    // Intensity boost for stronger glow
    color *= 1.2;

    gl_FragColor = vec4(color, 1.0);
}