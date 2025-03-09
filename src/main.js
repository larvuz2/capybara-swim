/**
 * Capybara Swim - Main Application
 * 
 * This file initializes the 3D scene, water simulation, physics, and character.
 * It demonstrates how to use the water controls to create an interactive water simulation.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createWaterControls, updateWater, waterParams } from './water-controls.js';

// Global variables
let scene, camera, renderer;
let water, controls;
let clock = new THREE.Clock();

// Physics simulation (placeholder - would be replaced with Rapier)
const physics = {
  buoyancyForce: waterParams.buoyancyForce,
  dragCoefficient: waterParams.dragCoefficient,
  waterLevel: waterParams.waterLevel,
  update: function(deltaTime) {
    // Physics update logic would go here
    // This would be replaced with actual Rapier physics
  }
};

// Initialize the application
function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue
  
  // Create camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 10);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  
  // Add camera controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Create water
  createWater();
  
  // Add environment (islands, trees)
  createEnvironment();
  
  // Add capybara character
  createCapybara();
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop
  animate();
}

// Create water surface
function createWater() {
  const waterGeometry = new THREE.PlaneGeometry(100, 100);
  
  // Create water with parameters from water-controls.js
  water = new Water(waterGeometry, {
    textureWidth: waterParams.textureWidth,
    textureHeight: waterParams.textureHeight,
    waterNormals: new THREE.TextureLoader().load(
      'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
      function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(0.5, 0.5, 0),
    sunColor: waterParams.sunColor,
    waterColor: waterParams.waterColor,
    distortionScale: waterParams.distortionScale,
    fog: false,
    alpha: waterParams.alpha
  });
  
  water.rotation.x = -Math.PI / 2; // Rotate to lie flat
  water.position.y = waterParams.waterLevel;
  scene.add(water);
  
  // Create GUI controls for water
  createWaterControls(water, physics);
}

// Create environment (islands and trees)
function createEnvironment() {
  // Create a simple island (placeholder for actual model)
  const islandGeometry = new THREE.CylinderGeometry(5, 7, 2, 32);
  const islandMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,  // Brown
    roughness: 0.8
  });
  const island = new THREE.Mesh(islandGeometry, islandMaterial);
  island.position.set(0, -1, 0); // Half submerged
  scene.add(island);
  
  // Add sand on top
  const sandGeometry = new THREE.CylinderGeometry(4.8, 5, 0.2, 32);
  const sandMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf0e68c,  // Khaki
    roughness: 1.0
  });
  const sand = new THREE.Mesh(sandGeometry, sandMaterial);
  sand.position.set(0, 0.1, 0); // Just above water
  scene.add(sand);
  
  // Add simple trees (placeholders for actual models)
  addTree(2, 0.5, 2);
  addTree(-2, 0.5, -1);
  addTree(0, 0.5, -3);
}

// Helper function to add a simple tree
function addTree(x, y, z) {
  // Tree trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.set(x, y + 1, z);
  scene.add(trunk);
  
  // Tree foliage
  const foliageGeometry = new THREE.ConeGeometry(1, 2, 8);
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.set(x, y + 2.5, z);
  scene.add(foliage);
}

// Create capybara character
function createCapybara() {
  // Simple placeholder for capybara model
  const capybaraGroup = new THREE.Group();
  
  // Body
  const bodyGeometry = new THREE.CapsuleGeometry(0.7, 1.2, 4, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.z = Math.PI / 2;
  capybaraGroup.add(body);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0.9, 0.2, 0);
  capybaraGroup.add(head);
  
  // Eyes
  const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(1.2, 0.3, 0.3);
  capybaraGroup.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(1.2, 0.3, -0.3);
  capybaraGroup.add(rightEye);
  
  // Position capybara in the scene
  capybaraGroup.position.set(5, 0, 0); // At water level
  scene.add(capybaraGroup);
  
  // In a real implementation, you would load a GLTF model instead:
  /*
  const loader = new GLTFLoader();
  loader.load('models/capybara.glb', (gltf) => {
    const model = gltf.scene;
    model.position.set(5, 0, 0);
    model.scale.set(0.5, 0.5, 0.5);
    scene.add(model);
  });
  */
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  
  // Update controls
  controls.update();
  
  // Update water
  updateWater(water, deltaTime);
  
  // Update physics
  physics.update(deltaTime);
  
  // Render scene
  renderer.render(scene, camera);
}

// Start the application
init();

// Add "Capybara Swim" to the end
console.log("Capybara Swim");