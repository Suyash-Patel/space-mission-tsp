function* runNearestNeighbor(system) {
    const n = system.planets.length;
    let visited = new Set([0]);
    let currentPath = [0];
    let currentCost = 0;
    
    let currentPlanet = 0;

    // Yield initial state
    yield {
        currentPath: [...currentPath],
        currentCost: currentCost,
        bestCost: Infinity // heuristic, doesn't really have a 'best vs current' exploring
    };

    while (visited.size < n) {
        let nearestDist = Infinity;
        let nearestPlanet = -1;

        for (let j = 0; j < n; j++) {
            if (!visited.has(j)) {
                let dist = system.getDistance(currentPlanet, j);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestPlanet = j;
                }
                
                // Form a temporary path to visualize the "looking at this planet" step
                yield {
                    currentPath: [...currentPath, j],
                    currentCost: currentCost + dist,
                    activeNodes: [j] // Highlight the one being evaluated
                };
            }
        }

        // Make the choice
        visited.add(nearestPlanet);
        currentPath.push(nearestPlanet);
        currentCost += nearestDist;
        currentPlanet = nearestPlanet;

        yield {
            currentPath: [...currentPath],
            currentCost: currentCost
        };
    }

    // Return to home base
    currentCost += system.getDistance(currentPlanet, 0);
    currentPath.push(0);
    
    // Final state
    yield {
        currentPath: [...currentPath],
        currentCost: currentCost,
        bestPath: [...currentPath],
        bestCost: currentCost
    };
}
