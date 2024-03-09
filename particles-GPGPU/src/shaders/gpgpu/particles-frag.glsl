#include ../includes/simplexNoise4d.glsl

uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;
uniform float Influence;
uniform float Strength;
uniform float Frequency;

void main() {
    float time = uTime * 0.2;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    vec4 base = texture(uBase, uv);

    // Dead particle respawn
    if(particle.a >= 1.0) {
        particle.a = mod(particle.a, 1.0);
        particle.xyz = base.xyz;
    }
    // Alive particle
    else {
        // flow field strength
        float strength = simplexNoise4d(vec4(base.xyz * 0.2, time + 1.0));
        float influence = (Influence - 0.5) * (-2.0);
        strength = smoothstep(influence, 1.0, strength);

        // flow field
        vec3 flowField = vec3(
            simplexNoise4d(vec4(particle.xyz * Frequency + 0.0, time)), 
            simplexNoise4d(vec4(particle.xyz * Frequency + 1.0, time)), 
            simplexNoise4d(vec4(particle.xyz * Frequency + 2.0, time))
        );
        flowField = normalize(flowField);
        particle.xyz += flowField * uDeltaTime * strength * Strength;

        // Decay Particle Alpha life
        particle.a += uDeltaTime * 0.3;
    }
    gl_FragColor = particle;
}