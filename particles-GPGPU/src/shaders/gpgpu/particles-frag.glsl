void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    particle.g += 0.01;
    gl_FragColor = particle;
}