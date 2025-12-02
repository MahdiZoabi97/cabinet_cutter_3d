// Simple 3D cabinet viewer using Three.js (custom mouse controls, no OrbitControls)

let scene, camera, renderer;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let rotation = { azimuth: Math.PI / 4, elevation: Math.PI / 6, radius: 220 };
let lookTarget = new THREE.Vector3(0, 60, 0);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let doorGroups = [];

function initScene() {
    const container = document.getElementById("canvas-container");

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000);
    updateCameraPosition();

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(100, 200, 100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // ground
    const grid = new THREE.GridHelper(500, 50, 0x4b5563, 0x1f2937);
    scene.add(grid);

    window.addEventListener("resize", onWindowResize);

    // basic mouse controls: drag to orbit, wheel to zoom
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("wheel", onMouseWheel, { passive: false });

    // click to toggle doors
    renderer.domElement.addEventListener("click", onClickDoor);

    animate();
}

function updateCameraPosition() {
    const r = rotation.radius;
    const theta = rotation.azimuth;
    const phi = rotation.elevation;

    const x = r * Math.cos(phi) * Math.sin(theta);
    const y = r * Math.sin(phi);
    const z = r * Math.cos(phi) * Math.cos(theta);

    camera.position.set(x, y, z);
    camera.lookAt(lookTarget);
}

function onWindowResize() {
    const container = document.getElementById("canvas-container");
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function onMouseDown(event) {
    isDragging = true;
    prevMouse.x = event.clientX;
    prevMouse.y = event.clientY;
}

function onMouseMove(event) {
    if (!isDragging) return;
    const dx = event.clientX - prevMouse.x;
    const dy = event.clientY - prevMouse.y;
    prevMouse.x = event.clientX;
    prevMouse.y = event.clientY;

    const rotSpeed = 0.005;
    rotation.azimuth -= dx * rotSpeed;
    rotation.elevation -= dy * rotSpeed;

    // clamp elevation to avoid flipping
    const maxEl = Math.PI / 2 - 0.1;
    const minEl = -maxEl;
    if (rotation.elevation > maxEl) rotation.elevation = maxEl;
    if (rotation.elevation < minEl) rotation.elevation = minEl;

    updateCameraPosition();
}

function onMouseUp() {
    isDragging = false;
}

function onMouseWheel(event) {
    event.preventDefault();
    const zoomSpeed = 5;
    rotation.radius += event.deltaY * 0.1;
    if (rotation.radius < 50) rotation.radius = 50;
    if (rotation.radius > 800) rotation.radius = 800;
    updateCameraPosition();
}

function clearCabinet() {
    const toRemove = [];
    scene.traverse((obj) => {
        if (obj.userData && obj.userData.isCabinetPart) {
            toRemove.push(obj);
        }
    });
    toRemove.forEach((obj) => scene.remove(obj));
    doorGroups = [];
}

function buildSingleCabinet(width, height, depth, thickness, shelves, doors, offsetX) {
    // warm wood for carcass
    const material = new THREE.MeshStandardMaterial({
        color: 0xcaa472,   // oak-like
        roughness: 0.6,
        metalness: 0.05,
    });

    // slightly darker shelves
    const shelfMaterial = new THREE.MeshStandardMaterial({
        color: 0xa8793d,
        roughness: 0.6,
        metalness: 0.05,
    });

    // lacquered bright white doors
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.18,
        metalness: 0.2,
    });

    // dark back (MDF or wall)
    const backMaterial = new THREE.MeshStandardMaterial({
        color: 0x303030,
        roughness: 0.8,
        metalness: 0.02,
    });

    // use cm as units, center cabinet on origin + offsetX
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;

    // sides
    const sideGeom = new THREE.BoxGeometry(thickness, height, depth);

    const left = new THREE.Mesh(sideGeom, material);
    left.position.set(offsetX - halfW + thickness / 2, halfH, 0);
    left.userData.isCabinetPart = true;
    scene.add(left);

    const right = new THREE.Mesh(sideGeom, material);
    right.position.set(offsetX + halfW - thickness / 2, halfH, 0);
    right.userData.isCabinetPart = true;
    scene.add(right);

    // top & bottom
    const innerWidth = width - 2 * thickness;
    const tbGeom = new THREE.BoxGeometry(innerWidth, thickness, depth);

    const top = new THREE.Mesh(tbGeom, material);
    top.position.set(offsetX, height - thickness / 2, 0);
    top.userData.isCabinetPart = true;
    scene.add(top);

    const bottom = new THREE.Mesh(tbGeom, material);
    bottom.position.set(offsetX, thickness / 2, 0);
    bottom.userData.isCabinetPart = true;
    scene.add(bottom);

    // back panel (full width x height, thin depth)
    const backThickness = Math.max(thickness * 0.5, 0.5);
    const backGeom = new THREE.BoxGeometry(width, height, backThickness);
    const back = new THREE.Mesh(backGeom, backMaterial);
    back.position.set(offsetX, halfH, -halfD + backThickness / 2);
    back.userData.isCabinetPart = true;
    scene.add(back);

    // shelves (evenly spaced between bottom and top, recessed so they are not visible from the front when doors are closed)
    if (shelves > 0) {
        const shelfDepth = depth - 2 * thickness;
        const shelfGeom = new THREE.BoxGeometry(innerWidth, thickness, shelfDepth);
        const usableHeight = height - 2 * thickness;
        const step = usableHeight / (shelves + 1);

        for (let i = 1; i <= shelves; i++) {
            const shelf = new THREE.Mesh(shelfGeom, shelfMaterial);
            const y = thickness + step * i;
            // move shelves slightly to the back so they sit behind the door plane
            shelf.position.set(offsetX, y, -thickness);
            shelf.userData.isCabinetPart = true;
            scene.add(shelf);
        }
    }

    // doors (front)
    const doorThickness = Math.max(thickness * 0.7, 0.7);
    const doorHeight = height - 2 * thickness * 0.7;
    const doorY = thickness + doorHeight / 2;
    const frontZ = halfD - doorThickness / 2;

    if (doors === 1) {
        // single full-width door, hinged on the left
        const geom = new THREE.BoxGeometry(width, doorHeight, doorThickness);
        const door = new THREE.Mesh(geom, doorMaterial);
        door.position.set(width / 2, 0, 0);

        // simple vertical handle on the right side of the door
        const handleGeom = new THREE.BoxGeometry(1.0, doorHeight * 0.2, doorThickness * 0.6);
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0xd4d4d4,
            roughness: 0.3,
            metalness: 0.4,
        });
        const handle = new THREE.Mesh(handleGeom, handleMat);
        handle.position.set(width * 0.45, 0, doorThickness / 2 + (doorThickness * 0.3));
        door.add(handle);

        const group = new THREE.Group();
        group.position.set(offsetX - halfW, doorY, frontZ);
        group.userData.isCabinetPart = true;
        group.userData.isDoor = true;
        group.userData.open = false;
        group.userData.targetAngle = 0;
        group.userData.openDir = -1; // rotate outwards towards viewer
        group.add(door);
        scene.add(group);
        doorGroups.push(group);
    } else if (doors === 2) {
        // two half-width doors with a small gap
        const gap = 0.3;
        const leafWidth = width / 2 - gap;
        const geom = new THREE.BoxGeometry(leafWidth, doorHeight, doorThickness);

        // left door, hinged on far left
        const leftMesh = new THREE.Mesh(geom, doorMaterial);
        leftMesh.position.set(leafWidth / 2, 0, 0);
        // handle near inner edge, front face
        const lhGeom = new THREE.BoxGeometry(1.0, doorHeight * 0.2, doorThickness * 0.6);
        const lh = new THREE.Mesh(lhGeom, new THREE.MeshStandardMaterial({
            color: 0xd4d4d4,
            roughness: 0.3,
            metalness: 0.4,
        }));
        lh.position.set(leafWidth * 0.4, 0, doorThickness / 2 + (doorThickness * 0.3));
        leftMesh.add(lh);

        const leftGroup = new THREE.Group();
        leftGroup.position.set(offsetX - halfW, doorY, frontZ);
        leftGroup.userData.isCabinetPart = true;
        leftGroup.userData.isDoor = true;
        leftGroup.userData.open = false;
        leftGroup.userData.targetAngle = 0;
        leftGroup.userData.openDir = -1; // open outwards towards viewer
        leftGroup.add(leftMesh);
        scene.add(leftGroup);
        doorGroups.push(leftGroup);

        // right door, hinged on far right
        const rightMesh = new THREE.Mesh(geom, doorMaterial);
        rightMesh.position.set(-leafWidth / 2, 0, 0);
        const rhGeom = new THREE.BoxGeometry(1.0, doorHeight * 0.2, doorThickness * 0.6);
        const rh = new THREE.Mesh(rhGeom, new THREE.MeshStandardMaterial({
            color: 0xd4d4d4,
            roughness: 0.3,
            metalness: 0.4,
        }));
        rh.position.set(-leafWidth * 0.4, 0, doorThickness / 2 + (doorThickness * 0.3));
        rightMesh.add(rh);

        const rightGroup = new THREE.Group();
        rightGroup.position.set(offsetX + halfW, doorY, frontZ);
        rightGroup.userData.isCabinetPart = true;
        rightGroup.userData.isDoor = true;
        rightGroup.userData.open = false;
        rightGroup.userData.targetAngle = 0;
        rightGroup.userData.openDir = 1; // open outwards towards viewer
        rightGroup.add(rightMesh);
        scene.add(rightGroup);
        doorGroups.push(rightGroup);
    }
}

function buildCabinets(width, height, depth, thickness, shelves, cabCount) {
    // kept for backward compatibility if needed
    clearCabinet();
    const configs = [];
    for (let i = 0; i < cabCount; i++) {
        configs.push({ width, height, depth, shelves });
    }
    buildCabinetsFromConfigs(configs, thickness);
}

function buildCabinetsFromConfigs(configs, thickness) {
    clearCabinet();
    if (!configs.length) return;

    const gap = 10; // cm between cabinets
    let xCursor = 0;
    let firstCenterX = null;
    let lastCenterX = null;
    let maxHeight = 0;

    configs.forEach((cfg, idx) => {
        const w = cfg.width;
        const h = cfg.height;
        const d = cfg.depth;
        const shelves = cfg.shelves;

        const centerX = xCursor + w / 2;
        const doors = cfg.doors || 0;
        buildSingleCabinet(w, h, d, thickness, shelves, doors, centerX);

        if (firstCenterX === null) firstCenterX = centerX;
        lastCenterX = centerX;
        if (h > maxHeight) maxHeight = h;

        xCursor += w + gap;
    });

    // center camera on the whole row
    const midX = (firstCenterX + lastCenterX) / 2;
    lookTarget.set(midX, maxHeight / 2, 0);
    updateCameraPosition();
}

function animate() {
    requestAnimationFrame(animate);

    // smooth door animation
    const speed = 0.15;
    const maxOpen = Math.PI / 2; // 90 degrees
    doorGroups.forEach((g) => {
        const target = g.userData.targetAngle;
        if (Math.abs(g.rotation.y - target) > 0.001) {
            g.rotation.y += (target - g.rotation.y) * speed;
        } else {
            g.rotation.y = target;
        }
    });

    renderer.render(scene, camera);
}

function onClickDoor(event) {
    if (!doorGroups.length) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(doorGroups, true);
    if (!intersects.length) return;

    let obj = intersects[0].object;
    while (obj && !obj.userData.isDoor) {
        obj = obj.parent;
    }
    if (!obj || !obj.userData.isDoor) return;

    // toggle door open/close
    const openAngle = obj.userData.openDir * (Math.PI / 2); // 90 degrees
    if (obj.userData.open) {
        obj.userData.open = false;
        obj.userData.targetAngle = 0;
    } else {
        obj.userData.open = true;
        obj.userData.targetAngle = openAngle;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initScene();

    const form = document.getElementById("cabinet-form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const thickness = parseFloat(document.getElementById("thickness").value) || 0;
        if (thickness <= 0) {
            alert("Thickness must be a positive number.");
            return;
        }

        const cards = Array.from(document.querySelectorAll(".cab-card"));
        if (!cards.length) {
            alert("Please add at least one cabinet.");
            return;
        }

        const configs = [];
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const w = parseFloat(card.querySelector(".cab-width").value);
            const h = parseFloat(card.querySelector(".cab-height").value);
            const d = parseFloat(card.querySelector(".cab-depth").value);
            const shelves = parseInt(card.querySelector(".cab-shelves").value, 10);
            const doors = parseInt(card.querySelector(".cab-doors").value, 10);

            if (!w || !h || !d || isNaN(shelves) || isNaN(doors)) {
                alert(`Cabinet ${i + 1} has invalid numbers.`);
                return;
            }
            if (w <= 0 || h <= 0 || d <= 0) {
                alert(`Cabinet ${i + 1}: dimensions must be positive.`);
                return;
            }
            if (thickness * 2 >= w) {
                alert(`Cabinet ${i + 1}: thickness is too big compared to width.`);
                return;
            }

            configs.push({
                width: w,
                height: h,
                depth: d,
                shelves: Math.max(0, shelves),
                doors: Math.max(0, Math.min(2, doors)),
            });
        }

        buildCabinetsFromConfigs(configs, thickness);
    });

    function createCabCard(index, preset) {
        const card = document.createElement("div");
        card.className = "cab-card";

        const header = document.createElement("div");
        header.className = "cab-card-header";
        const title = document.createElement("span");
        title.textContent = `Cabinet ${index}`;
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", () => {
            card.remove();
            renumberCards();
        });
        header.appendChild(title);
        header.appendChild(removeBtn);
        card.appendChild(header);

        const makeField = (labelText, className, value, step = "0.1") => {
            const wrapper = document.createElement("div");
            const label = document.createElement("label");
            label.textContent = labelText;
            const input = document.createElement("input");
            input.type = "number";
            input.className = className;
            input.value = value;
            input.step = step;
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            return wrapper;
        };

        card.appendChild(makeField("Width (cm)", "cab-width", preset.width));
        card.appendChild(makeField("Height (cm)", "cab-height", preset.height));
        card.appendChild(makeField("Depth (cm)", "cab-depth", preset.depth));
        card.appendChild(makeField("Shelves", "cab-shelves", preset.shelves, "1"));

        // doors select (None / 1 / 2)
        const doorsWrapper = document.createElement("div");
        const doorsLabel = document.createElement("label");
        doorsLabel.textContent = "Doors";
        const doorsSelect = document.createElement("select");
        doorsSelect.className = "cab-doors";
        [
            { value: 0, label: "None" },
            { value: 1, label: "1 door" },
            { value: 2, label: "2 doors" },
        ].forEach((opt) => {
            const o = document.createElement("option");
            o.value = String(opt.value);
            o.textContent = opt.label;
            if (opt.value === (preset.doors ?? 2)) o.selected = true;
            doorsSelect.appendChild(o);
        });
        doorsWrapper.appendChild(doorsLabel);
        doorsWrapper.appendChild(doorsSelect);
        card.appendChild(doorsWrapper);

        return card;
    }

    function renumberCards() {
        const cards = Array.from(document.querySelectorAll(".cab-card"));
        cards.forEach((c, i) => {
            const span = c.querySelector(".cab-card-header span");
            if (span) span.textContent = `Cabinet ${i + 1}`;
        });
    }

    const cabCardsContainer = document.getElementById("cabCards");
    const addCabBtn = document.getElementById("addCab");
    addCabBtn.addEventListener("click", () => {
        const count = document.querySelectorAll(".cab-card").length;
        const preset = { width: 60, height: 80, depth: 35, shelves: 2, doors: 2 };
        const card = createCabCard(count + 1, preset);
        cabCardsContainer.appendChild(card);
    });

    // initial two example cabinets
    const presets = [
        { width: 60, height: 80, depth: 35, shelves: 2, doors: 2 },
        { width: 40, height: 80, depth: 35, shelves: 1, doors: 1 },
    ];
    presets.forEach((p, idx) => {
        const card = createCabCard(idx + 1, p);
        cabCardsContainer.appendChild(card);
    });
    buildCabinetsFromConfigs(presets, 1.8);
});


