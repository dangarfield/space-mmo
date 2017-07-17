if (!Detector.webgl) Detector.addGetWebGLMessage();
var container, stats, guiController, font;
var camera, controls, scene, renderer;

var starGeo = new THREE.SphereBufferGeometry(5, 32, 32);
var starMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shading: THREE.FlatShading
});

var data; // Main placeholder of data

loadFontAndInit();

function loadFontAndInit() {
    var loader = new THREE.FontLoader();
    loader.load('/js/threejs/fonts/helvetiker_regular.typeface.json', function (loadedFont) {
        font = loadedFont;
        initPlane();
        initCamera();
        initStars();
        initStats();
        setupDatGui();

        animate();
    });
}

function setupDatGui() {
    guiController = {
        focusNode: 1
    };

    var h;
    var gui = new dat.GUI();

    h = gui.add(guiController, "focusNode").name("Focus node").onChange(resetCamera);

    // var customContainer = document.getElementById('my-gui-container');
    // customContainer.appendChild(gui.domElement);
}


function initPlane() {

}




function cylinderMesh(vstart, vend) {

    var HALF_PI = Math.PI * .5;
    var distance = vstart.distanceTo(vend);
    var position = vend.clone().add(vstart).divideScalar(2);

    var material = new THREE.MeshLambertMaterial({
        color: 0x0000ff
    });
    var cylinder = new THREE.CylinderGeometry(10, 10, distance, 10, 10, false);

    var orientation = new THREE.Matrix4(); //a new orientation matrix to offset pivot
    var offsetRotation = new THREE.Matrix4(); //a matrix to fix pivot rotation
    var offsetPosition = new THREE.Matrix4(); //a matrix to fix pivot position
    orientation.lookAt(vstart, vend, new THREE.Vector3(0, 1, 0)); //look at destination
    offsetRotation.makeRotationX(HALF_PI); //rotate 90 degs on X
    orientation.multiply(offsetRotation); //combine orientation with rotation transformations
    cylinder.applyMatrix(orientation)

    var mesh = new THREE.Mesh(cylinder, material);
    mesh.position = position;

    return mesh;
    // var material = new THREE.MeshBasicMaterial({
    //     color: 0x0000ff
    // });

    // var direction = new THREE.Vector3().subVectors(pointY, pointX);
    // var orientation = new THREE.Matrix4();
    // orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
    // orientation.multiply(new THREE.Matrix4(1, 0, 0, 0,
    //     0, 0, 1, 0,
    //     0, -1, 0, 0,
    //     0, 0, 0, 1));
    // var edgeGeometry = new THREE.CylinderGeometry(2, 2, direction.length(), 8, 1);
    // var edge = new THREE.Mesh(edgeGeometry, material);
    // edge.applyMatrix(orientation);
    // // position based on midpoints - there may be a better solution than this
    // edge.position.x = (pointY.x + pointX.x) / 2;
    // edge.position.y = (pointY.y + pointX.y) / 2;
    // edge.position.z = (pointY.z + pointX.z) / 2;
    // return edge;


}


function drawStars() {
    data.nodeLabels = [];
    for (var i in data.nodes) {
        var node = data.nodes[i];
        var pos = node.vector;
        var star = new THREE.Mesh(starGeo, starMat);
        star.position.x = pos.x;
        star.position.y = pos.y;
        star.position.z = pos.z;
        star.updateMatrix();
        star.matrixAutoUpdate = false;
        scene.add(star);

        var text = makeTextSprite("  " + i);
        text.position.setX(pos.x + 10);
        text.position.setY(pos.y + 10);
        text.position.setZ(pos.z + 10);
        //Rotating and lookAt for rendering - Should look at CSS rendering instead really

        text.lookAt(camera.position);
        data.nodeLabels.push(text);
        scene.add(text);
    }
}

function makeTextSprite(message) {
    var geometry = new THREE.TextGeometry(message, {
        font: font,
        size: 10,
        height: 2,
        curveSegments: 2
    });
    geometry.computeBoundingBox();
    var centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    var materials = [
        new THREE.MeshBasicMaterial({
            color: Math.random() * 0x00ff00,
            overdraw: 0.5
        }),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            overdraw: 0.5
        })
    ];
    var mesh = new THREE.Mesh(geometry, materials);
    return mesh;
}



function drawLinks() {
    //console.log(linksVectors)
    for (var i in data.linksVectors) {
        var linksVector = data.linksVectors[i];
        //console.log(linksVector)
        var source = linksVector.source;
        var target = linksVector.target;
        //console.log(source)
        var lineMat = new THREE.LineBasicMaterial({
            color: 0x0000ff,
            linewidth: 50
        });
        var lineGeo = new THREE.Geometry();
        lineGeo.vertices.push(source, target);

        var line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
    }

}

function initStars() {
    // world
    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    // generateStarPositions();
    // generateInitialLinks(kdtree);
    // connectDisconnectedGraphs();
    data = generateStarData();

    drawStars();
    drawLinks();

    // lights
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);
    var light = new THREE.DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);
    var light = new THREE.AmbientLight(0x222222);
    scene.add(light);
    // renderer
    renderer = new THREE.WebGLRenderer({
        antialias: false
    });
    //renderer.setClearColor(scene.fog.color);
    //renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container = document.getElementById('threeCanvas');
    container.appendChild(renderer.domElement);

    var focusNode = data.nodes[0];
    controls.target.set(parseFloat(focusNode.vector.x), parseFloat(focusNode.vector.y), parseFloat(focusNode.vector.z));
    console.log(controls.target)
}

function initStats() {
    stats = new Stats();
    container.appendChild(stats.dom);
}

function resetCamera() {
    console.log(controls.target)
    var focusNodeId = guiController.focusNode;
    var focusNode = data.nodes[focusNodeId];
    // controls = new THREE.OrbitControls(camera, document.getElementById('threeCanvas'));
    controls.target.set(parseFloat(focusNode.vector.x), parseFloat(focusNode.vector.y), parseFloat(focusNode.vector.z));
    // camera.position.x = focusNode.vector.x;
    // camera.position.y = focusNode.vector.y;
    // camera.position.z = focusNode.vector.z;
    // camera.lookAt(focusNode.vector);

    render();
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.x = 200;
    camera.position.y = 700;
    camera.position.z = 1100;

    controls = new THREE.OrbitControls(camera, document.getElementById('threeCanvas'));

    // controls = new THREE.TrackballControls(camera);
    // controls.rotateSpeed = 2.0;
    // controls.zoomSpeed = 1.7;
    // controls.panSpeed = 1.6;
    // controls.noZoom = false;
    // controls.noPan = false;
    // controls.staticMoving = true;
    // controls.dynamicDampingFactor = 0.3;
    // controls.keys = [65, 83, 68];
    controls.addEventListener('change', render);

    window.addEventListener('resize', onWindowResize, false);


}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    render();
}

function animate() {
    requestAnimationFrame(animate);
    render();
    controls.update();
    stats.update();
}

function render() {

    for (var i = 1, l = data.nodeLabels.length; i < l; i++) {
        data.nodeLabels[i].lookAt(camera.position);
        //do something about yaw - Look into a css on canvas based trick
    }
    // var focusNodeId = guiController.focusNode;
    // var focusNode = nodes[focusNodeId];
    // camera.lookAt(focusNode.vector);

    renderer.render(scene, camera);

}