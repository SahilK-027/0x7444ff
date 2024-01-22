import fragShaderCode from "./shaders/fragment";
import vertexShaderCode from "./shaders/vertex";
import "./style.css";

// Wait for the DOM content to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", function () {
  // Get the canvas element and the WebGL rendering context
  const canvas = document.getElementById("shaderCanvas");
  const gl = canvas.getContext("webgl");

  // Check if WebGL is supported by the browser
  if (!gl) {
    console.error(
      "Unable to initialize WebGL. Your browser may not support it."
    );
    return;
  }

  // Shader source code for the fragment and vertex shaders
  const fragmentShaderSource = fragShaderCode;
  const vertexShaderSource = vertexShaderCode;

  // Create the fragment and vertex shaders
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

  // Create the shader program and use it
  const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(shaderProgram);

  // Get the attribute location for the position attribute in the shaders
  const positionAttributeLocation = gl.getAttribLocation(
    shaderProgram,
    "a_position"
  );

  // Create a buffer to hold the vertex data
  const positionBuffer = gl.createBuffer();

  // Bind the buffer and put position data into it
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = new Float32Array([
    -1.0,
    -1.0, // Bottom left
    1.0,
    -1.0, // Bottom right
    -1.0,
    1.0, // Top left
    1.0,
    1.0, // Top right
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // Set up the position attribute
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Render function that is called recursively using requestAnimationFrame
  function render() {
    // Set the canvas size to match the window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the quad using triangle strip
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Request the next animation frame
    requestAnimationFrame(render);
  }

  // Start the render loop
  render();
});

/**
 *
 */
/**
 * Creates a shader of the specified type.
 *
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {number} type - The type of the shader, either `WebGLRenderingContext.VERTEX_SHADER` or `WebGLRenderingContext.FRAGMENT_SHADER`.
 * @param {string} source - The source code of the shader.
 * @returns {WebGLShader} The created shader, or `null` if the creation failed.
 */
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Creates a shader program from the specified vertex and fragment shaders.
 *
 * @param {WebGLRenderingContext} gl - The WebGL rendering context.
 * @param {WebGLShader} vertexShader - The vertex shader.
 * @param {WebGLShader} fragmentShader - The fragment shader.
 * @returns {WebGLProgram} The created shader program, or `null` if the creation failed.
 */
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking failed:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
