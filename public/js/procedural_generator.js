var bigFactor = 1;
var starCount = 250 * bigFactor;
var standardDistance = 1000000 * bigFactor;
var linksPerNode = 2;

var kdtree;

var randomSeed = 0.1; // Between 1 - 999999999999999
//var randomSeed = Math.random();

var starPosArray = new Float32Array(starCount * 3),
    links = [],
    linksVectors = [];

function seededRandom() {
    var x = Math.sin(randomSeed++) * 10000;
    return x - Math.floor(x);
}

function normallyDistributedRandom() {
    var rnd = ((seededRandom() + seededRandom()) / 2);
    //console.log(rnd);
    return rnd;
}

function getNodeFromVector(nodes, v1) {
    // console.log("Get node - " + v1.x)
    // console.log(nodes);
    var filtered = nodes.filter(function (v2) {
        return parseFloat(v2.x).toFixed(1) == v1.x.toFixed(1) && parseFloat(v2.y).toFixed(1) == v1.y.toFixed(1) && parseFloat(v2.z).toFixed(1) == v1.z.toFixed(1);
    });
    // console.log(filtered);
    return filtered[0];
}

function generateStarData() {

    var nodes = generateStarPositions(starPosArray);
    generateInitialLinks(starPosArray, nodes, links, linksVectors);
    connectDisconnectedGraphs(nodes, links, linksVectors);

    var data = {
        nodes: nodes,
        links: links,
        linksVectors: linksVectors
    };
    console.log(data);
    return data;
}

function generateStarPositions(starPosArray) {
    var nodes = [];

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
            z: z
        };
        nodes.push(node);
        starPosArray[i * 3 + 0] = x;
        starPosArray[i * 3 + 1] = y;
        starPosArray[i * 3 + 2] = z;
    }
    return nodes;
}


function generateInitialLinks(starPosArray, nodes) {
    kdtree = new THREE.TypedArrayUtils.Kdtree(starPosArray, function (a, b) {
        return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2);
    }, 3);

    for (var i in nodes) {
        var node = nodes[i];
        var sourcePos = node.vector;
        // console.log(pos);

        var posInRange = kdtree.nearest([sourcePos.x, sourcePos.y, sourcePos.z], linksPerNode + 1, standardDistance);
        // console.log(i + " - " + posInRange.length);
        if (posInRange.length < 2) {
            // console.log("NONE");
            //posInRange = kdtree.nearest([pos.x, pos.y, pos.z], 2, standardDistance * standardDistance);
        }
        for (var j in posInRange) {
            var object = posInRange[j];
            //console.log(object[0].obj)
            var targetPos = new THREE.Vector3().fromArray(object[0].obj);
            //console.log(posInRange)
            //console.log(" nearest ", objectPoint);
            //console.log(linksVectors)

            var targetNode = getNodeFromVector(nodes, targetPos);

            var sourceName = parseInt(i);
            var targetName = parseInt(targetNode.name);

            if (targetName < sourceName) {
                var tempTargetName = targetName;
                var tempSourceName = sourceName;
                targetName = tempSourceName;
                sourceName = tempTargetName;

                var tempTargetPos = targetPos;
                var tempSourcePos = sourcePos;
                targetPos = tempSourcePos;
                sourcePos = tempTargetPos;
            }

            if (sourceName != targetName) {

                linksVectors.push({
                    source: sourcePos,
                    target: targetPos
                });

                links.push({
                    source: sourceName,
                    target: targetName
                });
            }


        }
        // console.log(links);
    }
}


function connectDisconnectedGraphs(nodes, links, linksVectors) {
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

    // console.log("Disconnected groups")
    // console.log(pairs);
    var adjlist = convert_edgelist_to_adjlist(pairs);

    for (v in adjlist) {
        if (adjlist.hasOwnProperty(v) && !visited[v]) {
            groups.push(bfs(v, adjlist, visited));
        }
    }

    groups.sort(function (a, b) {
        return a.length - b.length;
    });
    // console.log(groups);

    if (groups.length > 1) {
        // console.log("There are disconnected clusters");
        var disconnectedNodes = [];
        for (var g in groups[0]) {
            disconnectedNodes.push(parseInt(groups[0][g]));
        }

        var potentialLinks = [];
        for (var d in disconnectedNodes) {
            var disconnectedNode = disconnectedNodes[d];
            // console.log(disconnectedNode);
            var sourceNode = nodes[disconnectedNode];
            for (var c = 0; c < starCount; c++) {
                if (disconnectedNodes.indexOf(c) === -1) {
                    var targetNode = nodes[c];

                    //console.log(targetNode);
                    var comparativeDistance = Math.pow(sourceNode.x - targetNode.x, 2) + Math.pow(sourceNode.y - targetNode.y, 2) + Math.pow(sourceNode.z - targetNode.z, 2);
                    potentialLinks.push({
                        source: disconnectedNode,
                        target: c,
                        distance: comparativeDistance
                    });
                    //console.log(comparativeDistance)
                }
            }
        }

        potentialLinks.sort(function (a, b) {
            return a.distance - b.distance;
        });
        // console.log(potentialLinks)

        var sourceName = potentialLinks[0].source > potentialLinks[0].target ? potentialLinks[0].target : potentialLinks[0].source;
        var targetName = potentialLinks[0].source > potentialLinks[0].target ? potentialLinks[0].source : potentialLinks[0].target;
        var sourcePos = nodes[sourceName].vector;
        var targetPos = nodes[targetName].vector;

        // console.log(sourceName + " - " + targetName)
        // console.log(sourcePos, targetPos)

        linksVectors.push({
            source: sourcePos,
            target: targetPos
        });
        links.push({
            source: sourceName,
            target: targetName
        });
        connectDisconnectedGraphs(nodes, links, linksVectors); //Recursive

    } else {
        // console.log("Graph complete");
    }
}