const fragShaderCode = `
    precision mediump float;
    varying vec2 v_uv; // Varying variable to receive UV coordinates
    uniform vec2 uResolution; // Canvas resolution (width, height)
    uniform float uTime; // Time uniform

    // Function to generate color gradient
    vec3 gradient(float distance){
        vec3 a = vec3(0.5, 0.5, 0.7);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.25, 0.4, 0.5);

        return a + b * cos(6.28318 * (c * distance + d));
    }

    void main() {
        // Shift of origin
        vec2 shifted_uv = v_uv - 0.5;
        vec2 fixed_uv = shifted_uv * 2.0;
        vec2 uv_0 = fixed_uv;
        vec3 final_color = vec3(0.0);

        for(float i = 0.0; i < 2.7; i++){

            // Scale
            fixed_uv *= 1.5;
            
            // Mirror repitition
            fixed_uv = fract(fixed_uv);
    
            // Center
            fixed_uv -= 0.5;
    
            // To keep the effect circular no matter what the current canvas resolution is we need to normalize i  based on current canvas width and height
            fixed_uv.x *= uResolution.x / uResolution.y;
    
            // Get the distance from the origin
            float d = length(fixed_uv) *exp(-length(uv_0));
    
            // Colours
            vec3 colour = gradient(length(uv_0) + i * 0.4 + uTime * 0.4);
    
            // Sin radius of the circle to get concentric circles
            d = sin(d * 8.0 + uTime)/8.0;
    
            // In the context of distance functions, taking the absolute value ensures that the distance is non-negative. This is useful because distances in signed distance functions can be negative inside the object (indicating that a point is inside the shape).
            d = abs(d);
    
            // We will take inverse of d to get neon effect for colours
            d = pow(0.007/d, 1.3);
    
            final_color += colour * d;
        }


        gl_FragColor = vec4(final_color, 1.0);
    }
`;

export default fragShaderCode;

/** ============================================================================
 * ? What are these UV coordinates
============================================================================ */
/**
UV coordinates are a standard way to represent texture coordinates in computer graphics, including WebGL and OpenGL. The term "UV" stands for the two coordinates used to map a texture onto a 3D surface: U and V. These coordinates are often used in shaders to determine which part of a texture should be applied to a particular point on a 3D model.

* * U Coordinate: Represents the horizontal position on the texture. A U coordinate of 0 corresponds to the left edge of the texture, and a U coordinate of 1 corresponds to the right edge.

* * V Coordinate: Represents the vertical position on the texture. A V coordinate of 0 corresponds to the bottom edge of the texture, and a V coordinate of 1 corresponds to the top edge.

In the context of shaders and graphics programming:

(0, 0): Bottom-left corner of the texture.
(1, 0): Bottom-right corner of the texture.
(0, 1): Top-left corner of the texture.
(1, 1): Top-right corner of the texture.
(0.5, 0.5): Center of the texture.


* ? Understanding in terms of shaders fragcolor
* * 1) When we write gl_FragColor = vec4(v_uv.x, 0.0, 0.0, 1.0);
 In this case x channel of color will range from 0 to 1 so we will get horizontal black to red tint ad a color

* * 2) When we write gl_FragColor = vec4(0.1, v_uv.y, 0.0, 1.0);
 In this case y channel of color will range from 0 to 1 so we will get vertical black to green tint ad a color

* * 3) Now if we want to get mixer of green and red we can simply write 
* * gl_FragColor = vec4(v_uv.x, v_uv.y, 0.0, 1.0);
// The same can also be written as 
gl_FragColor = vec4(v_uv, 0.0, 1.0);
*/

/** ============================================================================
 * ? Code explaination: Shift of origin
============================================================================ */
/*
(0, 0): Bottom-left corner of the texture.
(1, 0): Bottom-right corner of the texture.
(0, 1): Top-left corner of the texture.
(1, 1): Top-right corner of the texture.
(0.5, 0.5): Center of the texture.
let's shift the Center to (0,0)
SOLN: vec2 shifted_uv = v_uv - vec2(0.5);

After the texture has been shifted to (0,0)
(-0.5, -0.5): Bottom-left corner of the texture.
(0.5, -0.5): Bottom-right corner of the texture.
(-0.5, 0.5): Top-left corner of the texture.
(0.5, 0.5): Top-right corner of the texture.
(0.5, 0.5): Center of the texture.
Let's fix it by multiplying our uv by 2 to make sure they fit between clispace after shift of origin
SOLN: vec2 fixed_uv = shifted_uv * 2.0;

* * Explain smoothstep function
smoothstep(0.0, 0.1, d):
The smoothstep function is a smooth interpolation function that takes three parameters: smoothstep(edge0, edge1, x). It returns 0.0 if x is less than or equal to edge0 and 1.0 if x is greater than or equal to edge1. Between the edges, it smoothly interpolates between 0.0 and 1.0.


* * Signed distance function
To set Radius of the circle to 0.5, also known as Signed distance function
d -= 0.5; 

Sin radius of the circle to get concentric circles
d = sin(d * 8.0 + uTime)/8.0;
*/
