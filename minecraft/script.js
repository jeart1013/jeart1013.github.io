document.addEventListener('DOMContentLoaded', () => {
    /* Mobile Menu Toggle */
    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.menu');
    const menuIcon = hamburger ? hamburger.querySelector('ion-icon') : null;

    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            menu.classList.toggle('active');
            // Toggle Icon
            if (menuIcon) {
                const iconName = menu.classList.contains('active') ? 'close-outline' : 'menu-outline';
                menuIcon.setAttribute('name', iconName);
            }
        });

        // Close menu when clicking links
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                if (menuIcon) menuIcon.setAttribute('name', 'menu-outline');
            });
        });
    }

    /* Scroll Effect for Header */
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* Carousel Logic */
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextBtn = document.querySelector('.next-btn');
        const prevBtn = document.querySelector('.prev-btn');

        let currentIndex = 0;

        const updateSlidePosition = () => {
            if (!track || slides.length === 0) return;
            const slideWidth = slides[0].getBoundingClientRect().width;
            track.style.transform = 'translateX(-' + (slideWidth * currentIndex) + 'px)';
        };

        if (nextBtn && prevBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % slides.length;
                updateSlidePosition();
            });

            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                updateSlidePosition();
            });

            // Auto play
            setInterval(() => {
                currentIndex = (currentIndex + 1) % slides.length;
                updateSlidePosition();
            }, 5000);
        }

        // Handle resize
        window.addEventListener('resize', updateSlidePosition);
    }

    /* Language Switcher */
    const langBtns = document.querySelectorAll('.lang-switch');
    let currentLang = 'en'; // default

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'zh' : 'en';
            updateLanguage(currentLang);
        });
    });

    function updateLanguage(lang) {
        document.querySelectorAll('[data-lang-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-lang-${lang}`);
        });

        // Update button text for ALL buttons
        langBtns.forEach(btn => {
            btn.textContent = lang === 'en' ? 'EN/中文' : '中文/EN';
        });
    }

    /* Video Modal Logic */
    const videoTrigger = document.querySelector('.video-trigger');
    const modal = document.querySelector('.video-modal');
    const closeBtn = document.querySelector('.close-btn');
    const overlay = document.querySelector('.modal-overlay');
    const iframe = document.querySelector('#video-frame');
    let videoSrc = iframe ? iframe.src : '';

    if (videoTrigger && modal) {
        videoTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
            if (iframe) iframe.src = videoSrc + "&autoplay=1"; // Auto play when opened
        });

        const closeModal = () => {
            modal.classList.remove('active');
            if (iframe) iframe.src = videoSrc; // Stop video
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);
    }

    /* ================================
       Mining Mini-Game Logic
    ================================ */
    const miningGame = {
        // Game state
        score: 0,
        highScore: parseInt(localStorage.getItem('mc_highScore')) || 0,
        combo: 1,
        comboTimer: null,
        blockHP: 10,
        maxBlockHP: 10,
        blocksDestroyed: 0,

        // Inventory
        inventory: {
            coal: parseInt(localStorage.getItem('mc_coal')) || 0,
            iron: parseInt(localStorage.getItem('mc_iron')) || 0,
            gold: parseInt(localStorage.getItem('mc_gold')) || 0,
            diamond: parseInt(localStorage.getItem('mc_diamond')) || 0,
            emerald: parseInt(localStorage.getItem('mc_emerald')) || 0
        },

        // Ore drop rates and values
        ores: {
            stone: { chance: 0.40, value: 1, color: '#888', name: '石頭' },
            coal: { chance: 0.30, value: 5, color: '#333', name: '煤炭' },
            iron: { chance: 0.15, value: 15, color: '#ddd', name: '鐵礦' },
            gold: { chance: 0.08, value: 50, color: '#ffd700', name: '金礦' },
            diamond: { chance: 0.05, value: 200, color: '#7df9ff', name: '鑽石' },
            emerald: { chance: 0.02, value: 500, color: '#50c878', name: '綠寶石' }
        },

        // DOM Elements
        elements: {},

        // Initialize game
        init() {
            this.elements = {
                mineBlock: document.getElementById('mine-block'),
                blockHP: document.getElementById('block-hp'),
                blockCracks: document.getElementById('block-cracks'),
                currentScore: document.getElementById('current-score'),
                highScore: document.getElementById('high-score'),
                comboDisplay: document.getElementById('combo-display'),
                floatingRewards: document.getElementById('floating-rewards'),
                resetBtn: document.getElementById('reset-game'),
                coalCount: document.getElementById('coal-count'),
                ironCount: document.getElementById('iron-count'),
                goldCount: document.getElementById('gold-count'),
                diamondCount: document.getElementById('diamond-count'),
                emeraldCount: document.getElementById('emerald-count')
            };

            // Check if elements exist
            if (!this.elements.mineBlock) return;

            // Set up event listeners
            this.elements.mineBlock.addEventListener('click', (e) => this.mineBlock(e));
            this.elements.resetBtn.addEventListener('click', () => this.resetGame());

            // Update UI
            this.updateUI();
            this.spawnNewBlock();
        },

        // Mine the block
        mineBlock(e) {
            if (this.blockHP <= 0) return;

            // Decrease HP
            this.blockHP--;
            this.elements.blockHP.textContent = this.blockHP;

            // Shake animation
            this.elements.mineBlock.classList.add('shake');
            setTimeout(() => this.elements.mineBlock.classList.remove('shake'), 100);

            // Update cracks
            this.updateCracks();

            // Create particles
            this.createParticles(e);

            // Combo system
            this.updateCombo();

            // Block destroyed
            if (this.blockHP <= 0) {
                this.destroyBlock();
            }
        },

        // Update crack visuals
        updateCracks() {
            const hpPercent = this.blockHP / this.maxBlockHP;
            this.elements.blockCracks.className = 'block-cracks';
            
            if (hpPercent <= 0.3) {
                this.elements.blockCracks.classList.add('crack-3');
            } else if (hpPercent <= 0.6) {
                this.elements.blockCracks.classList.add('crack-2');
            } else if (hpPercent <= 0.9) {
                this.elements.blockCracks.classList.add('crack-1');
            }
        },

        // Create particle effects
        createParticles(e) {
            const rect = this.elements.mineBlock.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.background = this.getBlockColor();
                particle.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
                particle.style.setProperty('--ty', (Math.random() - 0.5) * 100 + 'px');
                
                this.elements.mineBlock.appendChild(particle);
                setTimeout(() => particle.remove(), 600);
            }
        },

        // Get current block color
        getBlockColor() {
            const currentBlock = this.elements.mineBlock.className.split(' ').find(c => this.ores[c]);
            return currentBlock ? this.ores[currentBlock].color : '#888';
        },

        // Update combo
        updateCombo() {
            clearTimeout(this.comboTimer);
            
            this.combo = Math.min(this.combo + 0.1, 10);
            this.elements.comboDisplay.textContent = 'x' + this.combo.toFixed(1);
            
            // Combo color based on multiplier
            if (this.combo >= 5) {
                this.elements.comboDisplay.style.color = '#ffd700';
            } else if (this.combo >= 3) {
                this.elements.comboDisplay.style.color = '#50c878';
            } else {
                this.elements.comboDisplay.style.color = '#4deeea';
            }

            // Reset combo after delay
            this.comboTimer = setTimeout(() => {
                this.combo = 1;
                this.elements.comboDisplay.textContent = 'x1';
                this.elements.comboDisplay.style.color = '#4deeea';
            }, 2000);
        },

        // Destroy block and give rewards
        destroyBlock() {
            this.blocksDestroyed++;
            
            // Breaking animation
            this.elements.mineBlock.classList.add('breaking');
            
            // Determine ore drop
            const ore = this.determineOreDrop();
            
            // Calculate points
            const basePoints = this.ores[ore].value;
            const points = Math.floor(basePoints * this.combo);
            this.score += points;

            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('mc_highScore', this.highScore);
            }

            // Add to inventory (except stone)
            if (ore !== 'stone') {
                this.inventory[ore]++;
                localStorage.setItem('mc_' + ore, this.inventory[ore]);
                this.animateInventorySlot(ore);
            }

            // Show floating reward
            this.showFloatingReward(ore, points);

            // Update UI
            this.updateUI();

            // Spawn new block after delay
            setTimeout(() => {
                this.elements.mineBlock.classList.remove('breaking');
                this.spawnNewBlock();
            }, 300);
        },

        // Determine which ore drops
        determineOreDrop() {
            const rand = Math.random();
            let cumulative = 0;

            // Rarer ores become slightly more common as player progresses
            const luckBonus = Math.min(this.blocksDestroyed * 0.001, 0.1);

            for (const [ore, data] of Object.entries(this.ores)) {
                let chance = data.chance;
                
                // Apply luck bonus to rare ores
                if (ore === 'diamond' || ore === 'emerald') {
                    chance += luckBonus;
                } else if (ore === 'stone') {
                    chance -= luckBonus * 2;
                }

                cumulative += chance;
                if (rand <= cumulative) return ore;
            }
            return 'stone';
        },

        // Show floating reward text
        showFloatingReward(ore, points) {
            const reward = document.createElement('div');
            reward.className = 'floating-reward';
            reward.style.color = this.ores[ore].color;
            reward.style.left = '50%';
            reward.style.top = '50%';
            reward.style.transform = 'translate(-50%, -50%)';
            
            const oreEmoji = {
                stone: '🪨',
                coal: '⬛',
                iron: '⬜',
                gold: '🟨',
                diamond: '💎',
                emerald: '💚'
            };

            reward.innerHTML = `${oreEmoji[ore]} +${points}`;
            
            this.elements.floatingRewards.appendChild(reward);
            setTimeout(() => reward.remove(), 1000);
        },

        // Animate inventory slot
        animateInventorySlot(ore) {
            const slot = document.querySelector(`.inv-slot[data-ore="${ore}"]`);
            if (slot) {
                slot.classList.add('ore-found');
                setTimeout(() => slot.classList.remove('ore-found'), 500);
            }
        },

        // Spawn new block
        spawnNewBlock() {
            // Increase difficulty over time
            this.maxBlockHP = Math.min(10 + Math.floor(this.blocksDestroyed / 5), 30);
            this.blockHP = this.maxBlockHP;
            this.elements.blockHP.textContent = this.blockHP;
            this.elements.blockCracks.className = 'block-cracks';

            // Random block type based on current depth/progress
            const blockTypes = ['stone', 'coal', 'iron', 'gold', 'diamond', 'emerald'];
            const weights = [50, 25, 12, 7, 4, 2];
            
            // Apply depth bonus
            const depthBonus = Math.min(this.blocksDestroyed, 100);
            weights[0] -= depthBonus * 0.2;
            weights[3] += depthBonus * 0.03;
            weights[4] += depthBonus * 0.02;
            weights[5] += depthBonus * 0.01;

            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let rand = Math.random() * totalWeight;
            let blockType = 'stone';

            for (let i = 0; i < blockTypes.length; i++) {
                rand -= weights[i];
                if (rand <= 0) {
                    blockType = blockTypes[i];
                    break;
                }
            }

            // Update block appearance
            this.elements.mineBlock.className = 'mine-block ' + blockType;
        },

        // Update UI elements
        updateUI() {
            this.elements.currentScore.textContent = this.score.toLocaleString();
            this.elements.highScore.textContent = this.highScore.toLocaleString();
            this.elements.coalCount.textContent = this.inventory.coal;
            this.elements.ironCount.textContent = this.inventory.iron;
            this.elements.goldCount.textContent = this.inventory.gold;
            this.elements.diamondCount.textContent = this.inventory.diamond;
            this.elements.emeraldCount.textContent = this.inventory.emerald;
        },

        // Reset game
        resetGame() {
            this.score = 0;
            this.combo = 1;
            this.blocksDestroyed = 0;
            this.maxBlockHP = 10;
            
            // Reset inventory
            this.inventory = { coal: 0, iron: 0, gold: 0, diamond: 0, emerald: 0 };
            Object.keys(this.inventory).forEach(ore => {
                localStorage.setItem('mc_' + ore, 0);
            });

            this.updateUI();
            this.spawnNewBlock();
            this.elements.comboDisplay.textContent = 'x1';
            this.elements.comboDisplay.style.color = '#4deeea';
        }
    };

    // Initialize the mining game
    miningGame.init();
});

