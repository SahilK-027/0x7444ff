vec3 bezier(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
    return (1.0 - t) * (1.0 - t) * (1.0 - t) * P0 +
        3.0 * (1.0 - t) * (1.0 - t) * t * P1 +
        3.0 * (1.0 - t) * t * t * P2 +
        t * t * t * P3;
}

vec3 bezierGrad(vec3 P0, vec3 P1, vec3 P2, vec3 P3, float t) {
    return 3.0 * (1.0 - t) * (1.0 - t) * (P1 - P0) +
        6.0 * (1.0 - t) * t * (P2 - P1) +
        3.0 * t * t * (P3 - P2);
}
