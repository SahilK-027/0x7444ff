uniform vec2 uResolution;
uniform float uTime;
uniform vec4 uGrassParams;
uniform float uWindStrength;
uniform vec2 uWindDir;

varying vec4 vGrassData;
varying float vHeightPercentage;
varying vec2 vUv;
varying vec2 vMapUv;
varying vec3 vDebugColor;

const float PI = 3.14159265359;

#include utils;
#include hashFunctions;
#include rotation;
#include bezier;
#include noise;

void main() {
    int GRASS_SEGMENTS = int(uGrassParams.x);
    int GRASS_VERTICES = (GRASS_SEGMENTS + 1) * 2;
    float GRASS_PATCH_SIZE = uGrassParams.y;
    float GRASS_WIDTH = uGrassParams.z;
    float GRASS_HEIGHT = uGrassParams.w;

    /* ===== Grass blade offset =====*/
    vec2 hashedInstanceID = hash21(float(gl_InstanceID)) * 2.0 - 1.0;
    vec3 grassOffset = vec3(hashedInstanceID.x, 0.0, hashedInstanceID.y) * GRASS_PATCH_SIZE;

    /* ===== Randomized rotation to grass blades =====*/
    vec3 grassBladeWorldPos = (modelMatrix * vec4(grassOffset, 1.0)).xyz;
    vec3 hashVal = hash(grassBladeWorldPos);
    float angle = remap(hashVal.x, -1.0, 1.0, -PI, PI);

    // ! DEBUG
    // grassOffset = vec3(0.0, 0.0, float(gl_InstanceID) * 0.4 - 10.0);
    // angle = float(gl_InstanceID) * 0.2;

    /* ===== Figuring out Vertex IDs =====*/
    int verFB_ID = gl_VertexID % (GRASS_VERTICES * 2);
    int verID = verFB_ID % GRASS_VERTICES;

    int xTest = verID & 0x1; // Determine left vs. right side of the blade: xTest = 0 means left; xTest = 1 means right.
    // zTest picks which face of the blade we’re on:
    // if verFB_ID ≥ GRASS_VERTICES, we’re on the “back” face (zTest = +1)
    // otherwise the “front” face (zTest = –1).
    int zTest = (verFB_ID >= GRASS_VERTICES) ? 1 : -1; // Determine front vs. back side of the blade: zTest = 1 means front; zTest = 0 means back.
    float xSide = float(xTest);
    float zSide = float(zTest);
    float heighPercent = float(verID - xTest) / (float(GRASS_SEGMENTS) * 2.0);
    float width = GRASS_WIDTH * easeOut(1.0 - heighPercent, 2.0);
    float height = GRASS_HEIGHT;

    /* ===== Compute the actual vertex position in blade-local space ===== */
    float x = (xSide - 0.5) * width; // x: move left or right around the center, width-wide
    float y = heighPercent * height; // y: up the blade a proportion of its total height
    float z = 0.0; // z: we keep the blade flat, so zero

    /* ===== Bend the grass based on bezier curve =====*/
    vec2 flowOffset = uWindDir * (uTime * uWindStrength);
    float noiseSample = cnoise(
            vec3(
                grassBladeWorldPos.xz * 1.5 + flowOffset,
                uTime * 0.2
            )
        );
    float windStrengthMultiplier = noiseSample * uWindStrength;
    vec3 windAxis = normalize(vec3(uWindDir.x, 0.0, uWindDir.y));
    float windLeanAngle = windStrengthMultiplier * 1.5 * heighPercent;

    float randomLeanAnimation = cnoise(vec3(grassBladeWorldPos.xz * 10.0, uTime)) * (windStrengthMultiplier);
    float leanFactor = remap(hashVal.y, -1.0, 1.0, -0.25, 0.25) + randomLeanAnimation;
    // leanFactor = 1.0; // ! DEBUG
    vec3 p1 = vec3(0.0); // base of grass
    vec3 p2 = vec3(0.0, 0.33, 0.0); // 1/3rd way up
    vec3 p3 = vec3(0.0, 0.66, 0.0); // 1/3rd way up
    vec3 p4 = vec3(0.0, cos(leanFactor), sin(leanFactor));
    vec3 curve = bezier(p1, p2, p3, p4, heighPercent);

    /* ===== Correcting normals =====*/
    // After bending and rotating grass we have messed up with it's normals
    // 2D curves → you can rotate the tangent by ±90° to get Normals.
    // vec2 T = normalize( dFdx(pos) );
    // vec2 N = vec2( -T.y, T.x );        // rotate T by +90°

    // For 3D geometry N = normalize( cross( Tangent, Bi-tangent ) );
    vec3 curveGrad = bezierGrad(p1, p2, p3, p4, heighPercent);
    mat2 curveRot90 = mat2(0.0, 1.0, -1.0, 0.0) * -zSide;

    y = curve.y * height;
    z = curve.z * height;

    /* ===== Generate grass matrix after randomized rotation along Y-Axis ===== */
    mat3 grassMat = rotateAxis(windAxis, windLeanAngle) * rotateY(angle); // !DEBUG
    // mat3 grassMat = rotateY(angle);
    // Pack into a vec3
    vec3 grassLocalPosition = grassMat * vec3(x, y, z) + grassOffset;
    vec3 grassLocalNormal = grassMat * vec3(0.0, curveRot90 * curveGrad.yz);

    /* ===== Making grass blade appear thicker ===== */
    vec4 mvPosition = modelViewMatrix * vec4(grassLocalPosition, 1.0);

    vec3 viewDir = normalize(cameraPosition - grassBladeWorldPos);
    vec3 grassFaceNormal = (grassMat * vec3(0.0, 0.0, -zSide));

    float viewDotNormal = saturate(dot(grassFaceNormal, viewDir));
    float viewSpaceThickenFactor = easeOut(
            1.0 - viewDotNormal, 4.0) * smoothstep(0.0, 0.2, viewDotNormal);

    mvPosition.x += viewSpaceThickenFactor * (xSide - 0.5) * width * 0.5 * -zSide;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(grassLocalPosition, 1.0);

    // All varyings
    vGrassData = vec4(x, 0.0, 0.0, 0.0);
    vHeightPercentage = heighPercent;
    // compute a UV over the entire patch, based on each blade’s XZ offset:
    // grassOffset.xz runs from roughly -patchSize/2 → +patchSize/2
    // so we remap that to [0,1]
    vMapUv = (grassOffset.xz / GRASS_PATCH_SIZE) + 0.5;
    vUv = vec2(xSide, heighPercent);

    vDebugColor = vec3(windLeanAngle); // Color used for visualizing stuff from vertex shader
}
