/**
 * Custom Water Shaders
 * 
 * This file contains custom shader code to enhance the water simulation
 * with advanced effects like foam, caustics, and more realistic wave patterns.
 */

import * as THREE from 'three';

// Custom water vertex shader
const waterVertexShader = `
uniform float time;
uniform float waveHeight;
uniform float waveFrequency;
uniform vec2 waveDirection;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    
    // Apply wave displacement
    vec3 newPosition = position;
    
    // Primary wave
    float wave1 = sin(dot(position.xz, waveDirection) * waveFrequency + time) * waveHeight;
    
    // Secondary wave (perpendicular)
    vec2 perpDirection = vec2(-waveDirection.y, waveDirection.x);
    float wave2 = sin(dot(position.xz, perpDirection) * waveFrequency * 1.5 + time * 0.8) * waveHeight * 0.3;
    
    // Tertiary wave (diagonal, faster)
    vec2 diagDirection = normalize(waveDirection + perpDirection);
    float wave3 = sin(dot(position.xz, diagDirection) * waveFrequency * 2.3 + time * 1.2) * waveHeight * 0.15;
    
    // Apply combined waves
    newPosition.y += wave1 + wave2 + wave3;
    
    // Calculate new normal based on wave derivatives
    // This would be more complex in a full implementation
    
    // Transform to world space
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
    
    // Output position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

// Custom water fragment shader
const waterFragmentShader = `
uniform sampler2D normalSampler;
uniform sampler2D reflectionSampler;
uniform sampler2D refractionSampler;
uniform sampler2D depthSampler;

uniform float time;
uniform vec3 waterColor;
uniform vec3 sunColor;
uniform float distortionScale;
uniform float alpha;
uniform float reflectivity;
uniform float refractionRatio;

uniform bool foamEnabled;
uniform vec3 foamColor;
uniform float foamThreshold;

uniform vec3 eye;
uniform vec3 sunDirection;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

// Helper functions
float fresnel(vec3 normal, vec3 viewDirection, float power) {
    return pow(1.0 - max(0.0, dot(normal, viewDirection)), power);
}

void main() {
    // Sample normal map
    vec4 normalColor = texture2D(normalSampler, vUv * 10.0 + time * 0.05);
    vec3 normal = normalize(normalColor.rgb * 2.0 - 1.0);
    
    // View direction
    vec3 viewDirection = normalize(eye - vWorldPosition);
    
    // Calculate fresnel term
    float fresnelTerm = fresnel(normal, viewDirection, 5.0);
    
    // Reflection and refraction coordinates
    vec2 reflectionCoord = gl_FragCoord.xy / vec2(1024.0, 1024.0); // Replace with actual resolution
    vec2 refractionCoord = reflectionCoord;
    
    // Apply distortion from normal map
    reflectionCoord += normal.xz * distortionScale * 0.05;
    refractionCoord += normal.xz * distortionScale * 0.05;
    
    // Sample reflection and refraction textures
    vec4 reflectionColor = texture2D(reflectionSampler, reflectionCoord);
    vec4 refractionColor = texture2D(refractionSampler, refractionCoord);
    
    // Mix reflection and refraction based on fresnel and reflectivity
    vec4 waterColorRGBA = vec4(waterColor, alpha);
    vec4 finalColor = mix(
        mix(waterColorRGBA, refractionColor, 0.5),
        reflectionColor,
        fresnelTerm * reflectivity
    );
    
    // Add sun specular highlight
    vec3 halfDir = normalize(sunDirection + viewDirection);
    float specular = pow(max(0.0, dot(normal, halfDir)), 100.0);
    finalColor.rgb += sunColor * specular * 0.5;
    
    // Add foam effect if enabled
    if (foamEnabled) {
        // Calculate foam based on wave height and shoreline
        float foamFactor = 0.0;
        
        // Foam at wave peaks
        float wavePeak = sin(vUv.x * 20.0 + vUv.y * 30.0 + time) * 0.5 + 0.5;
        wavePeak = pow(wavePeak, 8.0);
        
        // Foam at shoreline (would use depth texture in real implementation)
        float shorelineFoam = 0.0;
        
        // Combine foam factors
        foamFactor = max(wavePeak, shorelineFoam);
        
        // Apply foam threshold
        foamFactor = smoothstep(foamThreshold, 1.0, foamFactor);
        
        // Add foam to final color
        finalColor.rgb = mix(finalColor.rgb, foamColor, foamFactor);
    }
    
    // Add caustics effect (simplified)
    float causticPattern = 
        sin(vWorldPosition.x * 5.0 + time) * 
        sin(vWorldPosition.z * 5.0 + time) * 0.5 + 0.5;
    causticPattern = pow(causticPattern, 2.0) * 0.2;
    
    finalColor.rgb += causticPattern * sunColor * 0.1;
    
    gl_FragColor = finalColor;
}
`;

/**
 * Creates custom water material with enhanced shaders
 * @param {Object} options - Water material options
 * @returns {THREE.ShaderMaterial} Custom water shader material
 */
export function createCustomWaterMaterial(options = {}) {
    // Default options
    const defaultOptions = {
        normalSampler: null,
        reflectionSampler: null,
        refractionSampler: null,
        depthSampler: null,
        waterColor: new THREE.Color(0x001e0f),
        sunColor: new THREE.Color(0xffffff),
        sunDirection: new THREE.Vector3(0.5, 0.5, 0),
        distortionScale: 3.7,
        alpha: 1.0,
        time: 0,
        waveHeight: 0.2,
        waveFrequency: 0.5,
        waveDirection: new THREE.Vector2(1, 1).normalize(),
        reflectivity: 0.5,
        refractionRatio: 0.98,
        foamEnabled: true,
        foamColor: new THREE.Color(0xffffff),
        foamThreshold: 0.7,
        eye: new THREE.Vector3(0, 0, 0)
    };
    
    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Create shader material
    const material = new THREE.ShaderMaterial({
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        uniforms: {
            normalSampler: { value: mergedOptions.normalSampler },
            reflectionSampler: { value: mergedOptions.reflectionSampler },
            refractionSampler: { value: mergedOptions.refractionSampler },
            depthSampler: { value: mergedOptions.depthSampler },
            waterColor: { value: mergedOptions.waterColor },
            sunColor: { value: mergedOptions.sunColor },
            sunDirection: { value: mergedOptions.sunDirection },
            distortionScale: { value: mergedOptions.distortionScale },
            alpha: { value: mergedOptions.alpha },
            time: { value: mergedOptions.time },
            waveHeight: { value: mergedOptions.waveHeight },
            waveFrequency: { value: mergedOptions.waveFrequency },
            waveDirection: { value: mergedOptions.waveDirection },
            reflectivity: { value: mergedOptions.reflectivity },
            refractionRatio: { value: mergedOptions.refractionRatio },
            foamEnabled: { value: mergedOptions.foamEnabled },
            foamColor: { value: mergedOptions.foamColor },
            foamThreshold: { value: mergedOptions.foamThreshold },
            eye: { value: mergedOptions.eye }
        },
        transparent: mergedOptions.alpha < 1.0,
        side: THREE.DoubleSide
    });
    
    return material;
}

/**
 * Extends the standard Three.js Water class with custom shader capabilities
 * @param {THREE.Geometry} geometry - Water surface geometry
 * @param {Object} options - Water options
 * @returns {THREE.Mesh} Enhanced water mesh
 */
export function createEnhancedWater(geometry, options = {}) {
    // Create a standard Three.js Water object first
    const water = new THREE.Mesh(geometry);
    
    // Create render targets for reflection and refraction
    const textureWidth = options.textureWidth || 512;
    const textureHeight = options.textureHeight || 512;
    
    const reflectionRenderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight);
    const refractionRenderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight);
    
    // Load normal map
    const normalMap = new THREE.TextureLoader().load(
        options.waterNormals || 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg',
        function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
    );
    
    // Create custom water material
    const customMaterial = createCustomWaterMaterial({
        normalSampler: normalMap,
        reflectionSampler: reflectionRenderTarget.texture,
        refractionSampler: refractionRenderTarget.texture,
        waterColor: new THREE.Color(options.waterColor || 0x001e0f),
        sunColor: new THREE.Color(options.sunColor || 0xffffff),
        sunDirection: options.sunDirection || new THREE.Vector3(0.5, 0.5, 0),
        distortionScale: options.distortionScale || 3.7,
        alpha: options.alpha !== undefined ? options.alpha : 1.0,
        waveHeight: options.waveHeight || 0.2,
        waveFrequency: options.waveFrequency || 0.5,
        waveDirection: options.waveDirection || new THREE.Vector2(1, 1).normalize(),
        reflectivity: options.reflectivity || 0.5,
        refractionRatio: options.refractionRatio || 0.98,
        foamEnabled: options.foamEnabled !== undefined ? options.foamEnabled : true,
        foamColor: new THREE.Color(options.foamColor || 0xffffff),
        foamThreshold: options.foamThreshold || 0.7
    });
    
    // Apply material to water mesh
    water.material = customMaterial;
    
    // Store render targets and other properties
    water.userData = {
        reflectionRenderTarget,
        refractionRenderTarget,
        options
    };
    
    // Add update method
    water.update = function(renderer, scene, camera, deltaTime) {
        // Update time uniform
        this.material.uniforms.time.value += deltaTime;
        
        // Update eye position for fresnel calculations
        this.material.uniforms.eye.value.copy(camera.position);
        
        // In a full implementation, you would:
        // 1. Render the scene to reflection and refraction render targets
        // 2. Update other dynamic uniforms
    };
    
    return water;
}

// Export shader code for reference
export { waterVertexShader, waterFragmentShader };