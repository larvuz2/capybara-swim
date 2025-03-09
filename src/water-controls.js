/**
 * Water Simulation Controls
 * 
 * This file contains parameters and GUI controls for the water simulation
 * in the Capybara Swim game. These parameters can be adjusted in real-time
 * to fine-tune the water's appearance and behavior.
 */

import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// Default water parameters
const waterParams = {
  // Visual properties
  waterColor: '#001e0f',
  sunColor: '#ffffff',
  distortionScale: 3.7,
  alpha: 1.0,
  
  // Wave properties
  waveSpeed: 1.0,
  waveHeight: 0.2,
  waveFrequency: 0.5,
  
  // Reflection/refraction
  reflectivity: 0.5,
  refractionRatio: 0.98,
  
  // Foam
  foamEnabled: true,
  foamColor: '#ffffff',
  foamThreshold: 0.7,
  
  // Physics
  buoyancyForce: 20,
  dragCoefficient: 2.0,
  
  // Environment
  waterLevel: 0,
  
  // Performance
  textureWidth: 512,
  textureHeight: 512
};

/**
 * Creates a GUI for controlling water parameters
 * @param {Water} water - The Three.js Water object
 * @param {Object} physics - The physics object containing buoyancy parameters
 * @returns {GUI} The created GUI object
 */
export function createWaterControls(water, physics) {
  const gui = new GUI({ title: 'Water Controls' });
  
  // Visual folder
  const visualFolder = gui.addFolder('Visual Properties');
  visualFolder.addColor(waterParams, 'waterColor').onChange((value) => {
    water.material.uniforms['waterColor'].value.set(value);
  });
  visualFolder.addColor(waterParams, 'sunColor').onChange((value) => {
    water.material.uniforms['sunColor'].value.set(value);
  });
  visualFolder.add(waterParams, 'distortionScale', 0, 10, 0.1).onChange((value) => {
    water.material.uniforms['distortionScale'].value = value;
  });
  visualFolder.add(waterParams, 'alpha', 0, 1, 0.01).onChange((value) => {
    water.material.uniforms['alpha'].value = value;
  });
  
  // Wave folder
  const waveFolder = gui.addFolder('Wave Properties');
  waveFolder.add(waterParams, 'waveSpeed', 0, 5, 0.1).onChange((value) => {
    // This will be used in the animation loop to control time increment
    water.material.userData.waveSpeed = value;
  });
  waveFolder.add(waterParams, 'waveHeight', 0, 1, 0.05).onChange((value) => {
    // This affects the normal map's influence
    water.material.uniforms['distortionScale'].value = value * 10;
  });
  waveFolder.add(waterParams, 'waveFrequency', 0, 2, 0.1).onChange((value) => {
    // This would require custom shader modification for full control
    water.material.userData.waveFrequency = value;
  });
  
  // Reflection folder
  const reflectionFolder = gui.addFolder('Reflection & Refraction');
  reflectionFolder.add(waterParams, 'reflectivity', 0, 1, 0.05).onChange((value) => {
    water.material.uniforms['reflectivity'].value = value;
  });
  reflectionFolder.add(waterParams, 'refractionRatio', 0, 1, 0.01).onChange((value) => {
    water.material.uniforms['refractionRatio'].value = value;
  });
  
  // Foam folder (would require custom shader implementation)
  const foamFolder = gui.addFolder('Foam Effects');
  foamFolder.add(waterParams, 'foamEnabled').onChange((value) => {
    water.material.userData.foamEnabled = value;
  });
  foamFolder.addColor(waterParams, 'foamColor').onChange((value) => {
    water.material.userData.foamColor = new THREE.Color(value);
  });
  foamFolder.add(waterParams, 'foamThreshold', 0, 1, 0.05).onChange((value) => {
    water.material.userData.foamThreshold = value;
  });
  
  // Physics folder
  const physicsFolder = gui.addFolder('Physics');
  physicsFolder.add(waterParams, 'buoyancyForce', 0, 50, 1).onChange((value) => {
    physics.buoyancyForce = value;
  });
  physicsFolder.add(waterParams, 'dragCoefficient', 0, 10, 0.1).onChange((value) => {
    physics.dragCoefficient = value;
  });
  physicsFolder.add(waterParams, 'waterLevel', -2, 2, 0.1).onChange((value) => {
    physics.waterLevel = value;
    water.position.y = value;
  });
  
  // Performance folder
  const performanceFolder = gui.addFolder('Performance');
  performanceFolder.add(waterParams, 'textureWidth', [128, 256, 512, 1024, 2048]).onChange((value) => {
    // This would require recreating the water object
    console.log('Texture width changed to', value, '- requires reload to take effect');
  });
  performanceFolder.add(waterParams, 'textureHeight', [128, 256, 512, 1024, 2048]).onChange((value) => {
    // This would require recreating the water object
    console.log('Texture height changed to', value, '- requires reload to take effect');
  });
  
  // Initialize water material with our parameters
  water.material.userData = {
    waveSpeed: waterParams.waveSpeed,
    waveFrequency: waterParams.waveFrequency,
    foamEnabled: waterParams.foamEnabled,
    foamColor: new THREE.Color(waterParams.foamColor),
    foamThreshold: waterParams.foamThreshold
  };
  
  // Initialize physics with our parameters
  physics.buoyancyForce = waterParams.buoyancyForce;
  physics.dragCoefficient = waterParams.dragCoefficient;
  physics.waterLevel = waterParams.waterLevel;
  
  return gui;
}

/**
 * Updates water animation based on current parameters
 * @param {Water} water - The Three.js Water object
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateWater(water, deltaTime) {
  // Get custom parameters from userData
  const waveSpeed = water.material.userData.waveSpeed || waterParams.waveSpeed;
  
  // Update water time uniform (controls wave animation)
  water.material.uniforms['time'].value += deltaTime * waveSpeed;
  
  // Additional custom updates could be added here
  // For example, if implementing custom foam effects
}

// Export default parameters for use elsewhere
export { waterParams };