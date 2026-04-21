// A simple seeded random number generator for reproducibility
function splitmix32(a) {
    return function() {
      a |= 0; a = a + 0x9e3779b9 | 0;
      let t = a ^ a >>> 16;
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
}

const PLANET_NAMES = [
    "Terra Prime", "Nova X", "Aethelgard", "Zion", "Mars II", 
    "Centauri B", "Sirius C", "Orion", "Lyra", "Draconis",
    "Altair", "Vega", "Rigel", "Antares", "Capella",
    "Arcturus", "Betelgeuse", "Aldebaran", "Spica", "Pollux"
];

class PlanetSystem {
    constructor() {
        this.planets = [];
        this.distanceMatrix = [];
        this.seed = 1337; // Fixed seed
    }

    generate(n, canvasWidth, canvasHeight) {
        this.planets = [];
        const padding = 50;
        
        // Generate Home Base (Planet 0) roughly in the center
        this.planets.push({
            id: 0,
            name: "Home Base",
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            isHome: true
        });

        const random = splitmix32(this.seed);
        
        // Pick names randomly but consistently based on seed
        let availableNames = [...PLANET_NAMES];

        for (let i = 1; i < n; i++) {
            // Random position away from edges
            const x = padding + random() * (canvasWidth - padding * 2);
            const y = padding + random() * (canvasHeight - padding * 2);
            
            // Pick a random name
            const nameIdx = Math.floor(random() * availableNames.length);
            const name = availableNames[nameIdx];
            availableNames.splice(nameIdx, 1);

            this.planets.push({ id: i, name, x, y, isHome: false });
        }

        this.computeDistanceMatrix();
    }

    computeDistanceMatrix() {
        const n = this.planets.length;
        this.distanceMatrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const dx = this.planets[i].x - this.planets[j].x;
                const dy = this.planets[i].y - this.planets[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.distanceMatrix[i][j] = dist;
            }
        }
    }

    getDistance(i, j) {
        return this.distanceMatrix[i][j];
    }
}

// Global instance
const spaceSystem = new PlanetSystem();
