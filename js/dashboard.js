let resultsData = {};

let costChartInst = null;
let timeChartInst = null;

const algoLabels = {
    "nearestneighbor": "Nearest Neighbor",
    "bruteforce": "Brute Force",
    "heldkarp": "Held-Karp",
    "branchandbound": "Branch & Bound"
};

const planetFeasibility = {
    "nearestneighbor": "Infinite (Approximate)",
    "bruteforce": "< 11 Planets",
    "heldkarp": "< 22 Planets",
    "branchandbound": "< 30 Planets (Varies)"
};

function recordResult(algoId, cost, timeMs) {
    resultsData[algoId] = {
        cost: cost,
        time: timeMs
    };
    
    // Automatically open dashboard if all 4 are run
    if (Object.keys(resultsData).length === 4) {
        // Let UI finish its current frame first
        setTimeout(showDashboard, 1000);
    }
}

function showDashboard() {
    const dash = document.getElementById('dashboard');
    dash.classList.remove('hidden');
    drawCharts();
    populateTable();
}

document.getElementById('showDashboardBtn').addEventListener('click', showDashboard);

document.getElementById('closeDashboardBtn').addEventListener('click', () => {
    document.getElementById('dashboard').classList.add('hidden');
});

// If dataset size changes, clear old results
document.getElementById('planetCount').addEventListener('change', () => {
    resultsData = {};
});

function drawCharts() {
    const keys = Object.keys(algoLabels); // keeping consistent order
    
    let labels = [];
    let costs = [];
    let times = [];
    let bgColorsCosts = [];
    let bgColorsTimes = [];
    
    const themeColors = {
        "nearestneighbor": "rgba(12, 244, 155, 0.7)", // green
        "bruteforce": "rgba(255, 51, 102, 0.7)", // red
        "heldkarp": "rgba(112, 0, 255, 0.7)", // purple
        "branchandbound": "rgba(0, 240, 255, 0.7)" // neon blue
    };

    keys.forEach(k => {
        if (resultsData[k]) {
            labels.push(algoLabels[k]);
            costs.push(resultsData[k].cost);
            times.push(resultsData[k].time);
            bgColorsCosts.push(themeColors[k]);
            bgColorsTimes.push(themeColors[k]);
        }
    });

    // Cost Chart
    const ctxCost = document.getElementById('costChart').getContext('2d');
    if (costChartInst) costChartInst.destroy();
    
    Chart.defaults.color = "#94a3b8";
    Chart.defaults.font.family = "'Inter', sans-serif";

    costChartInst = new Chart(ctxCost, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Route Cost (Lower is better)',
                data: costs,
                backgroundColor: bgColorsCosts,
                borderColor: bgColorsCosts.map(c => c.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#e2e8f0'} }
            },
            scales: {
                y: { 
                    beginAtZero: false, // Don't begin at zero to highlight small differences 
                    grid: { color: 'rgba(255,255,255,0.05)' } 
                },
                x: { grid: { display: false } }
            }
        }
    });

    // Time Chart
    const ctxTime = document.getElementById('timeChart').getContext('2d');
    if (timeChartInst) timeChartInst.destroy();
    
    timeChartInst = new Chart(ctxTime, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Execution Time ms (Lower is better, Log Scale)',
                data: times,
                backgroundColor: bgColorsTimes,
                borderColor: bgColorsTimes.map(c => c.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#e2e8f0'} }
            },
            scales: {
                y: { 
                    type: 'logarithmic', // Time differences are huge (ms vs minutes)
                    grid: { color: 'rgba(255,255,255,0.05)' } 
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function populateTable() {
    const tbody = document.querySelector('#resultsTable tbody');
    tbody.innerHTML = '';
    
    // Determine the optimal cost (minimum of exact algorithms if they ran)
    let exactAlgos = ['bruteforce', 'heldkarp', 'branchandbound'];
    let optimalCost = Infinity;
    for (let k of exactAlgos) {
        if (resultsData[k] && resultsData[k].cost < optimalCost) {
            optimalCost = resultsData[k].cost;
        }
    }

    const keys = Object.keys(algoLabels);
    
    keys.forEach(k => {
        if (!resultsData[k]) return;
        
        const data = resultsData[k];
        let isOptimal = false;
        let diffPct = 0;
        
        if (optimalCost !== Infinity) {
            // we have an optimal baseline to compare to
            if (Math.abs(data.cost - optimalCost) < 0.001) {
                isOptimal = true;
            } else {
                diffPct = ((data.cost - optimalCost) / optimalCost) * 100;
            }
        } else if (exactAlgos.includes(k)) {
            // Just ran one exact algo, it is the optimal
            isOptimal = true;
        }
        
        let tr = document.createElement('tr');
        
        let tdAlgo = document.createElement('td');
        tdAlgo.innerText = algoLabels[k];
        
        let tdCost = document.createElement('td');
        tdCost.innerText = data.cost.toFixed(2);
        if (diffPct > 0) {
            let span = document.createElement('span');
            span.style.color = '#ff3366';
            span.style.fontSize = '0.8rem';
            span.style.marginLeft = '8px';
            span.innerText = `(+${diffPct.toFixed(1)}%)`;
            tdCost.appendChild(span);
        }

        let tdTime = document.createElement('td');
        tdTime.innerText = data.time.toFixed(1);
        
        let tdOpt = document.createElement('td');
        if (isOptimal) {
            tdOpt.innerHTML = `<span style="color: #0cf49b; font-weight: bold;">Yes</span>`;
        } else {
            tdOpt.innerHTML = `<span style="color: #ff3366;">No</span>`;
        }
        
        let tdFeas = document.createElement('td');
        tdFeas.innerText = planetFeasibility[k];
        
        tr.appendChild(tdAlgo);
        tr.appendChild(tdCost);
        tr.appendChild(tdTime);
        tr.appendChild(tdOpt);
        tr.appendChild(tdFeas);
        
        tbody.appendChild(tr);
    });
}
