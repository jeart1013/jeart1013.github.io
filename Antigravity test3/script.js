// 遊戲狀態
const game = {
    stage: 1,
    gold: 0,
    hero: {
        name: "初階調查員:娜娜莉",
        maxHp: 100,
        hp: 100,
        atk: 15,
        def: 5,
        level: 1,
        mp: 20,
        maxMp: 20,
        healCount: 3
    },
    monster: null,
    isPlayerTurn: true,
    isBattleActive: false
};

// 怪物資料庫
const monsters = [
    { name: "畫框怪", image: "images/boss_01.png", hp: 30, atk: 8, def: 2, gold: 10, exp: 5 },
    { name: "黑松販賣機怪", image: "images/boss_02.png", hp: 45, atk: 12, def: 3, gold: 20, exp: 10 },
    { name: "偷拍相機怪", image: "images/boss_03.png", hp: 60, atk: 15, def: 5, gold: 35, exp: 15 },
    { name: "瑪莎拉哥 怪", image: "images/boss_04.png", hp: 80, atk: 20, def: 7, gold: 50, exp: 25 },
    { name: "兩拳超人", image: "images/boss_05.png", hp: 110, atk: 25, def: 8, gold: 80, exp: 40 },
    { name: "暗黑騎士", image: "images/boss_01.png", hp: 130, atk: 30, def: 10, gold: 100, exp: 50 },
    { name: "火焰惡魔", image: "images/boss_02.png", hp: 160, atk: 35, def: 12, gold: 120, exp: 60 },
    { name: "冰霜巨龍", image: "images/boss_03.png", hp: 200, atk: 45, def: 15, gold: 150, exp: 80 },
    { name: "魔王", image: "images/boss_04.png", hp: 300, atk: 60, def: 20, gold: 300, exp: 100 }
];

// DOM 元素
const elements = {
    monsterName: document.getElementById('monsterName'),
    monsterHp: document.getElementById('monsterHp'),
    monsterMaxHp: document.getElementById('monsterMaxHp'),
    monsterHpBar: document.getElementById('monsterHpBar'),
    monsterSprite: document.getElementById('monsterSprite'),
    monsterImage: document.getElementById('monsterImage'),
    heroHp: document.getElementById('heroHp'),
    heroMaxHp: document.getElementById('heroMaxHp'),
    heroHpBar: document.getElementById('heroHpBar'),
    heroAtk: document.getElementById('heroAtk'),
    heroDef: document.getElementById('heroDef'),
    heroLevel: document.getElementById('heroLevel'),
    heroMp: document.getElementById('heroMp'),
    currentStage: document.getElementById('currentStage'),
    gold: document.getElementById('gold'),
    messageBox: document.getElementById('messageBox'),
    attackBtn: document.getElementById('attackBtn'),
    skillBtn: document.getElementById('skillBtn'),
    healBtn: document.getElementById('healBtn'),
    runBtn: document.getElementById('runBtn'),
    resultScreen: document.getElementById('resultScreen'),
    resultTitle: document.getElementById('resultTitle'),
    resultMessage: document.getElementById('resultMessage'),
    continueBtn: document.getElementById('continueBtn')
};

// === 特效函數 ===

function createSlashEffect(target) {
    const slash = document.createElement('div');
    slash.className = 'slash-effect';
    target.style.position = 'relative';
    target.appendChild(slash);

    setTimeout(() => {
        slash.remove();
    }, 500);
}

function createFireballEffect(target) {
    const fireball = document.createElement('div');
    fireball.className = 'fireball-effect';
    target.style.position = 'relative';
    target.appendChild(fireball);

    setTimeout(() => {
        fireball.remove();
    }, 1000);
}

function createFlashEffect(target) {
    const flash = document.createElement('div');
    flash.className = 'flash-effect';
    target.style.position = 'relative';
    target.appendChild(flash);

    setTimeout(() => {
        flash.remove();
    }, 300);
}

function showDamageNumber(target, damage, isCritical = false, isHeal = false) {
    const damageNum = document.createElement('div');
    damageNum.className = 'damage-number';

    if (isCritical) {
        damageNum.classList.add('critical');
        damageNum.textContent = `${damage}!!!`;
    } else if (isHeal) {
        damageNum.classList.add('heal');
        damageNum.textContent = `+${damage}`;
    } else {
        damageNum.textContent = `-${damage}`;
    }

    target.style.position = 'relative';
    target.appendChild(damageNum);

    setTimeout(() => {
        damageNum.remove();
    }, 1000);
}

function createLevelUpEffect() {
    const levelUpText = document.createElement('div');
    levelUpText.className = 'level-up-text';
    levelUpText.textContent = 'LEVEL UP!';
    document.body.appendChild(levelUpText);

    setTimeout(() => {
        levelUpText.remove();
    }, 2000);
}

function monsterDefeated() {
    game.gold += game.monster.gold;
    showMessage(`擊敗了 ${game.monster.name}！獲得 ${game.monster.gold} 金幣！`);

    setTimeout(() => {
        game.stage++;

        // 每3關或通過第4關(進入第5關)時升級
        if (game.stage % 3 === 0 || game.stage === 5) {
            levelUp();
        }

        updateUI();

        if (game.stage > monsters.length) {
            gameWin();
        } else {
            spawnMonster();
            game.isPlayerTurn = true;
        }
    }, 2000);
}

// === 遊戲主要函數 ===

function initGame() {
    updateUI();
    spawnMonster();

    elements.attackBtn.addEventListener('click', () => playerAttack());
    elements.skillBtn.addEventListener('click', () => playerSkill());
    elements.healBtn.addEventListener('click', () => playerHeal());
    elements.runBtn.addEventListener('click', () => playerRun());
    elements.continueBtn.addEventListener('click', () => continueGame());
}

function spawnMonster() {
    const monsterIndex = Math.min(game.stage - 1, monsters.length - 1);
    const template = monsters[monsterIndex];

    game.monster = {
        ...template,
        maxHp: template.hp
    };

    elements.monsterName.textContent = game.monster.name;
    // Update image src instead of textContent
    elements.monsterImage.src = game.monster.image;
    updateMonsterHP();

    showMessage(`${game.monster.name} 出現了！`);
    game.isBattleActive = true;
}

function playerAttack() {
    if (!game.isPlayerTurn || !game.isBattleActive) return;

    game.isPlayerTurn = false;

    const damage = Math.max(game.hero.atk - game.monster.def, 1);
    game.monster.hp = Math.max(game.monster.hp - damage, 0);

    createSlashEffect(elements.monsterSprite);
    createFlashEffect(elements.monsterSprite);
    showDamageNumber(elements.monsterSprite, damage);

    elements.monsterSprite.classList.add('damaged');
    setTimeout(() => elements.monsterSprite.classList.remove('damaged'), 500);

    showMessage(`娜娜莉攻擊！造成 ${damage} 點傷害！`);
    updateMonsterHP();

    setTimeout(() => {
        if (game.monster.hp <= 0) {
            monsterDefeated();
        } else {
            monsterAttack();
        }
    }, 1000);
}

function playerSkill() {
    if (!game.isPlayerTurn || !game.isBattleActive || game.hero.mp < 10) return;

    game.isPlayerTurn = false;
    game.hero.mp -= 10;

    const damage = Math.max((game.hero.atk * 2) - game.monster.def, 1);
    game.monster.hp = Math.max(game.monster.hp - damage, 0);

    createFireballEffect(elements.monsterSprite);

    setTimeout(() => {
        createFlashEffect(elements.monsterSprite);
        showDamageNumber(elements.monsterSprite, damage, true);
        elements.monsterSprite.classList.add('damaged');
        setTimeout(() => elements.monsterSprite.classList.remove('damaged'), 500);
    }, 800);

    showMessage(`娜娜莉使用火球術！造成 ${damage} 點傷害！`);

    setTimeout(() => {
        updateMonsterHP();
        updateUI();
    }, 800);

    setTimeout(() => {
        if (game.monster.hp <= 0) {
            monsterDefeated();
        } else {
            monsterAttack();
        }
    }, 1500);
}

function playerHeal() {
    if (!game.isPlayerTurn || !game.isBattleActive || game.hero.healCount <= 0) return;

    game.isPlayerTurn = false;
    game.hero.healCount--;

    const healAmount = Math.floor(game.hero.maxHp * 0.4);
    game.hero.hp = Math.min(game.hero.hp + healAmount, game.hero.maxHp);

    const heroSprite = document.querySelector('.hero-sprite');
    createFlashEffect(heroSprite);
    showDamageNumber(heroSprite, healAmount, false, true);

    showMessage(`娜娜莉使用治療藥水！恢復 ${healAmount} HP！剩餘 ${game.hero.healCount} 次`);
    updateHeroHP();

    setTimeout(() => {
        monsterAttack();
    }, 1000);
}

function playerRun() {
    if (!game.isPlayerTurn || !game.isBattleActive) return;

    const runChance = Math.random();
    if (runChance > 0.5) {
        showMessage('成功逃跑了！');
        setTimeout(() => {
            spawnMonster();
            game.isPlayerTurn = true;
        }, 1500);
    } else {
        game.isPlayerTurn = false;
        showMessage('逃跑失敗！');
        setTimeout(() => {
            monsterAttack();
        }, 1000);
    }
}

function monsterAttack() {
    const damage = Math.max(game.monster.atk - game.hero.def, 1);
    game.hero.hp = Math.max(game.hero.hp - damage, 0);

    const heroSprite = document.querySelector('.hero-sprite');
    createFlashEffect(heroSprite);
    showDamageNumber(heroSprite, damage);

    heroSprite.classList.add('damaged');
    setTimeout(() => heroSprite.classList.remove('damaged'), 500);

    showMessage(`${game.monster.name} 攻擊！造成 ${damage} 點傷害！`);
    updateHeroHP();

    setTimeout(() => {
        if (game.hero.hp <= 0) {
            gameOver();
        } else {
            game.isPlayerTurn = true;
        }
    }, 1000);
}



function levelUp() {
    game.hero.level++;
    game.hero.maxHp += 20;
    game.hero.hp = game.hero.maxHp;
    game.hero.atk += 5;
    game.hero.def += 2;
    game.hero.mp = game.hero.maxMp;
    game.hero.healCount = 3;

    createLevelUpEffect();
    showMessage(`🎉 升級了！等級提升到 ${game.hero.level}！所有能力提升！`);
}

function gameOver() {
    game.isBattleActive = false;
    elements.resultTitle.textContent = '⚰️ 你被擊敗了！';
    elements.resultMessage.textContent = `你在第 ${game.stage} 關卡被擊敗了。\n獲得了 ${game.gold} 金幣。`;
    elements.continueBtn.textContent = '🔄 重新開始';
    elements.resultScreen.classList.add('show');
}

function gameWin() {
    game.isBattleActive = false;
    elements.resultTitle.textContent = '🎊 恭喜過關！';
    elements.resultMessage.textContent = `你擊敗了所有的怪物！\n最終等級: ${game.hero.level}\n總金幣: ${game.gold}`;
    elements.continueBtn.textContent = '🎮 再玩一次';
    elements.resultScreen.classList.add('show');
}

function continueGame() {
    elements.resultScreen.classList.remove('show');

    game.stage = 1;
    game.gold = 0;
    game.hero.hp = game.hero.maxHp;
    game.hero.level = 1;
    game.hero.atk = 15;
    game.hero.def = 5;
    game.hero.maxHp = 100;
    game.hero.mp = 20;
    game.hero.healCount = 3;

    updateUI();
    spawnMonster();
    game.isPlayerTurn = true;
}

function updateUI() {
    elements.currentStage.textContent = game.stage;
    elements.gold.textContent = game.gold;
    elements.heroHp.textContent = game.hero.hp;
    elements.heroMaxHp.textContent = game.hero.maxHp;
    elements.heroAtk.textContent = game.hero.atk;
    elements.heroDef.textContent = game.hero.def;
    elements.heroLevel.textContent = game.hero.level;
    elements.heroMp.textContent = game.hero.mp;
    updateHeroHP();

    elements.skillBtn.disabled = game.hero.mp < 10;
    elements.healBtn.disabled = game.hero.healCount <= 0;
    elements.healBtn.textContent = `💊 治療 (${game.hero.healCount}次)`;
}

function updateHeroHP() {
    const percentage = (game.hero.hp / game.hero.maxHp) * 100;
    elements.heroHpBar.style.width = percentage + '%';
    elements.heroHp.textContent = game.hero.hp;
}

function updateMonsterHP() {
    const percentage = (game.monster.hp / game.monster.maxHp) * 100;
    elements.monsterHpBar.style.width = percentage + '%';
    elements.monsterHp.textContent = game.monster.hp;
    elements.monsterMaxHp.textContent = game.monster.maxHp;
}

function showMessage(message) {
    elements.messageBox.textContent = message;
    elements.messageBox.style.animation = 'none';
    setTimeout(() => {
        elements.messageBox.style.animation = 'fadeIn 0.5s';
    }, 10);
}

initGame();
