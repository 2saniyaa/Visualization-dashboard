// Function to handle clicking on the SHIM part image
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up click handler');
    
    // Add click handler for Overview button only
    const overviewBtn = document.querySelector('.item-image .btn-primary');
    if (overviewBtn) {
        console.log('Overview button found, adding click listener');
        overviewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Overview button clicked!');
            // Open the GLTF file in popup
            const filePath = 'models/145275T013_002_MODEL_SOLIDS.gltf';
            openJtFileInPopup(filePath);
        });
    } else {
        console.error('Overview button element not found!');
    }

    // Disable SHIM button completely
    const shimBtn = document.querySelector('.shim-btn');
    if (shimBtn) {
        shimBtn.style.pointerEvents = 'none';
        shimBtn.style.opacity = '0.6';
        shimBtn.style.cursor = 'not-allowed';
        console.log('SHIM button disabled');
    }
});

// Function to show file selection modal - COMPLETELY REMOVED
function showFileSelectionModal() {
    // This function is completely disabled - SHIM is no longer clickable
    // All functionality has been removed
    return;
}

// Three.js viewer variables
let scene, camera, renderer, controls;
let currentModel = null;
let isRotating = false;
let animationId = null;

// Popup viewer function - modal on same page
function openJtFileInPopup(filePath) {
    // If no file path provided, do nothing
    if (!filePath || filePath.trim() === '') {
        console.log('No file path provided - popup will not open');
        return;
    }
    
    const fileName = filePath.split('/').pop();
    
    // Extract weight, material, and description from the page
    const getValueByLabel = (labelText) => {
        const labels = document.querySelectorAll('.card-label');
        for (let label of labels) {
            if (label.textContent.includes(labelText)) {
                const row = label.closest('.card-row');
                const value = row ? row.querySelector('.card-value') : null;
                return value ? value.textContent.trim() : 'N/A';
            }
        }
        return 'N/A';
    };
    
    const weight = getValueByLabel('Weight');
    const material = getValueByLabel('Material');
    const description = document.querySelector('.item-name')?.textContent.trim() || 
                       document.querySelector('.item-id')?.textContent.trim() || 
                       'No description available';
    
    // Remove existing popup if any
    const existingPopup = document.getElementById('viewer-popup-modal');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup modal
    const modal = document.createElement('div');
    modal.id = 'viewer-popup-modal';
    modal.className = 'viewer-popup-modal';
    modal.innerHTML = `
        <div class="viewer-popup-content">
            <div class="viewer-popup-header">
                <h3>3D Viewer - ${fileName}</h3>
                <button class="viewer-popup-close" onclick="closeViewerPopup()">&times;</button>
            </div>
            <div class="viewer-popup-info">
                <div class="viewer-popup-info-item">
                    <span class="viewer-popup-info-label">Weight:</span>
                    <span class="viewer-popup-info-value">${weight}</span>
                </div>
                <div class="viewer-popup-info-item">
                    <span class="viewer-popup-info-label">Material:</span>
                    <span class="viewer-popup-info-value">${material}</span>
                </div>
                <div class="viewer-popup-info-item">
                    <span class="viewer-popup-info-label">Description:</span>
                    <span class="viewer-popup-info-value">${description}</span>
                </div>
            </div>
            <div class="viewer-popup-controls">
                <button class="viewer-popup-btn" id="popup-rotate-btn">🔄 Rotate</button>
                <button class="viewer-popup-btn" id="popup-reset-btn">↻ Reset</button>
                <button class="viewer-popup-btn" id="popup-zoom-in-btn">+ Zoom In</button>
                <button class="viewer-popup-btn" id="popup-zoom-out-btn">- Zoom Out</button>
            </div>
            <div class="viewer-popup-loading" id="popup-loading">Loading 3D model...</div>
            <canvas id="popup-model-canvas" class="viewer-popup-canvas"></canvas>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close popup when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeViewerPopup();
        }
    });
    
    // Close popup with Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeViewerPopup();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Initialize viewer in popup (delay to ensure DOM is ready)
    setTimeout(() => {
        initPopupViewer(filePath, fileName);
    }, 100);
}

// Popup viewer variables
let popupScene, popupCamera, popupRenderer, popupControls;
let popupModel = null;
let popupIsRotating = false;
let popupAnimationId = null;

// Close popup function
function closeViewerPopup() {
    const modal = document.getElementById('viewer-popup-modal');
    if (modal) {
        if (popupAnimationId) {
            cancelAnimationFrame(popupAnimationId);
            popupAnimationId = null;
        }
        if (popupRenderer) {
            popupRenderer.dispose();
        }
        modal.remove();
    }
}

// Initialize popup viewer
function initPopupViewer(filePath, fileName) {
    const canvas = document.getElementById('popup-model-canvas');
    const loading = document.getElementById('popup-loading');
    
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    if (typeof THREE === 'undefined') {
        if (loading) loading.innerHTML = 'Loading Three.js library...';
        setTimeout(() => initPopupViewer(filePath, fileName), 100);
        return;
    }
    
    canvas.style.display = 'block';
    canvas.style.visibility = 'hidden';
    
    const container = canvas.parentElement;
    let width = container ? container.clientWidth : 700;
    let height = container ? (container.clientHeight - 120) : 500;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.visibility = 'visible';
    
    popupScene = new THREE.Scene();
    // Set background to sky blue (gradient effect handled by CSS)
    popupScene.background = new THREE.Color(0x87CEEB);
    
    popupCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    popupCamera.position.set(0, 0, 5);
    
    popupRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    popupRenderer.setSize(width, height);
    
    // Add grid helper for background grid lines (like in the reference image)
    const gridSize = 20;
    const gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xFFFFFF, 0xB0E0E6);
    gridHelper.material.opacity = 0.6;
    gridHelper.material.transparent = true;
    popupScene.add(gridHelper);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    popupScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    popupScene.add(directionalLight);
    
    popupControls = new THREE.OrbitControls(popupCamera, popupRenderer.domElement);
    popupControls.enableDamping = true;
    popupControls.dampingFactor = 0.05;
    
    const resizeObserver = new ResizeObserver(() => {
        if (canvas && popupCamera && popupRenderer) {
            popupCamera.aspect = canvas.clientWidth / canvas.clientHeight;
            popupCamera.updateProjectionMatrix();
            popupRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    });
    resizeObserver.observe(canvas);
    
    loadPopupModel(filePath, fileName);
    popupAnimate();
    setupPopupControls();
}

// Load model in popup
async function loadPopupModel(filePath, fileName) {
    const loading = document.getElementById('popup-loading');
    const canvas = document.getElementById('popup-model-canvas');
    
    if (!loading || !canvas) return;
    
    try {
        if (loading) loading.innerHTML = 'Loading 3D model...';
        
        // Check file extension
        const extension = filePath.split('.').pop().toLowerCase();
        
        // Load GLTF/GLB files with Three.js GLTFLoader
        if (extension === 'gltf' || extension === 'glb') {
            await loadGLTFModelInPopup(filePath, fileName);
        } else {
            // For other formats (like .jt), use fallback visualization
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`File not found: ${filePath}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const fileSize = arrayBuffer.byteLength;
            createPopupVisualization(fileName, fileSize);
            
            setTimeout(() => {
                loading.style.display = 'none';
                canvas.style.display = 'block';
                if (popupRenderer && popupScene && popupCamera) {
                    popupRenderer.render(popupScene, popupCamera);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error loading file:', error);
        if (loading) {
            loading.innerHTML = `Error: ${error.message}`;
            loading.style.color = '#dc2626';
        }
    }
}

// Load GLTF/GLB model in popup using Three.js GLTFLoader
async function loadGLTFModelInPopup(filePath, fileName) {
    return new Promise(async (resolve, reject) => {
        // Wait for GLTFLoader to be available
        if (!THREE || !THREE.GLTFLoader) {
            console.log('Waiting for GLTFLoader...');
            setTimeout(() => loadGLTFModelInPopup(filePath, fileName), 200);
            return;
        }
        
        console.log('GLTFLoader is available, loading model:', filePath);
        
        const loading = document.getElementById('popup-loading');
        const canvas = document.getElementById('popup-model-canvas');
        
        try {
            const loader = new THREE.GLTFLoader();
            
            // Add aggressive cache-busting to prevent browser from using cached files
            const cacheBuster = '?nocache=' + Date.now() + '&r=' + Math.random().toString(36).substring(7);
            const filePathWithCache = filePath + cacheBuster;
            
            console.log('Loading GLTF file:', filePath);
            console.log('With cache-buster:', filePathWithCache);
            
            loader.load(
                filePathWithCache,
                // onLoad callback
                (gltf) => {
                    console.log('GLTF model loaded successfully:', gltf);
                    
                    // Remove existing model
                    if (popupModel && popupScene) {
                        popupScene.remove(popupModel);
                    }
                    
                    // Get the scene from GLTF
                    const model = gltf.scene || gltf.scenes[0];
                    
                    if (!model) {
                        throw new Error('No model found in GLTF file');
                    }
                    
                    // Add the model to the scene
                    popupScene.add(model);
                    popupModel = model;
                    
                    // Calculate bounding box and center the model
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    
                    console.log('Model bounding box:', { center, size, maxDim });
                    
                    // Only scale if we have valid dimensions
                    if (maxDim > 0) {
                        // Scale and center the model (make it larger)
                        model.position.sub(center);
                        const scale = 5 / maxDim;
                        model.scale.multiplyScalar(scale);
                        
                        // Position camera to view the model (maximum zoom in - very close)
                        const viewDistance = maxDim * 0.1;
                        popupCamera.position.set(viewDistance * 0.7, viewDistance * 0.3, viewDistance * 0.7);
                    } else {
                        // Default camera position if model has no size (maximum zoom in)
                        popupCamera.position.set(0.3, 0.3, 0.3);
                    }
                    
                    popupCamera.lookAt(0, 0, 0);
                    
                    if (popupControls) {
                        popupControls.target.set(0, 0, 0);
                        popupControls.update();
                    }
                    
                    // Play animations if available
                    if (gltf.animations && gltf.animations.length > 0) {
                        const mixer = new THREE.AnimationMixer(model);
                        gltf.animations.forEach((clip) => {
                            mixer.clipAction(clip).play();
                        });
                    }
                    
                    console.log('GLTF model displayed successfully');
                    
                    // Force a render to ensure the model is visible
                    if (popupRenderer && popupScene && popupCamera) {
                        popupRenderer.render(popupScene, popupCamera);
                    }
                    
                    // Hide loading and show canvas
                    setTimeout(() => {
                        if (loading) loading.style.display = 'none';
                        if (canvas) canvas.style.display = 'block';
                    }, 100);
                    
                    resolve();
                },
                // onProgress callback
                (progress) => {
                    if (loading && progress.total > 0) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        loading.innerHTML = `Loading 3D model... ${percent}%`;
                    }
                },
                // onError callback
                (error) => {
                    console.error('Error loading GLTF:', error);
                    let errorMessage = 'Failed to load 3D model';
                    
                    // Handle different error types
                    if (error instanceof ProgressEvent) {
                        if (error.target && error.target.status === 404) {
                            errorMessage = 'File not found: ' + filePath;
                        } else if (error.target && error.target.status === 0) {
                            errorMessage = 'Network error: Could not load file. Please check if the file exists.';
                        } else {
                            errorMessage = 'Failed to load file: ' + (error.target ? error.target.statusText : 'Unknown error');
                        }
                    } else if (error && error.message) {
                        errorMessage = error.message;
                    } else if (error && typeof error === 'string') {
                        errorMessage = error;
                    } else {
                        errorMessage = 'Failed to load GLTF model. Please ensure the file exists in the models folder.';
                    }
                    
                    if (loading) {
                        loading.innerHTML = `Error: ${errorMessage}`;
                        loading.style.color = '#dc2626';
                    }
                    reject(new Error(errorMessage));
                }
            );
        } catch (error) {
            console.error('Error in loadGLTFModelInPopup:', error);
            if (loading) {
                loading.innerHTML = `Error: ${error.message}`;
                loading.style.color = '#dc2626';
            }
            reject(error);
        }
    });
}

// Create visualization in popup
function createPopupVisualization(fileName, fileSize) {
    if (!popupScene) return;
    if (popupModel && popupScene) popupScene.remove(popupModel);
    
    const scaleFactor = Math.sqrt(Math.max(fileSize || 32768, 10000) / 50000);
    const baseSize = 2 * Math.min(Math.max(scaleFactor, 0.5), 3);
    const group = new THREE.Group();
    
    const mainGeometry = new THREE.BoxGeometry(baseSize, baseSize * 0.8, baseSize * 0.6);
    const mainMaterial = new THREE.MeshPhongMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
    });
    const mainMesh = new THREE.Mesh(mainGeometry, mainMaterial);
    group.add(mainMesh);
    
    const edges = new THREE.EdgesGeometry(mainGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(edges, edgeMaterial);
    group.add(wireframe);
    
    const detailCount = Math.min(Math.floor((fileSize || 32768) / 15000), 8);
    for (let i = 0; i < detailCount; i++) {
        const detailSize = 0.15 * baseSize;
        const detailGeometry = new THREE.CylinderGeometry(detailSize * 0.4, detailSize * 0.4, detailSize, 8);
        const detailMaterial = new THREE.MeshPhongMaterial({
            color: 0xffa500,
            transparent: true,
            opacity: 0.75
        });
        const detailMesh = new THREE.Mesh(detailGeometry, detailMaterial);
        const angle = (i / detailCount) * Math.PI * 2;
        const radius = baseSize * 0.65;
        detailMesh.position.set(
            Math.cos(angle) * radius,
            (Math.sin(angle * 2) - 0.5) * baseSize * 0.3,
            Math.sin(angle) * radius * 0.6
        );
        detailMesh.rotation.z = angle;
        group.add(detailMesh);
    }
    
    popupModel = group;
    popupScene.add(popupModel);
    
    const viewDistance = baseSize * 0.3;
    popupCamera.position.set(viewDistance * 0.7, viewDistance * 0.5, viewDistance);
    popupCamera.lookAt(0, 0, 0);
    popupControls.target.set(0, 0, 0);
    popupControls.update();
}

// Animation for popup
function popupAnimate() {
    popupAnimationId = requestAnimationFrame(popupAnimate);
    if (popupIsRotating && popupModel) {
        popupModel.rotation.y += 0.01;
    }
    popupControls.update();
    popupRenderer.render(popupScene, popupCamera);
}

// Setup popup controls
function setupPopupControls() {
    const rotateBtn = document.getElementById('popup-rotate-btn');
    const resetBtn = document.getElementById('popup-reset-btn');
    const zoomInBtn = document.getElementById('popup-zoom-in-btn');
    const zoomOutBtn = document.getElementById('popup-zoom-out-btn');
    
    if (rotateBtn) {
        rotateBtn.addEventListener('click', function() {
            popupIsRotating = !popupIsRotating;
            this.style.background = popupIsRotating ? '#2563eb' : 'white';
            this.style.color = popupIsRotating ? 'white' : '#374151';
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            const viewDistance = 5;
            popupCamera.position.set(viewDistance * 0.7, viewDistance * 0.5, viewDistance);
            popupControls.target.set(0, 0, 0);
            popupControls.update();
        });
    }
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => popupCamera.position.multiplyScalar(0.9));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => popupCamera.position.multiplyScalar(1.1));
}
