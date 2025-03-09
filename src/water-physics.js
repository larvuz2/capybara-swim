/**
 * Advanced Water Physics Simulation
 * 
 * This file contains the physics simulation for water interaction with objects.
 * It implements buoyancy, drag, and wave forces for realistic water physics.
 */

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

// Water physics parameters
const waterPhysicsParams = {
  // Buoyancy
  density: 1.0,           // Water density (1.0 = realistic water)
  buoyancyMultiplier: 1.2, // Multiplier for buoyancy force
  
  // Drag
  linearDrag: 0.5,        // Linear drag coefficient
  quadraticDrag: 0.05,    // Quadratic drag coefficient (for faster movements)
  
  // Waves
  waveHeight: 0.2,        // Height of waves
  waveFrequency: 0.5,     // Frequency of waves
  waveSpeed: 1.0,         // Speed of wave propagation
  waveDirection: new THREE.Vector2(1, 1).normalize(), // Direction of wave travel
  
  // Advanced
  surfaceTension: 0.07,   // Surface tension coefficient
  vorticity: 0.1,         // Vorticity strength (swirling)
  damping: 0.03,          // Wave damping factor
  
  // Performance
  subSteps: 3,            // Physics sub-steps for stability
  maxBuoyancyPoints: 8    // Maximum buoyancy sample points per object
};

/**
 * Creates a water physics simulator
 * @param {RAPIER.World} world - The Rapier physics world
 * @param {Object} params - Optional parameters to override defaults
 * @returns {Object} The water physics simulator object
 */
export function createWaterPhysics(world, params = {}) {
  // Merge provided params with defaults
  const settings = { ...waterPhysicsParams, ...params };
  
  // Water surface height function (based on waves)
  function getWaterHeight(x, z, time) {
    const waveX = settings.waveDirection.x;
    const waveZ = settings.waveDirection.y;
    
    // Compute multiple overlapping waves for more realistic effect
    let height = 0;
    
    // Primary wave
    height += Math.sin(
      (x * waveX + z * waveZ) * settings.waveFrequency + 
      time * settings.waveSpeed
    ) * settings.waveHeight;
    
    // Secondary wave (perpendicular, smaller)
    height += Math.sin(
      (x * -waveZ + z * waveX) * settings.waveFrequency * 1.5 + 
      time * settings.waveSpeed * 0.8
    ) * settings.waveHeight * 0.3;
    
    // Tertiary wave (diagonal, faster)
    height += Math.sin(
      (x * (waveX + waveZ) + z * (waveX - waveZ)) * settings.waveFrequency * 2.3 + 
      time * settings.waveSpeed * 1.2
    ) * settings.waveHeight * 0.15;
    
    return height;
  }
  
  // Calculate buoyancy force for a point
  function calculateBuoyancyForce(position, waterLevel, time) {
    // Get actual water height at this position including waves
    const actualWaterHeight = waterLevel + 
      getWaterHeight(position.x, position.z, time);
    
    // If point is above water, no buoyancy
    if (position.y > actualWaterHeight) {
      return { force: new THREE.Vector3(0, 0, 0), submergedDepth: 0 };
    }
    
    // Calculate submersion depth
    const submergedDepth = actualWaterHeight - position.y;
    
    // Calculate buoyancy force (F = density * g * volume)
    // We approximate volume as proportional to submerged depth
    const buoyancyForce = settings.density * 9.81 * submergedDepth * settings.buoyancyMultiplier;
    
    // Create force vector (only upward for basic buoyancy)
    const force = new THREE.Vector3(0, buoyancyForce, 0);
    
    return { force, submergedDepth };
  }
  
  // Calculate drag force for an object
  function calculateDragForce(velocity, submergedDepth) {
    if (submergedDepth <= 0) return new THREE.Vector3(0, 0, 0);
    
    // Get velocity magnitude
    const speed = velocity.length();
    
    // No drag if not moving
    if (speed < 0.001) return new THREE.Vector3(0, 0, 0);
    
    // Calculate drag magnitude (linear + quadratic components)
    const dragMagnitude = (
      settings.linearDrag * speed + 
      settings.quadraticDrag * speed * speed
    ) * submergedDepth;
    
    // Create normalized and scaled drag force (opposite to velocity)
    const dragForce = velocity.clone().normalize().multiplyScalar(-dragMagnitude);
    
    return dragForce;
  }
  
  // Apply water physics to a rigid body
  function applyWaterPhysics(rigidBody, waterLevel, time, deltaTime) {
    // Get body properties
    const position = rigidBody.translation();
    const velocity = rigidBody.linvel();
    const rotation = rigidBody.rotation();
    
    // Skip if far above water
    if (position.y > waterLevel + 5) return;
    
    // Get collider for dimensions
    const collider = world.getCollider(rigidBody.collider(0));
    if (!collider) return;
    
    // Generate buoyancy points based on collider type
    const buoyancyPoints = [];
    
    // For simplicity, we'll use a basic approach with a few sample points
    // In a more advanced implementation, you'd sample the actual collider shape
    
    // Get approximate dimensions (assuming box-like shape)
    const halfExtents = new THREE.Vector3(0.5, 0.5, 0.5);
    
    // For cuboid colliders, get actual half-extents
    if (collider.type() === RAPIER.ShapeType.Cuboid) {
      const cuboidHalfExtents = collider.halfExtents();
      halfExtents.set(cuboidHalfExtents.x, cuboidHalfExtents.y, cuboidHalfExtents.z);
    }
    
    // Generate sample points distributed throughout the object's volume
    const numPoints = Math.min(settings.maxBuoyancyPoints, 
      Math.ceil(halfExtents.x * halfExtents.y * halfExtents.z * 8));
    
    for (let i = 0; i < numPoints; i++) {
      // Create points distributed throughout the volume
      // This is a simplified approach - more sophisticated sampling would be better
      const px = (Math.random() * 2 - 1) * halfExtents.x;
      const py = (Math.random() * 2 - 1) * halfExtents.y;
      const pz = (Math.random() * 2 - 1) * halfExtents.z;
      
      // Transform point to world space
      const worldPoint = new THREE.Vector3(
        position.x + px,
        position.y + py,
        position.z + pz
      );
      
      buoyancyPoints.push(worldPoint);
    }
    
    // Apply forces for each buoyancy point
    let totalBuoyancyForce = new THREE.Vector3(0, 0, 0);
    let totalDragForce = new THREE.Vector3(0, 0, 0);
    let averageSubmergedDepth = 0;
    
    for (const point of buoyancyPoints) {
      // Calculate buoyancy at this point
      const { force, submergedDepth } = calculateBuoyancyForce(point, waterLevel, time);
      
      // Accumulate forces
      totalBuoyancyForce.add(force);
      averageSubmergedDepth += submergedDepth;
    }
    
    // Average the submerged depth
    averageSubmergedDepth /= buoyancyPoints.length;
    
    // Calculate drag based on average submersion
    totalDragForce = calculateDragForce(
      new THREE.Vector3(velocity.x, velocity.y, velocity.z),
      averageSubmergedDepth
    );
    
    // Apply the accumulated forces
    if (totalBuoyancyForce.lengthSq() > 0) {
      rigidBody.applyImpulse(
        { x: 0, y: totalBuoyancyForce.y * deltaTime, z: 0 },
        true
      );
    }
    
    if (totalDragForce.lengthSq() > 0) {
      rigidBody.applyImpulse(
        { 
          x: totalDragForce.x * deltaTime,
          y: totalDragForce.y * deltaTime,
          z: totalDragForce.z * deltaTime
        },
        true
      );
    }
    
    // Apply wave forces for objects at the surface
    if (averageSubmergedDepth > 0 && averageSubmergedDepth < halfExtents.y * 2) {
      // Calculate wave direction force
      const waveForce = new THREE.Vector3(
        settings.waveDirection.x,
        0,
        settings.waveDirection.y
      ).multiplyScalar(
        settings.waveHeight * 0.5 * Math.sin(time * settings.waveSpeed)
      );
      
      rigidBody.applyImpulse(
        { x: waveForce.x * deltaTime, y: 0, z: waveForce.z * deltaTime },
        true
      );
    }
  }
  
  // Return the water physics simulator object
  return {
    settings,
    getWaterHeight,
    applyWaterPhysics,
    
    // Update method to be called in the animation loop
    update: function(deltaTime, waterLevel, time) {
      // Apply water physics to all dynamic bodies
      for (let i = 0; i < world.bodies.len(); i++) {
        const rigidBody = world.bodies.at(i);
        
        // Only apply to dynamic bodies
        if (rigidBody.bodyType() === RAPIER.RigidBodyType.Dynamic) {
          applyWaterPhysics(rigidBody, waterLevel, time, deltaTime);
        }
      }
    }
  };
}

// Export parameters for use elsewhere
export { waterPhysicsParams };