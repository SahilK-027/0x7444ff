# How to bake texture to vertex colors

ref: https://blender.stackexchange.com/questions/271985/how-to-bake-texture-to-vertex-colors

## To bake a texture to vertex colors in Blender:
1. Import Mesh:
    - Create a new Blender project.
    - Import your mesh into the scene, for example, in .obj format.

2. Assign Texture to Material:
    - In the Material properties, create a new material for your mesh.
    - In the Shader Editor, add an Image Texture node and connect it to the Base Color input of the Shader node.
    - Load the texture you want to bake into the Image Texture node.

3. Prepare Vertex Colors:
    - In the Object Data properties (the green triangle icon), find the Vertex Colors section.
    - Add a new Vertex Color by clicking the '+' button. You can name it if you want.

4. Switch to Cycles Renderer:
    - Go to the Render properties.
    - Change the render engine to Cycles.

5. Configure Baking:
    - In the Bake section of the Render properties, set the Bake Type to Emit (or choose the appropriate type for your scenario).
    - Set the Target to Active Color Attribute.

6. Shader Editor Setup:
    - In the Shader Editor, select the Attribute node.
    - Connect the Attribute node to the Material Output.
    - Ensure that the Image Texture node (containing your texture) is connected to the Attribute node.

7. Bake:
    - Click the Bake button in the Render properties.
    - Blender will calculate and bake the texture information onto the vertex colors.

8. View Baked Result:
    - Switch the viewport shading to Material Preview mode.
    - You should now see the mesh with vertex colors representing the baked texture.

9. Troubleshooting (if needed):
    - If you encounter issues, try switching to CPU rendering instead of GPU in the Render properties.

These steps should guide you through the process of baking a texture onto vertex colors.