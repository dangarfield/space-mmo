if (!Detector.webgl) Detector.addGetWebGLMessage();
var container, stats;
var camera, controls, scene, renderer;
var cross;
var positions, alphas, particles, _particleGeom;
var nodes = [],
    links = [],
    linksVectors = [];

var starGeo = new THREE.SphereBufferGeometry(5, 32, 32);
var starMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shading: THREE.FlatShading
});
var bigFactor = 1;
var starCount = 250 * bigFactor;
var standardDistance = 10000000 * bigFactor;
var starPosArray = new Float32Array(starCount * 3);
var kdtree;

initPlane();
initStars();
initStats();
initCamera();
animate();

function getNodeFromVector(v1) {
    // console.log("Get node - " + v1.x)
    // console.log(nodes);
    var filtered = nodes.filter(function (v2) {
        return parseFloat(v2.x).toFixed(1) == v1.x.toFixed(1);
    });
    // console.log(filtered);
    return filtered[0];
}

function initPlane() {

}

function normallyDistributedRandom() {
    var rnd = ((Math.random() + Math.random()) / 2);

    //console.log(rnd);
    return rnd;
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

function generateStarPositions() {
    for (var i = 0; i < starCount; i++) {
        var x = ((normallyDistributedRandom() - 0.5) * 1200 * bigFactor).toFixed(1);
        var y = ((normallyDistributedRandom() - 0.5) * 150 * bigFactor).toFixed(1);
        var z = ((normallyDistributedRandom() - 0.5) * 1200 * bigFactor).toFixed(1);
        var vector = new THREE.Vector3(x, y, z);
        var node = {
            name: i,
            vector: vector,
            x: x,
            y: y,
            z: z,
            cluster: false,
            visited: false
        };
        nodes.push(node);
        starPosArray[i * 3 + 0] = x;
        starPosArray[i * 3 + 1] = y;
        starPosArray[i * 3 + 2] = z;
    }
}

function drawStars() {
    for (var i in nodes) {
        var node = nodes[i];
        var pos = node.vector;
        var star = new THREE.Mesh(starGeo, starMat);
        star.position.x = pos.x;
        star.position.y = pos.y;
        star.position.z = pos.z;
        star.updateMatrix();
        star.matrixAutoUpdate = false;
        scene.add(star);
    }
}



function generateInitialLinks() {
    kdtree = new THREE.TypedArrayUtils.Kdtree(starPosArray, function (a, b) {
        return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
    }, 3);

    for (var i in nodes) {
        var node = nodes[i];
        var pos = node.vector;
        // console.log(pos);

        var posInRange = kdtree.nearest([pos.x, pos.y, pos.z], 3, standardDistance);
        // console.log(i + " - " + posInRange.length);
        if (posInRange.length < 2) {
            // console.log("NONE");
            //posInRange = kdtree.nearest([pos.x, pos.y, pos.z], 2, standardDistance * standardDistance);
        }
        for (var j in posInRange) {
            var object = posInRange[j];
            //console.log(object[0].obj)
            var objectPoint = new THREE.Vector3().fromArray(object[0].obj);
            //console.log(posInRange)
            //console.log(" nearest ", objectPoint);
            //console.log(linksVectors)
            linksVectors.push({
                source: pos,
                target: objectPoint
            });

            var targetNode = getNodeFromVector(objectPoint);

            links.push({
                source: parseInt(i),
                target: targetNode.name
            });

        }
        // console.log(links);
    }
}

function drawLinks(linksVectors) {
    //console.log(linksVectors)
    for (var i in linksVectors) {
        var linksVector = linksVectors[i];
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


    generateStarPositions();
    drawStars();
    generateInitialLinks(kdtree);
    // console.log(linksVectors)
    drawLinks(linksVectors);

    group(links);

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
    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

}

function initStats() {
    stats = new Stats();
    container.appendChild(stats.dom);
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.x = 200;
    camera.position.y = 700;
    camera.position.z = 1100;

    controls = new THREE.OrbitControls(camera);

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

    render();
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
    controls.update();
}

function render() {
    renderer.render(scene, camera);
    stats.update();
}

function group(pairs) {
    // Converts an edgelist to an adjacency list representation
    // In this program, we use a dictionary as an adjacency list,
    // where each key is a vertex, and each value is a list of all
    // vertices adjacent to that vertex
    var convert_edgelist_to_adjlist = function (edgelist) {
        var adjlist = {};
        var i, len, pair, u, v;
        for (i = 0, len = edgelist.length; i < len; i += 1) {
            pair = edgelist[i];
            u = pair[0];
            v = pair[1];
            if (adjlist[u]) {
                // append vertex v to edgelist of vertex u
                adjlist[u].push(v);
            } else {
                // vertex u is not in adjlist, create new adjacency list for it
                adjlist[u] = [v];
            }
            if (adjlist[v]) {
                adjlist[v].push(u);
            } else {
                adjlist[v] = [u];
            }
        }
        return adjlist;
    };

    // Breadth First Search using adjacency list
    var bfs = function (v, adjlist, visited) {
        var q = [];
        var current_group = [];
        var i, len, adjV, nextVertex;
        q.push(v);
        visited[v] = true;
        while (q.length > 0) {
            v = q.shift();
            current_group.push(v);
            // Go through adjacency list of vertex v, and push any unvisited
            // vertex onto the queue.
            // This is more efficient than our earlier approach of going
            // through an edge list.
            adjV = adjlist[v];
            for (i = 0, len = adjV.length; i < len; i += 1) {
                nextVertex = adjV[i];
                if (!visited[nextVertex]) {
                    q.push(nextVertex);
                    visited[nextVertex] = true;
                }
            }
        }
        return current_group;
    };

    // var pairs = [
    //     ["2", "5"],
    //     ["3", "6"],
    //     ["4", "5"],
    //     ["7", "9"]
    // ];
    var pairs = [];

    for (var i in links) {
        var link = links[i];
        var pair = [];
        pair.push(parseInt(link.source));
        pair.push(parseInt(link.target));
        pairs.push(pair);
    }

    var groups = [];
    var visited = {};
    var v;

    // this should look like:
    // {
    //   "a2": ["a5"],
    //   "a3": ["a6"],
    //   "a4": ["a5"],
    //   "a5": ["a2", "a4"],
    //   "a6": ["a3"],
    //   "a7": ["a9"],
    //   "a9": ["a7"]
    // }
    console.log("START GROUPS")
    console.log(pairs);
    var adjlist = convert_edgelist_to_adjlist(pairs);

    for (v in adjlist) {
        if (adjlist.hasOwnProperty(v) && !visited[v]) {
            groups.push(bfs(v, adjlist, visited));
        }
    }

    console.log(groups);
}