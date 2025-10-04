// rotate around X‑axis by θ: Y→Z plane
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    // columns:      X       Y            Z
    return mat3(
        vec3(1.0, 0.0, 0.0), // X stays the same
        vec3(0.0, c, s), // Y → (c·Y + s·Z)
        vec3(0.0, -s, c) // Z → (–s·Y + c·Z)
    );
}

// rotate around Z‑axis by θ: X→Y plane
mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    // columns:      X            Y       Z
    return mat3(
        vec3(c, s, 0.0), // X → (c·X + s·Y)
        vec3(-s, c, 0.0), // Y → (–s·X + c·Y)
        vec3(0.0, 0.0, 1.0) // Z stays the same
    );
}

mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

mat3 rotateAxis(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(
        oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
    );
}
