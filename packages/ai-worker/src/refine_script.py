import bpy
import sys
import argparse

def get_args():
    """
    Parse command line arguments passed to the Blender script.
    """
    # Remove Blender's default arguments
    argv = sys.argv[sys.argv.index("--") + 1:]

    parser = argparse.ArgumentParser(description='Refine a 3D model using Blender.')
    parser.add_argument('--input', dest='input_path', type=str, required=True, help='Path to the input .obj file')
    parser.add_argument('--output', dest='output_path', type=str, required=True, help='Path to save the output .glb file')
    parser.add_argument('--poly_count', dest='poly_count', type=int, default=5000, help='Target polygon count for remeshing')

    return parser.parse_args(argv)

def main():
    args = get_args()

    # --- 1. Clean Scene and Import Model ---
    # Delete the default cube, light, and camera
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Import the raw .obj model
    bpy.ops.import_scene.obj(filepath=args.input_path)

    # Get the imported object (assumes only one object is in the file)
    obj = bpy.context.selected_objects[0]
    bpy.context.view_layer.objects.active = obj

    # --- 2. Apply QuadriFlow Remesh ---
    print(f"Remeshing to target poly count: {args.poly_count}")
    bpy.ops.object.modifier_add(type='REMESH')
    remesh_modifier = obj.modifiers["Remesh"]
    remesh_modifier.mode = 'QUAD'
    remesh_modifier.quadri_flow_target_face_count = args.poly_count

    # Apply the modifier
    bpy.ops.object.modifier_apply(modifier=remesh_modifier.name)

    # --- 3. Smart UV Project ---
    print("Applying Smart UV Project...")
    # Enter Edit Mode to perform UV unwrapping
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')

    # Perform the Smart UV Project operation
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)

    # Return to Object Mode
    bpy.ops.object.mode_set(mode='OBJECT')

    # --- 4. Export as GLB ---
    print(f"Exporting refined model to {args.output_path}")
    # GLB format is efficient and web-friendly
    bpy.ops.export_scene.gltf(
        filepath=args.output_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True # Apply modifiers on export
    )

    print("Refinement script finished successfully.")

if __name__ == "__main__":
    main()