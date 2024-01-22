const vertexShaderCode = `
    attribute vec4 a_position;
    attribute vec2 a_uv;  // New attribute for UV coordinates
    varying vec2 v_uv;    // Varying variable to pass UV coordinates to fragment shader

    void main() {
        gl_Position = a_position;
        v_uv = a_uv;        // Pass UV coordinates to fragment shader
    }
`;

export default vertexShaderCode;
