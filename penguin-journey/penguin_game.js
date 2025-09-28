// Penguin Glacier Journey Game Logic
class PenguinGame {
    constructor() {
        this.gameState = {
            distanceTraveled: 0,
            totalDistance: 1000, // Total distance to glacier
            clickPower: 1,
            autoWaddlers: 0,
            clickMultiplier: 1,
            autoBoost: 1,
            clickPowerLevel: 0,
            autoWaddlerLevel: 0,
            clickMultiplierLevel: 0,
            autoBoostLevel: 0,
            penguins: [],
            energy: 100,
            maxEnergy: 100,
            pointsCollected: 0,
            nextPenguinThreshold: 2,
            isFishing: false,
            penguinsPaused: false
        };

        this.baseCosts = {
            clickPower: 10,
            autoWaddler: 50,
            clickMultiplier: 100,
            autoBoost: 200
        };

        this.penguinId = 0;
        this.init();
    }

    init() {
        this.createMap();
        this.setupEventListeners();
        this.startAutoWaddle();
        this.updateDisplay();
        this.addPenguin(); // Start with one penguin
    }

    createMap() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;

        mapContainer.innerHTML = `
            <div class="map">
                <div class="penguin-container" id="penguin-container"></div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
                <div class="distance-text" id="distance-text">
                    <img src="feet.svg" alt="Feet" class="feet-icon">
                    0
                </div>
                <div class="energy-bar">
                    <div class="energy-fill" id="energy-fill"></div>
                </div>
                <div class="energy-text" id="energy-text">Energy: 100</div>
                <div class="hut">🏠 HUT</div>
            </div>
        `;
    }

    addPenguin() {
        const penguinContainer = document.getElementById('penguin-container');
        if (!penguinContainer) return;

        const penguin = document.createElement('div');
        penguin.className = 'penguin';
        penguin.id = `penguin-${this.penguinId}`;
        penguin.innerHTML = '<img src="Penguin.svg" alt="Penguin" style="width: 100px; height: 100px;">';

        // Start from the left side of the map
        const startX = 5 + Math.random() * 10; // Start near left edge
        const startY = 20 + Math.random() * 60; // Random vertical position
        penguin.style.left = `${startX}%`;
        penguin.style.bottom = `${startY}px`;

        penguinContainer.appendChild(penguin);

        this.gameState.penguins.push({
            id: this.penguinId,
            element: penguin,
            x: startX,
            y: startY,
            speed: 1
        });

        this.penguinId++;
    }

    movePenguins(steps) {
        // Don't move penguins if they're paused (fishing)
        if (this.gameState.penguinsPaused) {
            return;
        }

        this.gameState.penguins.forEach(penguin => {
            // Move penguin toward glacier (right side)
            const moveDistance = (steps / this.gameState.totalDistance) * 100;
            penguin.x += moveDistance;

            // Add some waddle animation
            penguin.element.style.animation = 'waddle 0.5s ease-in-out';
            setTimeout(() => {
                penguin.element.style.animation = '';
            }, 500);

            // Update position
            penguin.element.style.left = `${Math.min(penguin.x, 85)}%`;

            // Remove penguin if it reaches the glacier
            if (penguin.x >= 80) {
                this.removePenguin(penguin.id);
                this.addPenguin(); // Add a new penguin
            }
        });
    }

    removePenguin(penguinId) {
        const penguin = this.gameState.penguins.find(p => p.id === penguinId);
        if (penguin) {
            penguin.element.remove();
            this.gameState.penguins = this.gameState.penguins.filter(p => p.id !== penguinId);
        }
    }

    waddle() {
        // Hide the click arrow after 3 clicks
        if (!this.gameState.clickCount) {
            this.gameState.clickCount = 0;
        }
        this.gameState.clickCount++;

        const clickArrow = document.getElementById('click-arrow');
        if (clickArrow && this.gameState.clickCount >= 3) {
            clickArrow.style.display = 'none';
        }

        // Check if we have energy
        if (this.gameState.energy <= 0) {
            return; // Can't waddle without energy
        }

        const stepsGained = this.gameState.clickPower * this.gameState.clickMultiplier;
        this.gameState.distanceTraveled += stepsGained;
        this.gameState.pointsCollected += stepsGained;

        // Decrease energy
        this.gameState.energy = Math.max(0, this.gameState.energy - 1);

        // Move penguins
        this.movePenguins(stepsGained);

        // Check for new penguin spawning
        this.checkPenguinSpawning();

        // Check if energy is low enough to make a penguin fly away
        this.checkPenguinFlyAway();

        // Visual feedback
        const button = document.getElementById('collectButton');
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 150);

        // Show floating text
        this.showClickEffect(stepsGained);

        this.updateDisplay();
    }

    checkPenguinSpawning() {
        if (this.gameState.pointsCollected >= this.gameState.nextPenguinThreshold) {
            this.addPenguin();
            // Update threshold for next penguin (2, then 3, then 4, etc.)
            this.gameState.nextPenguinThreshold += this.gameState.penguins.length;
        }
    }

    checkPenguinFlyAway() {
        const energyPercent = (this.gameState.energy / this.gameState.maxEnergy) * 100;

        // Show hunger message at 90% energy
        if (energyPercent <= 90 && energyPercent > 89) {
            this.showHungerMessage();
        }

        // Remove penguin at 85% energy
        if (energyPercent <= 85 && this.gameState.penguins.length > 0) {
            // Remove the first penguin
            const penguinToRemove = this.gameState.penguins[0];
            this.removePenguin(penguinToRemove.id);
        }

        // Show popup when only one penguin is left AND energy is below 85%
        if (this.gameState.penguins.length === 1 && energyPercent < 85) {
            this.showFinalChancePopup();
        }
    }

    catchFish() {
        // Increase energy by 1
        this.gameState.energy = Math.min(this.gameState.maxEnergy, this.gameState.energy + 1);

        // Pause penguins while fishing
        this.gameState.isFishing = true;
        this.gameState.penguinsPaused = true;

        // Visual feedback
        const button = document.getElementById('fishButton');
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 150);

        // Show floating text
        this.showFishEffect(1);

        // Resume penguins after a short delay
        setTimeout(() => {
            this.gameState.isFishing = false;
            this.gameState.penguinsPaused = false;
        }, 1000);

        this.updateDisplay();
    }

    showClickEffect(amount) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${amount} steps`;
        effect.style.left = Math.random() * 300 + 'px';
        effect.style.top = Math.random() * 200 + 'px';

        document.querySelector('.click-area').appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    showFishEffect(amount) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = `+${amount} energy`;
        effect.style.left = Math.random() * 300 + 'px';
        effect.style.top = Math.random() * 200 + 'px';
        effect.style.color = '#32CD32';

        document.querySelector('.click-area').appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    showHungerMessage() {
        if (this.gameState.penguins.length === 0) return;

        // Show message on the first penguin
        const firstPenguin = this.gameState.penguins[0];
        const message = document.createElement('div');
        message.className = 'hunger-message';
        message.textContent = '';

        // Position the message above the penguin
        message.style.left = `${firstPenguin.x}%`;
        message.style.bottom = `${firstPenguin.y + 80}px`;

        document.querySelector('.map').appendChild(message);

        // Show fish arrow
        const fishArrow = document.getElementById('fish-arrow');
        if (fishArrow) {
            fishArrow.style.display = 'block';
        }

        // Remove message after animation
        setTimeout(() => {
            message.remove();
            // Hide fish arrow after message disappears
            if (fishArrow) {
                fishArrow.style.display = 'none';
            }
        }, 3000);
    }

    showFinalChancePopup() {
        const popup = document.getElementById('popup-overlay');
        if (popup) {
            popup.style.display = 'flex';
        }
    }

    closePopup() {
        const popup = document.getElementById('popup-overlay');
        if (popup) {
            popup.style.display = 'none';
        }
        // Show game over screen
        this.showGameOver();
    }

    showGameOver() {
        const gameOver = document.getElementById('game-over-overlay');
        if (gameOver) {
            gameOver.style.display = 'flex';
        }
    }

    buyEnergy() {
        // Restore energy to 100%
        this.gameState.energy = this.gameState.maxEnergy;
        this.updateDisplay();
        // Close popup without showing game over
        const popup = document.getElementById('popup-overlay');
        if (popup) {
            popup.style.display = 'none';
        }
    }


    buyUpgrade(type) {
        const cost = this.getUpgradeCost(type);

        if (this.gameState.distanceTraveled >= cost) {
            this.gameState.distanceTraveled -= cost;

            switch (type) {
                case 'clickPower':
                    this.gameState.clickPowerLevel++;
                    this.gameState.clickPower += 1;
                    break;
                case 'autoWaddler':
                    this.gameState.autoWaddlerLevel++;
                    this.gameState.autoWaddlers += 1;
                    this.addPenguin(); // Add a new penguin for each auto waddler
                    break;
                case 'clickMultiplier':
                    this.gameState.clickMultiplierLevel++;
                    this.gameState.clickMultiplier *= 2;
                    break;
                case 'autoBoost':
                    this.gameState.autoBoostLevel++;
                    this.gameState.autoBoost += 0.5;
                    break;
            }

            this.updateDisplay();
        }
    }

    getUpgradeCost(type) {
        const baseCost = this.baseCosts[type];
        const level = this.gameState[type + 'Level'];
        return Math.floor(baseCost * Math.pow(1.5, level));
    }

    updateDisplay() {
        document.getElementById('gems').textContent = Math.floor(this.gameState.distanceTraveled);
        document.getElementById('clickPower').textContent = this.gameState.clickPower * this.gameState.clickMultiplier;
        document.getElementById('autoCollectors').textContent = this.gameState.autoWaddlers;
        document.getElementById('gemsPerSecond').textContent = (this.gameState.autoWaddlers * this.gameState.autoBoost).toFixed(1);

        // Update progress bar
        const progress = (this.gameState.distanceTraveled / this.gameState.totalDistance) * 100;
        document.getElementById('progress-fill').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('distance-text').innerHTML =
            `<img src="feet.svg" alt="Feet" class="feet-icon">${Math.floor(this.gameState.distanceTraveled)}`;

        // Update energy bar
        const energyPercent = (this.gameState.energy / this.gameState.maxEnergy) * 100;
        document.getElementById('energy-fill').style.width = `${energyPercent}%`;
        document.getElementById('energy-text').textContent = `Energy: ${Math.floor(this.gameState.energy)}`;
    }


    startAutoWaddle() {
        setInterval(() => {
            if (this.gameState.autoWaddlers > 0 && !this.gameState.penguinsPaused) {
                const stepsGained = this.gameState.autoWaddlers * this.gameState.autoBoost;
                this.gameState.distanceTraveled += stepsGained;
                this.gameState.pointsCollected += stepsGained;
                this.movePenguins(stepsGained);
                this.checkPenguinSpawning();
                this.checkPenguinFlyAway();
                this.updateDisplay();
            }
        }, 1000);

        // Energy regeneration
        setInterval(() => {
            if (this.gameState.energy < this.gameState.maxEnergy) {
                this.gameState.energy = Math.min(this.gameState.maxEnergy, this.gameState.energy + 1);
                this.updateDisplay();
            }
        }, 2000); // Regenerate 1 energy every 2 seconds
    }


    setupEventListeners() {
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.waddle();
            }
        });
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new PenguinGame();
    // Don't start auto-waddle automatically - wait for user to click "Got it!"
});

// Global functions for HTML onclick events
function collectGems() {
    if (game) game.waddle();
}

function buyUpgrade(type) {
    if (game) game.buyUpgrade(type);
}


function catchFish() {
    if (game) game.catchFish();
}

function closePopup() {
    if (game) game.closePopup();
}

function buyEnergy() {
    if (game) game.buyEnergy();
}

function startGame() {
    // Hide the welcome popup
    const welcomeOverlay = document.getElementById('welcome-overlay');
    if (welcomeOverlay) {
        welcomeOverlay.style.display = 'none';
    }

    // Start the game if it exists
    if (game) {
        game.startAutoWaddle();
    }
}
