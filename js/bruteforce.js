function* runBruteForce(system) {
    const n = system.planets.length;
    let bestCost = Infinity;
    let bestPath = [];
    let permutationsCount = 0;

    // We only permute 1 to n-1 (since we always start at 0 and end at 0)
    let initialArr = [];
    for(let i=1; i<n; i++) initialArr.push(i);

    // Heaps algorithm generator for permutations
    function* generatePermutations(k, arr) {
        if (k === 1) {
            yield [...arr];
        } else {
            yield* generatePermutations(k - 1, arr);
            for (let i = 0; i < k - 1; i++) {
                if (k % 2 === 0) {
                    let temp = arr[i];
                    arr[i] = arr[k - 1];
                    arr[k - 1] = temp;
                } else {
                    let temp = arr[0];
                    arr[0] = arr[k - 1];
                    arr[k - 1] = temp;
                }
                yield* generatePermutations(k - 1, arr);
            }
        }
    }

    const iter = generatePermutations(initialArr.length, initialArr);
    
    for (let perm of iter) {
        permutationsCount++;
        let path = [0, ...perm, 0];
        let cost = 0;
        
        for (let i = 0; i < path.length - 1; i++) {
            cost += system.getDistance(path[i], path[i+1]);
        }
        
        let pathImproved = false;
        if (cost < bestCost) {
            bestCost = cost;
            bestPath = [...path];
            pathImproved = true;
        }

        // Yield state for visualization
        yield {
            currentPath: path,
            currentCost: cost,
            bestPath: bestPath,
            bestCost: bestCost,
            permutations: permutationsCount
        };
    }
    
    // Final state
    yield {
        currentPath: [], // Clear current to highlight best
        bestPath: bestPath,
        bestCost: bestCost,
        permutations: permutationsCount,
        currentCost: bestCost
    };
}
