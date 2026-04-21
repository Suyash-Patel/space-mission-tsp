function* runBranchAndBound(system) {
    const n = system.planets.length;
    let bestCost = Infinity;
    let bestPath = [];
    let nodesExplored = 0;
    let nodesPruned = 0;

    // Quick greedy path to initialize a somewhat tight bound
    let initPath = [0];
    let initVisited = new Set([0]);
    let initCost = 0;
    let curr = 0;
    while(initVisited.size < n) {
        let nDist = Infinity;
        let nxt = -1;
        for(let j=0; j<n; j++) {
            if(!initVisited.has(j)) {
                let d = system.getDistance(curr, j);
                if(d < nDist) { nDist = d; nxt = j; }
            }
        }
        initVisited.add(nxt);
        initPath.push(nxt);
        initCost += nDist;
        curr = nxt;
    }
    initCost += system.getDistance(curr, 0);
    initPath.push(0);
    
    bestCost = initCost;
    bestPath = [...initPath];

    // Priority Queue class for Best-First Search
    class MinHeap {
        constructor() { this.heap = []; }
        push(val) {
            this.heap.push(val);
            this.bubbleUp();
        }
        pop() {
            if (this.heap.length === 1) return this.heap.pop();
            const min = this.heap[0];
            this.heap[0] = this.heap.pop();
            this.sinkDown(0);
            return min;
        }
        bubbleUp() {
            let idx = this.heap.length - 1;
            const el = this.heap[idx];
            while(idx > 0) {
                let pIdx = Math.floor((idx - 1) / 2);
                let p = this.heap[pIdx];
                if (el.bound >= p.bound) break;
                this.heap[pIdx] = el;
                this.heap[idx] = p;
                idx = pIdx;
            }
        }
        sinkDown(idx) {
            const length = this.heap.length;
            const el = this.heap[idx];
            while(true) {
                let leftIdx = 2 * idx + 1;
                let rightIdx = 2 * idx + 2;
                let left, right;
                let swap = null;

                if (leftIdx < length) {
                    left = this.heap[leftIdx];
                    if (left.bound < el.bound) swap = leftIdx;
                }
                if (rightIdx < length) {
                    right = this.heap[rightIdx];
                    if (
                        (swap === null && right.bound < el.bound) ||
                        (swap !== null && right.bound < left.bound)
                    ) {
                        swap = rightIdx;
                    }
                }
                if (swap === null) break;
                this.heap[idx] = this.heap[swap];
                this.heap[swap] = el;
                idx = swap;
            }
        }
        isEmpty() { return this.heap.length === 0; }
    }

    // Calculates simple 1-tree lower bound
    function calculateBound(path) {
        let bound = 0;
        let pLen = path.length;
        
        let pathVisited = Array(n).fill(false);
        for(let i=0; i<pLen; i++) pathVisited[path[i]] = true;

        // Path cost
        for(let i=0; i<pLen-1; i++) {
            bound += system.getDistance(path[i], path[i+1]);
        }

        // Min edges from ends of the path
        let lastNode = path[pLen-1];
        let startNode = path[0];
        
        let minEdgeLast = Infinity;
        let minEdgeStart = Infinity;

        let unvisitedCount = 0;

        for(let i=0; i<n; i++) {
            if(!pathVisited[i]) {
                unvisitedCount++;
                minEdgeLast = Math.min(minEdgeLast, system.getDistance(lastNode, i));
                minEdgeStart = Math.min(minEdgeStart, system.getDistance(startNode, i));
            }
        }
        
        if (unvisitedCount === 0) return bound + system.getDistance(lastNode, startNode);

        bound += (minEdgeLast + minEdgeStart) / 2;

        // Min edges connecting unvisited vertices
        let unvisitedBound = 0;
        for (let i=0; i<n; i++) {
            if (!pathVisited[i]) {
                let m1 = Infinity, m2 = Infinity;
                for (let j=0; j<n; j++) {
                    if (i !== j && !pathVisited[j]) {
                        let d = system.getDistance(i, j);
                        if(d < m1) { m2 = m1; m1 = d; }
                        else if(d < m2) { m2 = d; }
                    }
                }
                // If only 1 unvisited node, m2 could be Infinity, connect back to path
                if (m1 !== Infinity) unvisitedBound += m1;
                if (m2 !== Infinity) unvisitedBound += m2;
            }
        }

        return bound + (unvisitedBound / 2);
    }

    let pq = new MinHeap();
    for (let i=1; i<n; i++) {
        let p = [0, i];
        let cost = system.getDistance(0, i);
        let b = calculateBound(p);
        pq.push({ path: p, cost: cost, bound: b });
    }

    while (!pq.isEmpty()) {
        let node = pq.pop();
        nodesExplored++;

        if (node.bound >= bestCost) {
            nodesPruned++;
            continue;
        }

        yield {
            currentPath: node.path,
            currentCost: node.cost,
            bestCost: bestCost,
            bestPath: bestPath,
            nodesExplored: nodesExplored,
            nodesPruned: nodesPruned
        };

        if (node.path.length === n) {
            // Can complete
            let returnCost = system.getDistance(node.path[node.path.length-1], 0);
            let totalCost = node.cost + returnCost;
            if (totalCost < bestCost) {
                bestCost = totalCost;
                bestPath = [...node.path, 0];
            }
        } else {
            let lastCity = node.path[node.path.length-1];
            let childPushed = false;
            for (let i=1; i<n; i++) {
                if (!node.path.includes(i)) {
                    let childPath = [...node.path, i];
                    let childCost = node.cost + system.getDistance(lastCity, i);
                    let childBound = calculateBound(childPath);
                    
                    if (childBound < bestCost) {
                        pq.push({ path: childPath, cost: childCost, bound: childBound });
                        childPushed = true;
                    } else {
                        nodesPruned++;
                    }
                }
            }
            if(!childPushed) {
                // Leaf pruned
            }
        }
    }

    // Final
    yield {
        currentPath: [],
        bestPath: bestPath,
        bestCost: bestCost,
        currentCost: bestCost,
        nodesExplored: nodesExplored,
        nodesPruned: nodesPruned
    };
}
