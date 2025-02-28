uniform float uTime;
uniform float uRandomFloat;
uniform vec2 uResolution;
varying vec2 vUv;

#include "./helpers/utils.glsl";
const float DAY_LENGTH = 60.0;

// Background Colors
const vec3 MORNING_COLOR1 = vec3(1.0, 0.89, 0.79);
const vec3 MORNING_COLOR2 = vec3(1.0, 0.77, 0.59);
const vec3 MIDDAY_COLOR1 = vec3(0.64, 0.93, 1.0);
const vec3 MIDDAY_COLOR2 = vec3(0.3, 0.66, 1.0);
const vec3 EVENING_COLOR1 = vec3(1.0, 0.6, 0.48);
const vec3 EVENING_COLOR2 = vec3(1.0, 0.39, 0.18);
const vec3 NIGHT_COLOR1 = vec3(0.0, 0.2118, 0.3529);
const vec3 NIGHT_COLOR2 = vec3(0.0, 0.0471, 0.2118);

// Color Multipliers (for clouds and water)
const vec3 MORNING_COLOR_MULTIPLIER = vec3(1.0, 0.94, 0.83);
const vec3 MIDDAY_COLOR_MULTIPLIER_WATER = vec3(0.55, 0.79, 1.0);
const vec3 MIDDAY_COLOR_MULTIPLIER_CLOUD = vec3(0.72, 0.88, 1.0);
const vec3 EVENING_COLOR_MULTIPLIER_WATER = vec3(1.0, 0.52, 0.79);
const vec3 EVENING_COLOR_MULTIPLIER_CLOUD = vec3(1.0, 0.77, 0.76);
const vec3 NIGHT_COLOR_MULTIPLIER_WATER = vec3(0.4);
const vec3 NIGHT_COLOR_MULTIPLIER_CLOUD = vec3(0.68);

// Cloud parameters
const vec3 CLOUD_COLOR = vec3(1.0);
const vec3 CLOUD_SHADOW_COLOR = vec3(0.0);
const float NUM_CLOUDS = 15.0;

// Water Colors
const vec3 WATER_COLOR1 = vec3(0.48, 0.83, 1.0);
const vec3 WATER_COLOR2 = vec3(0.3, 0.71, 1.0);
const vec3 WATER_COLOR3 = vec3(0.17, 0.55, 0.85);
const vec3 WATER_COLOR4 = vec3(0.0, 0.45, 0.91);
const vec3 WATER_COLOR5 = vec3(0.0, 0.37, 0.75);
const vec3 WATER_SHADOW_COLOR = vec3(0.0, 0.13, 0.25);
const float waterShadowIntensity = 0.15;

// Sun colors
const vec3 MORNING_COLOR_MULTIPLIER_SUN = vec3(1.0, 0.66, 0.15);
const vec3 MIDDAY_COLOR_MULTIPLIER_SUN = vec3(1.0, 0.78, 0.11);
const vec3 EVENING_COLOR_MULTIPLIER_SUN = vec3(1.0, 0.36, 0.36);
const vec3 NIGHT_COLOR_MULTIPLIER_SUN = vec3(1.0, 0.33, 0.18);
const vec3 SUN_COLOR = vec3(1.0, 0.97, 0.86);

// Moon colors
const vec3 MOON_COLOR = vec3(0.96, 1.0, 1.0);
const vec3 MOON_COLOR_MULTIPLIER = vec3(1.0, 1.0, 0.98);

// Moon colors
const vec3 STAR_COLOR = vec3(0.984, 0.733, 0.078);
const float NUM_STARS = 15.0;

// Mountain colors
const vec3 MORNING_COLOR_MULTIPLIER_MOUNTAIN = vec3(1.0, 0.94, 0.85);
const vec3 MIDDAY_COLOR_MULTIPLIER_MOUNTAIN = vec3(1.0, 0.78, 0.11);
const vec3 EVENING_COLOR_MULTIPLIER_MOUNTAIN = vec3(1.0, 0.68, 0.68);
const vec3 NIGHT_COLOR_MULTIPLIER_MOUNTAIN = vec3(0.32, 0.35, 0.38);
const vec3 MOUNTAIN1_COLOR = vec3(0.5, 0.4, 0.3);
const vec3 MOUNTAIN2_COLOR = vec3(0.6, 0.5, 0.4);
const vec3 MOUNTAIN3_COLOR = vec3(0.36, 0.3, 0.18);
const vec3 MOUNTAIN_COLORS[3] = vec3[3](MOUNTAIN1_COLOR, MOUNTAIN2_COLOR, MOUNTAIN3_COLOR);
const float MOUNTAIN_BASE_LEVEL = -1.5;
const vec2 MOUNTAIN_OFFSETS[3] = vec2[3](
        vec2(-0.15, 0.0),
        vec2(0.15, 0.0),
        vec2(0.0, 0.0)
    );
const float MOUNTAIN_HEIGHTS[3] = float[3](1.0, 0.3, 1.9);
const vec2 MOUNTAIN_LR[3] = vec2[3](
        vec2(-1.5, 1.5),
        vec2(-2.0, 2.0),
        vec2(-2.0, 2.0)
    );

//--------------------------------------
// Helper Functions
//--------------------------------------

// Returns a color that cycles through the four provided colors
// over the full day (DAY_LENGTH). Use for both background and multipliers.
vec3 getDayCycleColor(vec3 cMorning, vec3 cMidday, vec3 cEvening, vec3 cNight, float dayTime) {
    if (dayTime < DAY_LENGTH * 0.2)
        return mix(cMorning, cMidday, smoothstep(0.0, DAY_LENGTH * 0.2, dayTime));
    else if (dayTime < DAY_LENGTH * 0.4)
        return mix(cMidday, cEvening, smoothstep(DAY_LENGTH * 0.2, DAY_LENGTH * 0.4, dayTime));
    else if (dayTime < DAY_LENGTH * 0.6)
        return mix(cEvening, cNight, smoothstep(DAY_LENGTH * 0.4, DAY_LENGTH * 0.6, dayTime));
    else
        return mix(cNight, cMorning, smoothstep(DAY_LENGTH * 0.8, DAY_LENGTH, dayTime));
}

//--------------------------------------
// SDF Functions
//--------------------------------------
float sdfCloud(vec2 pixelCords) {
    float puff1 = sdfEllipse(pixelCords, vec2(1.0, 0.75));
    float puff2 = sdfEllipse(pixelCords - vec2(0.65, -1.0), vec2(0.9, 0.7));
    float puff3 = sdfEllipse(pixelCords + vec2(0.9, 1.0), vec2(1.0, 0.75));
    float puff4 = sdfEllipse(pixelCords - vec2(1.5, -1.35), vec2(0.6, 0.4));
    return min(puff1, min(puff2, min(puff3, puff4)));
}

float sdfMoon(vec2 pixelCords) {
    float d = opSubtraction(
            sdfCircle(pixelCords + vec2(0.55, 0.0), 0.8),
            sdfCircle(pixelCords, 0.7)
        );

    return d;
}

float sdfStar5(in vec2 p, in float r, in float rf)
{
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x, k1.y);
    p.x = abs(p.x);
    p -= 2.0 * max(dot(k1, p), 0.0) * k1;
    p -= 2.0 * max(dot(k2, p), 0.0) * k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
    float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
    return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

float sdfTriangle(in vec2 p, in vec2 a, in vec2 b, in vec2 c) {
    vec2 ba = b - a;
    vec2 pa = p - a;
    vec2 cb = c - b;
    vec2 pb = p - b;
    vec2 ac = a - c;
    vec2 pc = p - c;

    float d1 = length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
    float d2 = length(pb - cb * clamp(dot(pb, cb) / dot(cb, cb), 0.0, 1.0));
    float d3 = length(pc - ac * clamp(dot(pc, ac) / dot(ac, ac), 0.0, 1.0));
    float d = min(min(d1, d2), d3);

    vec3 bary;
    bary.x = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) /
            ((b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y));
    bary.y = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) /
            ((b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y));
    bary.z = 1.0 - bary.x - bary.y;
    if (bary.x > 0.0 && bary.y > 0.0 && bary.z > 0.0)
        d = -d;
    return d;
}

//--------------------------------------
// Scene Drawing Functions
//--------------------------------------

// Draws the background by blending four day-cycle colors.
vec3 drawBackground(float dayTime) {
    float mixStrength = smoothstep(0.0, 1.0, pow(vUv.x * vUv.y, 0.7));
    vec3 morning = mix(MORNING_COLOR1, MORNING_COLOR2, mixStrength);
    vec3 midday = mix(MIDDAY_COLOR1, MIDDAY_COLOR2, mixStrength);
    vec3 evening = mix(EVENING_COLOR1, EVENING_COLOR2, mixStrength);
    vec3 night = mix(NIGHT_COLOR1, NIGHT_COLOR2, mixStrength);
    return getDayCycleColor(morning, midday, evening, night, dayTime);
}

vec3 drawClouds(vec2 centeredUVs, vec3 col, float dayTime, float start, float end) {
    vec3 color = col;
    vec3 cloudMultiplier = getDayCycleColor(MORNING_COLOR_MULTIPLIER, MIDDAY_COLOR_MULTIPLIER_CLOUD, EVENING_COLOR_MULTIPLIER_CLOUD, NIGHT_COLOR_MULTIPLIER_CLOUD, dayTime);

    for (float i = start; i < end; i += 1.0) {
        float cloudSize = mix(2.0, 1.0, (i / NUM_CLOUDS) + 0.1 * hash(vec2(i))) * 1.6;
        float cloudSpeedHash = remap(hash(vec2(i * cloudSize + uRandomFloat)), -1.0, 1.0, 0.8, 1.0);
        float cloudSpeed = cloudSize * cloudSpeedHash * 0.12;
        float cloudRandomOffsetY = (7.0 * hash(vec2(i))) - 8.0;

        vec2 cloudOffset = vec2(i * (uRandomFloat + 2.0) + uTime * cloudSpeed, cloudRandomOffsetY);
        vec2 cloudPosition = centeredUVs + cloudOffset;
        cloudPosition.x = mod(cloudPosition.x, uResolution.x / 100.0);
        cloudPosition -= vec2(uResolution / 100.0) * 0.5;

        float cloudShadow = sdfCloud(cloudPosition * cloudSize + 0.4) + 0.6;
        float cloudSDF = sdfCloud(cloudPosition * cloudSize);
        float shadowIntensity = 0.2;

        color = mix(mix(color, CLOUD_SHADOW_COLOR, shadowIntensity), color, smoothstep(0.0, 0.9, cloudShadow));
        float randomColorHash = remap(hash(vec2(i)), -1.0, 1.0, 0.5, 1.0);
        vec3 randomFactor = mix(vec3(0.75), vec3(1.1), vec3(randomColorHash));
        color = mix(CLOUD_COLOR * cloudMultiplier * randomFactor, color, smoothstep(0.0, 0.0075, cloudSDF));
    }
    return color;
}

vec3 drawWater(vec2 centeredUVs, vec3 col, float dayTime) {
    vec3 color = col;
    vec2 waveBase = centeredUVs;

    float perspectiveFactor = mix(1.0, 0.5, vUv.y);

    float r1 = 0.7 + 0.7 * hash(vec2(1.0, 2.0));
    float r2 = 0.8 + 0.6 * hash(vec2(3.0, 4.0));
    float r3 = 0.9 + 0.4 * hash(vec2(5.0, 6.0));
    float r4 = 1.3 + 0.3 * hash(vec2(7.0, 8.0));
    float r5 = 0.9 + 0.8 * hash(vec2(9.0, 10.0));

    vec2 offset1 = vec2(sin(uTime * 0.5) * 0.7, cos(uTime * 0.3) * 0.19) * r1 * perspectiveFactor;
    vec2 offset2 = vec2(sin(uTime * 0.7 + 0.5) * 0.2, cos(uTime * 0.6) * 0.12) * r2 * perspectiveFactor;
    vec2 offset3 = vec2(sin(uTime * 0.8 + 1.0) * 0.5, cos(uTime * 0.4 + 1.0) * 0.15) * r3 * perspectiveFactor;
    vec2 offset4 = vec2(sin(uTime * 0.7 + 2.0) * 0.3, cos(uTime * 0.5 + 2.0) * 0.175) * r4 * perspectiveFactor;
    vec2 offset5 = vec2(sin(uTime * 1.2 + 3.0) * 0.3, cos(uTime * 0.6 + 3.0) * 0.20) * r5 * perspectiveFactor;

    float r0 = 0.19 * perspectiveFactor;
    float r1_adj = 0.12 * perspectiveFactor;
    float r2_adj = 0.178 * perspectiveFactor;

    float waveSDF = sdfCircleWave(waveBase + vec2(0.0, 0.5) + offset1, r0, 3.0, 0.9);
    float waveShadowSDF = sdfCircleWave(waveBase + vec2(0.0, 0.6) + offset1, r0, 3.0, 0.9);
    float waveSDF2 = sdfCircleWave(waveBase + vec2(0.0, 1.2) + offset2, r1_adj, 3.0, 0.9);
    float waveShadowSDF2 = sdfCircleWave(waveBase + vec2(0.0, 1.3) + offset2, r1_adj, 3.0, 0.9);
    float waveSDF3 = sdfCircleWave(waveBase + vec2(0.9, 1.7) + offset3, 0.1, 3.0, 0.9);
    float waveShadowSDF3 = sdfCircleWave(waveBase + vec2(0.9, 1.8) + offset3, 0.1, 3.0, 0.9);
    float waveSDF4 = sdfCircleWave(waveBase + vec2(-0.9, 2.41) + offset4, r2_adj, 3.0, 0.9);
    float waveShadowSDF4 = sdfCircleWave(waveBase + vec2(-0.9, 2.51) + offset4, r2_adj, 3.0, 0.9);
    float waveSDF5 = sdfCircleWave(waveBase + vec2(0.0, 3.0) + offset5, 0.156, 3.0, 0.9);
    float waveShadowSDF5 = sdfCircleWave(waveBase + vec2(0.0, 3.1) + offset5, 0.156, 3.0, 0.9);

    vec3 waterMultiplier = getDayCycleColor(MORNING_COLOR_MULTIPLIER, MIDDAY_COLOR_MULTIPLIER_WATER, EVENING_COLOR_MULTIPLIER_WATER, NIGHT_COLOR_MULTIPLIER_WATER, dayTime);

    color = mix(mix(color, WATER_SHADOW_COLOR, waterShadowIntensity), color, smoothstep(0.0, 0.2, waveShadowSDF));
    color = mix(WATER_COLOR1 * waterMultiplier, color, smoothstep(0.0, 0.0075, waveSDF));

    color = mix(mix(color, WATER_SHADOW_COLOR, waterShadowIntensity), color, smoothstep(0.0, 0.2, waveShadowSDF2));
    color = mix(WATER_COLOR2 * waterMultiplier, color, smoothstep(0.0, 0.0075, waveSDF2));

    color = mix(mix(color, WATER_SHADOW_COLOR, waterShadowIntensity), color, smoothstep(0.0, 0.2, waveShadowSDF3));
    color = mix(WATER_COLOR3 * waterMultiplier, color, smoothstep(0.0, 0.0075, waveSDF3));

    color = mix(mix(color, WATER_SHADOW_COLOR, waterShadowIntensity), color, smoothstep(0.0, 0.2, waveShadowSDF4));
    color = mix(WATER_COLOR4 * waterMultiplier, color, smoothstep(0.0, 0.0075, waveSDF4));

    color = mix(mix(color, WATER_SHADOW_COLOR, waterShadowIntensity), color, smoothstep(0.0, 0.2, waveShadowSDF5));
    color = mix(WATER_COLOR5 * waterMultiplier, color, smoothstep(0.0, 0.0075, waveSDF5));

    return color;
}

vec3 drawSun(vec2 centeredUVs, vec3 col, float dayTime) {
    vec3 color = col;
    vec3 sunColorMultiplier = getDayCycleColor(
            MORNING_COLOR_MULTIPLIER_SUN,
            MIDDAY_COLOR_MULTIPLIER_SUN,
            EVENING_COLOR_MULTIPLIER_SUN,
            NIGHT_COLOR_MULTIPLIER_SUN,
            dayTime
        );

    // Only draw the sun if dayTime is less
    if (dayTime < DAY_LENGTH * 0.6) {
        vec2 sunOffset;
        // Sunrise: 0.0 -> 0.2 of the day: interpolate from -4.0 to 2.5 (y axis)
        if (dayTime < DAY_LENGTH * 0.2) {
            float t = saturate(inverseLerp(dayTime, 0.0, DAY_LENGTH * 0.2));
            sunOffset = vec2(0.0, mix(-4.0, 0.2, t));
        }
        // Midday: 0.2 -> 0.4 of the day: sun stays at peak.
        else if (dayTime < DAY_LENGTH * 0.4) {
            sunOffset = vec2(0.0, 0.2);
        }
        // Sunset: 0.4 -> 0.6 of the day: interpolate from 0.2 down to -4.0.
        else {
            float t = saturate(inverseLerp(dayTime, DAY_LENGTH * 0.4, DAY_LENGTH * 0.6));
            sunOffset = vec2(0.0, mix(0.2, -4.0, t));
        }

        vec2 baseOffset = vec2(-5.0, 2.5);
        sunOffset += baseOffset;

        vec2 sunPos = centeredUVs - (0.5 * uResolution / 100.0) - sunOffset;
        float sunSDF = sdfCircle(sunPos, 0.8);
        color = mix(SUN_COLOR * sunColorMultiplier, color, smoothstep(0.0, 0.0075, sunSDF));

        float pulse = remap(sin(uTime * 2.0), -1.0, 1.0, 0.3, 1.0);
        float glowFactor = 1.0 - smoothstep(0.1, 0.8, sunSDF);
        color += SUN_COLOR * sunColorMultiplier * glowFactor * 0.125 * pulse;
    }
    return color;
}

vec3 drawMoon(vec2 centeredUVs, vec3 col, float dayTime) {
    vec3 color = col;
    vec2 moonOffset = vec2(0.0);

    if (dayTime >= DAY_LENGTH * 0.55 && dayTime < DAY_LENGTH * 0.65) {
        float t = saturate(inverseLerp(dayTime, DAY_LENGTH * 0.55, DAY_LENGTH * 0.65));
        moonOffset.y = mix(-4.0, 0.2, t);
    } else if (dayTime >= DAY_LENGTH * 0.65 && dayTime < DAY_LENGTH * 0.8) {
        moonOffset = vec2(0.0, 0.2);
    } else if (dayTime >= DAY_LENGTH * 0.8 && dayTime < DAY_LENGTH * 0.95) {
        float t = saturate(inverseLerp(dayTime, DAY_LENGTH * 0.8, DAY_LENGTH * 0.95));
        moonOffset.y = mix(0.2, -4.0, t);
    } else {
        return color;
    }

    vec2 baseOffset = vec2(5.0, 2.5);
    moonOffset += baseOffset;

    vec2 moonPos = centeredUVs - (0.5 * uResolution / 100.0) - moonOffset;
    moonPos = rotate2d(3.142 * -0.25) * moonPos;

    float moonSDF = sdfMoon(moonPos);
    color = mix(MOON_COLOR * MOON_COLOR_MULTIPLIER, color, smoothstep(0.0, 0.0075, moonSDF));

    float pulse = remap(sin(uTime * 2.0), -1.0, 1.0, 0.3, 1.0);
    float moonGlow = sdfMoon(moonPos);
    color += mix(vec3(1.0), vec3(0.0), smoothstep(-0.1, 0.12, moonSDF)) * pulse * 0.25;
    return color;
}

vec3 drawStars(vec2 centeredUVs, vec3 col, float dayTime) {
    vec3 color = col;

    for (float i = 0.0; i < NUM_STARS; i += 1.0) {
        float hashSample = hash(vec2(i * 270.0 * uRandomFloat)) * 0.5 + 0.2;

        float fade = 1.0;
        if (dayTime < DAY_LENGTH * 0.55) {
            fade = 1.0;
        } else if (dayTime < DAY_LENGTH * 0.65) {
            // Fade from 1 to 0 (stars appear)
            fade = 1.0 - inverseLerp(dayTime, DAY_LENGTH * 0.55, DAY_LENGTH * 0.65);
        } else if (dayTime < DAY_LENGTH * 0.85) {
            float twinkle = 0.05 * (sin(uTime * 20.0) + 1.0);
            fade = clamp(twinkle, 0.0, 0.1);
        } else {
            fade = saturate(inverseLerp(dayTime - hashSample * 0.25, DAY_LENGTH * 0.85, DAY_LENGTH * 0.95));
        }
        float starSize = mix(2.0, 1.0, hashSample);

        vec2 starOffset = vec2(i * 1.2, 1.5) + 1.1 * hash(vec2(i + uRandomFloat));
        vec2 starPosition = centeredUVs - (0.5 * uResolution / 100.0) - starOffset;

        float starRotationAngle = mix(-3.142, 3.142, hashSample);

        starPosition.x = mod(starPosition.x, uResolution.x / 100.0);
        starPosition = starPosition - vec2(0.5, 0.75);
        starPosition = rotate2d(starRotationAngle) * starPosition;
        starPosition *= starSize;

        float starSDF = sdfStar5(starPosition, 0.10, 2.0);

        vec3 starColor = mix(STAR_COLOR, color, smoothstep(0.0, 0.0075, starSDF));
        starColor += mix(0.2, 0.0, pow(smoothstep(-0.5, 0.5, starSDF), 0.5));

        color = mix(starColor, color, fade);
    }
    return color;
}

vec3 drawMountains(vec2 centeredUVs, vec3 col, float dayTime) {
    vec3 color = col;
    float baseLevel = -1.5;

    for (int i = 0; i < 3; i++) {
        float height = 2.2 + MOUNTAIN_HEIGHTS[i];
        vec2 baseOffset = MOUNTAIN_OFFSETS[i] * (uResolution / 100.0);

        vec3 cloudMultiplier = getDayCycleColor(
                MORNING_COLOR_MULTIPLIER_MOUNTAIN,
                MIDDAY_COLOR_MULTIPLIER_MOUNTAIN,
                EVENING_COLOR_MULTIPLIER_MOUNTAIN,
                NIGHT_COLOR_MULTIPLIER_MOUNTAIN,
                dayTime
            );

        vec2 apex = vec2(0.0, baseLevel + height);
        vec2 left = vec2(-1.0 + MOUNTAIN_LR[i].x, baseLevel);
        vec2 right = vec2(1.0 + MOUNTAIN_LR[i].y, baseLevel);

        vec2 mountainPos = centeredUVs - (0.5 * uResolution / 100.0) - baseOffset;
        float sdfTriangleSDF = sdfTriangle(mountainPos, apex, left, right);

        float mountainShadow = sdfTriangle(mountainPos - 0.05, apex, left, right) * 12.0;
        float shadowIntensity = 0.075;

        color = mix(mix(color, vec3(0.0), shadowIntensity), color, smoothstep(0.0, 10.0, mountainShadow));
        color = mix(MOUNTAIN_COLORS[i] * cloudMultiplier, color, smoothstep(0.0, 0.0075, sdfTriangleSDF));
    }

    return color;
}

//--------------------------------------
// Main
//--------------------------------------
void main() {
    float dayTime = mod(uTime, DAY_LENGTH);
    vec2 centeredUVs = (vUv * uResolution / 100.0);

    vec3 color = drawBackground(dayTime);

    color = drawStars(centeredUVs, color, dayTime);
    color = drawSun(centeredUVs, color, dayTime);
    color = drawMoon(centeredUVs, color, dayTime);
    color = drawClouds(centeredUVs, color, dayTime, 0.0, 7.0);
    color = drawMountains(centeredUVs, color, dayTime);
    color = drawClouds(centeredUVs, color, dayTime, 8.0, NUM_CLOUDS);
    color = drawWater(centeredUVs, color, dayTime);

    gl_FragColor = vec4(color, 1.0);
}
