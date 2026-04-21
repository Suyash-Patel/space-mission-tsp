// Global State
let animationState = {
    generator: null,
    isRunning: false,
    delayMs: 200,
    currentCost: 0,
    bestCost: Infinity,
    bestPath: []
};

// Canvas Setup
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    // When resizing, regenerate the system to fit the screen
    initSystem();
}

window.addEventListener('resize', resizeCanvas);

// Initialize System
function initSystem() {
    const n = parseInt(document.getElementById('planetCount').value);
    document.getElementById('planetCountDisplay').innerText = n;
    spaceSystem.generate(n, canvas.width, canvas.height);
    drawBase();
    resetUI();
}

// Drawing Utilities
function drawBase() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawPlanets();
}

function drawStars() {
    // A simple static starfield (could be cached)
    const random = splitmix32(42); 
    ctx.fillStyle = 'white';
    for(let i = 0; i < 200; i++) {
        const x = random() * canvas.width;
        const y = random() * canvas.height;
        const r = random() * 1.5;
        ctx.globalAlpha = random() * 0.8 + 0.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

function drawPlanets() {
    for (const p of spaceSystem.planets) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.isHome ? 12 : 8, 0, Math.PI * 2);
        
        if (p.isHome) {
            ctx.fillStyle = '#0cf49b';
            ctx.shadowColor = '#0cf49b';
        } else {
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
        }
        
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Name
        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - 20);
    }
}

function drawLine(p1, p2, color, width=2, alpha=1.0) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
}

// Main Draw function for the current state
function drawState(state) {
    drawBase();

    // 1. Draw glowing background subset (for Held-Karp active planets)
    if (state.activeNodes) {
        state.activeNodes.forEach(idx => {
            const p = spaceSystem.planets[idx];
            ctx.beginPath();
            ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(112, 0, 255, 0.4)';
            ctx.fill();
        });
    }

    // 2. Draw current exploring path
    if (state.currentPath && state.currentPath.length > 0) {
        for (let i = 0; i < state.currentPath.length - 1; i++) {
            const p1 = spaceSystem.planets[state.currentPath[i]];
            const p2 = spaceSystem.planets[state.currentPath[i+1]];
            drawLine(p1, p2, 'rgba(255, 255, 255, 0.5)', 2);
        }
    }

    // 3. Draw best path so far if available
    if (state.bestPath && state.bestPath.length > 0) {
        for (let i = 0; i < state.bestPath.length - 1; i++) {
            const p1 = spaceSystem.planets[state.bestPath[i]];
            const p2 = spaceSystem.planets[state.bestPath[i+1]];
            drawLine(p1, p2, '#0cf49b', 3, 0.8);
        }
    }

    // Update UI Stats
    if (state.currentCost !== undefined) {
        document.getElementById('currentCostDisplay').innerText = state.currentCost.toFixed(2);
    }
    
    // Extra stats block
    let extra = [];
    if (state.bestCost !== undefined && state.bestCost !== Infinity) extra.push(`Best: ${state.bestCost.toFixed(2)}`);
    if (state.permutations !== undefined) extra.push(`Permutations: ${state.permutations}`);
    if (state.nodesExplored !== undefined) extra.push(`Explored: ${state.nodesExplored}`);
    if (state.nodesPruned !== undefined) extra.push(`Pruned: ${state.nodesPruned}`);
    if (extra.length > 0) {
        document.getElementById('extraStatsDisplay').innerText = extra.join(' | ');
    }
}

// Animation Loop Handlers
function updateSpeed() {
    const val = document.getElementById('speedControl').value;
    // Map 1-100 to delay 1000ms down to 0ms
    // We'll use an exponential scale for better feel
    // 1 -> ~1000ms, 100 -> 0ms
    const maxDelay = 1000;
    const minDelay = 0;
    const factor = (100 - val) / 99; // 0 to 1
    animationState.delayMs = minDelay + factor * factor * maxDelay;
    
    let text = "Fast";
    if (val < 30) text = "Slow";
    else if (val < 70) text = "Medium";
    
    if(val == 100) {
        text = "Instant / Skipping Frames";
        animationState.delayMs = 0;
    }
    
    document.getElementById('speedDisplay').innerText = text;
}

document.getElementById('speedControl').addEventListener('input', updateSpeed);

function startAnimation(genFunc) {
    animationState.generator = genFunc(spaceSystem);
    animationState.isRunning = true;
    
    document.getElementById('playPauseBtn').innerText = '⏸ Pause';
    document.getElementById('playPauseBtn').classList.add('playing');
    document.getElementById('playPauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;

    // Track time
    animationState.startTime = performance.now();
    loop();
}

async function loop() {
    if (!animationState.isRunning) return;

    let result;
    
    // If speed is 100 (instant), skip drawing most frames to finish fast
    if (animationState.delayMs === 0) {
        let skipCount = 100; // How many frames to compute before drawing
        while(skipCount > 0 && animationState.isRunning) {
            result = animationState.generator.next();
            if(result.done) break;
            skipCount--;
        }
        
        // Let UI breathe periodically
        if (!result.done) {
            drawState(result.value);
            // using setTimeout 0 to release main thread briefly
            setTimeout(loop, 0); 
            return;
        }
    } else {
        result = animationState.generator.next();
    }

    if (result.done) {
        // Finished!
        animationState.isRunning = false;
        const elapsed = performance.now() - animationState.startTime;
        document.getElementById('playPauseBtn').innerText = '▶ Run';
        document.getElementById('playPauseBtn').disabled = true;
        document.getElementById('stopBtn').disabled = true;
        
        // Final draw
        if (result.value) {
           drawState(result.value);
           
           // Save results to dashboard data
           const cost = result.value.bestCost !== undefined ? result.value.bestCost : result.value.currentCost;
           recordResult(activeAlgoId, cost, elapsed);
        }
        return;
    }

    // Not done, draw current state
    if (animationState.delayMs > 0) {
        drawState(result.value);
        setTimeout(loop, animationState.delayMs);
    }
}

function stopAnimation() {
    animationState.isRunning = false;
    document.getElementById('playPauseBtn').innerText = '▶ Run';
    drawBase();
    resetUI();
}

function resetUI() {
    document.getElementById('currentCostDisplay').innerText = "0.00";
    document.getElementById('extraStatsDisplay').innerText = "";
    document.getElementById('playPauseBtn').disabled = !activeAlgoId;
    document.getElementById('stopBtn').disabled = true;
}

// UI Event Binding
let activeAlgoId = null;

document.querySelectorAll('.btn-algo').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-algo').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeAlgoId = btn.dataset.algo;
        
        const infoBox = document.getElementById('algoInfoBox');
        infoBox.style.display = 'block';
        document.getElementById('currentAlgoName').innerText = btn.innerText;
        
        // Setup description based on selection
        let desc = "";
        switch(activeAlgoId) {
            case "nearestneighbor": desc = "Heuristic: Greedily picks the nearest unvisited planet."; break;
            case "bruteforce": desc = "Exact: Examines all possible permutations of routes."; break;
            case "heldkarp": desc = "Exact: Uses dynamic programming and bitmasking to solve subsets optimally."; break;
            case "branchandbound": desc = "Exact: Traverses a search tree and prunes paths that exceed the best known bound."; break;
        }
        document.getElementById('currentAlgoDesc').innerText = desc;
        
        stopAnimation();
        document.getElementById('playPauseBtn').disabled = false;
    });
});

document.getElementById('generateBtn').addEventListener('click', () => {
    stopAnimation();
    initSystem();
});

document.getElementById('planetCount').addEventListener('input', (e) => {
    document.getElementById('planetCountDisplay').innerText = e.target.value;
});

document.getElementById('playPauseBtn').addEventListener('click', () => {
    if (animationState.isRunning) {
        // Pause
        animationState.isRunning = false;
        document.getElementById('playPauseBtn').innerText = '▶ Resume';
    } else {
        // If we have a paused generator, resume it
        if (animationState.generator && document.getElementById('playPauseBtn').innerText === '▶ Resume') {
            animationState.isRunning = true;
            document.getElementById('playPauseBtn').innerText = '⏸ Pause';
            loop();
        } else {
            // Start fresh
            drawBase();
            let genObj = null;
            if (activeAlgoId === 'nearestneighbor') genObj = runNearestNeighbor;
            else if (activeAlgoId === 'bruteforce') genObj = runBruteForce;
            else if (activeAlgoId === 'heldkarp') genObj = runHeldKarp;
            else if (activeAlgoId === 'branchandbound') genObj = runBranchAndBound;
            
            if (genObj) startAnimation(genObj);
        }
    }
});

document.getElementById('stopBtn').addEventListener('click', stopAnimation);

// Initialization
setTimeout(() => {
    resizeCanvas();
    updateSpeed();
}, 100);
