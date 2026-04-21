function* runHeldKarp(system) {
    const n = system.planets.length;
    // Map of path lengths: dp[visited_mask][last_city]
    const dp = new Map();
    // To reconstruct path: parent[visited_mask][last_city]
    const parent = new Map();

    // Helper to generate key for maps
    function getKey(mask, city) {
        return `${mask}-${city}`;
    }

    // Initialize DP with distances from city 0 to all other cities
    for (let i = 1; i < n; i++) {
        let mask = (1 << 0) | (1 << i); // visited 0 and i
        const key = getKey(mask, i);
        const dist = system.getDistance(0, i);
        dp.set(key, dist);
        parent.set(key, 0);

        // Yield initial subset fills
        yield {
            currentPath: [0, i],
            activeNodes: [0, i],
            currentCost: dist, // partial path cost
            bestCost: Infinity
        };
    }

    // Iterate subsets of increasing size
    // Size is from 3 to N
    for (let size = 3; size <= n; size++) {
        // Bit Hacks to generate all subsets (masks) of given size having 1st bit (city 0) set
        // A simple way to generate subsets of size k from n is using a generator or simple loop
        function* getSubsets(setSize) {
            // max mask value is (1<<n)-1
            for (let i = 1; i < (1 << n); i++) {
                if ((i & 1) !== 1) continue; // must include city 0
                // Count set bits
                let c = 0;
                for (let b = 0; b < n; b++) {
                    if ((i & (1 << b)) !== 0) c++;
                }
                if (c === setSize) yield i;
            }
        }

        for (let mask of getSubsets(size)) {
            // For each city in the subset (except 0)
            for (let j = 1; j < n; j++) {
                if ((mask & (1 << j)) === 0) continue; // j not in mask

                // We want to find dp[mask][j]
                let minDist = Infinity;
                let bestPrev = -1;

                // The mask without j
                let prevMask = mask ^ (1 << j);

                // Try all valid previous cities
                for (let k = 1; k < n; k++) {
                    if (k === j || (prevMask & (1 << k)) === 0) continue; // k not valid previous

                    let prevDist = dp.get(getKey(prevMask, k));
                    if (prevDist === undefined) continue;
                    
                    let candDist = prevDist + system.getDistance(k, j);
                    if (candDist < minDist) {
                        minDist = candDist;
                        bestPrev = k;
                    }
                }

                if (minDist !== Infinity) {
                    dp.set(getKey(mask, j), minDist);
                    parent.set(getKey(mask, j), bestPrev);

                    // Reconstruct path for visualizer
                    let tempPath = [j];
                    let t_mask = mask;
                    let curr = j;
                    while (curr !== 0) {
                        let prev = parent.get(getKey(t_mask, curr));
                        tempPath.unshift(prev);
                        t_mask = t_mask ^ (1 << curr);
                        curr = prev;
                    }

                    // Yield Current Status
                    let activeArr = [];
                    for(let b=0; b<n; b++){ if((mask & (1<<b)) !== 0) activeArr.push(b); }
                    yield {
                        currentPath: tempPath,
                        activeNodes: activeArr, // The Subset we are evaluating
                        currentCost: minDist,
                        bestCost: Infinity
                    };
                }
            }
        }
    }

    // Connect back to 0
    let finalMask = (1 << n) - 1;
    let optDist = Infinity;
    let endCity = -1;

    for (let i = 1; i < n; i++) {
        let dist = dp.get(getKey(finalMask, i)) + system.getDistance(i, 0);
        if (dist < optDist) {
            optDist = dist;
            endCity = i;
        }
    }

    // Reconstruct optimal path
    let optPath = [0]; // We will push back to it backwards
    let t_mask = finalMask;
    let curr = endCity;
    while(curr !== 0) {
        optPath.unshift(curr);
        let prev = parent.get(getKey(t_mask, curr));
        t_mask = t_mask ^ (1 << curr);
        curr = prev;
    }
    optPath.unshift(0);
    optPath.push(0); // return to start

    // Final Yield
    yield {
        currentPath: [],
        bestPath: optPath,
        bestCost: optDist,
        currentCost: optDist
    };
}
