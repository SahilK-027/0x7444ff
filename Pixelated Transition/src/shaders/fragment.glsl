uniform sampler2D uTexture;
uniform vec2 uResolution;
varying vec2 vUv;

vec3 gammaCorrect(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
}

float hexagonDistance(vec2 uv) {
    vec2 s = vec2(1.0, 1.73205);
    vec2 p = abs(uv - 0.5);
    return max(dot(p, s * 0.5), p.x);
}

vec4 sround(vec4 s) {
    return floor(s + 0.5);
}

vec4 hexCoordinates(vec2 uv) {
    vec2 s = vec2(1.0, 1.73205);
    vec2 tovaruv = uv;
    vec4 hexCenter = sround(vec4(uv, tovaruv - vec2(0.5, 1.0)) / s.xyxy);
    vec4 offset = vec4(uv - (hexCenter.xy * s), uv - ((hexCenter.zw + 0.5) * s));

    float dot1 = dot(offset.xy, offset.xy);
    float dot2 = dot(offset.zw, offset.zw);

    vec4 final1 = vec4(offset.xy, hexCenter.xy);
    vec4 final2 = vec4(offset.zw, hexCenter.zw);
    float diff = dot1 - dot2;
    vec4 final = mix(final1, final2, step(0.0, diff));

    return final;
}

void main() {
    // Calculate aspect correction
    vec2 aspectCorrection = vec2(1.0, uResolution.y / uResolution.x);
    vec2 correctedUvs = (vUv - 0.5) * aspectCorrection + 0.5;
    vec4 texture = texture2D(uTexture, vUv);
    gl_FragColor = texture;

    // Hex grid
    vec2 hexUv = correctedUvs * 20.0;
    vec4 hexCoords = hexCoordinates(hexUv);
    gl_FragColor = vec4(gammaCorrect(vec3(hexCoords.xy, 0.0), 2.2), 1.0);
}