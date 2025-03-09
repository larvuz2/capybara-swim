# Capybara Swim - Game Plan

Below are detailed instructions and code changes to transform the existing 3D physics-based character controller project into a scene featuring a realistic water physics pond with naturally moving water, islands topped with trees, and a capybara that floats half-submerged in the water.

## Overview of Changes

To achieve the goal, we'll:

1. Create a Realistic Water Surface using Three.js's Water class
2. Add Islands with Trees using 3D models and physics colliders
3. Make the Capybara Float with buoyancy simulation
4. Update the Scene with proper camera controls and rendering

## Step-by-Step Instructions

### Step 1: Add a Realistic Water Surface

We'll use the `Water` class from Three.js examples to create a water plane with natural movement.

[Rest of the content from plan1.0...]

## Final Steps

1. **Add Assets**:
   - Place `water_normals.jpg`, `island.glb`, and `tree.glb` in `public/`.
2. **Run the Project**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to test.
3. **Tune Parameters**:
   - Adjust `buoyancyForce`, island/tree positions, and water properties for the desired look and feel.
4. **Build and Deploy**:
   ```bash
   npm run build
   npx netlify deploy --prod
   ```

## Result

You now have:
- A pond with realistic water movement using shaders
- Islands with trees positioned above the water, with physics colliders
- A capybara character floating half-submerged, with buoyancy keeping it stable
- The existing WASD and camera controls should still work, though movement may feel different in water