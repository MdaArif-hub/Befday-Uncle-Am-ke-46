// --- INITIAL SETUP & SOUNDS ---
const sndClick = document.getElementById('snd-click');
const sndTap = document.getElementById('snd-tap');
const sndError = document.getElementById('snd-error');
const sndCorrect = document.getElementById('snd-correct');
const sndBgm = document.getElementById('snd-bgm');

sndTap.src = "buton/heart%20tap.mp3";
sndError.src = "buton/oof%20error.mp3";
sndCorrect.src = "sound/correct%20answer.mp3";
sndBgm.src = "sound/Happy%20Birthday%20Song.mp3";

const allSounds = [sndClick, sndTap, sndError, sndCorrect, sndBgm];
allSounds.forEach(s => { s.volume = 1.0; s.preload = "auto"; });

let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    allSounds.forEach(s => {
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(e => {});
    });
    audioUnlocked = true;
}

function playSound(sound) {
    if (sound) { sound.currentTime = 0; sound.play().catch(e => {}); }
}

// --- MULTI-STEP NOTICE LOGIC ---
const noticeBody = document.getElementById('notice-body');
const noticeOverlay = document.getElementById('notice-overlay');

function nextStep(stepNumber) {
    playSound(sndClick);
    unlockAudio(); // Unlock audio on first interaction
    
    // Bounce effect transition
    noticeBody.style.animation = 'none';
    void noticeBody.offsetWidth; // Trigger reflow
    noticeBody.style.animation = 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    // Hide all steps and show the targeted one
    document.querySelectorAll('.notice-step').forEach(step => {
        step.classList.add('hidden');
    });
    document.getElementById(`step-${stepNumber}`).classList.remove('hidden');
}

document.getElementById('final-notice-btn').addEventListener('click', () => {
    playSound(sndClick);
    noticeBody.classList.add('closing');
    setTimeout(() => { 
        noticeOverlay.style.display = 'none'; 
    }, 600);
});

// --- LOADING SCREEN (12 Seconds) ---
const emojis = ["😎", "👨‍💼", "👔", "💪", "🔥", "💪", "👑", "✨", "🙌", "🦾", "🏎️", "⌚", "💰", "👍", "🤜", "🎂", "🥳", "💙"];
const emojiDisplay = document.getElementById('emoji-display');
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.getElementById('main-content');

async function startLoading() {
    for (let r = 0; r < 3; r++) {
        emojiDisplay.innerHTML = "";
        const roundEmojis = emojis.slice(r * 5, (r + 1) * 5);
        for (const emo of roundEmojis) {
            const span = document.createElement('span');
            span.className = 'emoji-item';
            span.innerText = emo;
            emojiDisplay.appendChild(span);
            await new Promise(res => setTimeout(res, 600)); 
        }
        await new Promise(res => setTimeout(res, 200)); 
    }
    emojiDisplay.innerHTML = "";
    const lastEmojis = emojis.slice(15, 18);
    for (const emo of lastEmojis) {
        const span = document.createElement('span');
        span.className = 'emoji-item';
        span.innerText = emo;
        emojiDisplay.appendChild(span);
        await new Promise(res => setTimeout(res, 1000));
    }
    await new Promise(res => setTimeout(res, 500));
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        noticeOverlay.classList.remove('hidden'); 
        mainContent.classList.remove('hidden');   
    }, 1000);
}
window.addEventListener('load', startLoading);

// --- FASA 1: DRAG & DROP PASSWORD ---
const numbersPool = document.getElementById('numbers-pool');
const slots = document.querySelectorAll('.slot');
const answerNumbers = ['3', '0', '0', '4'];
const poolValues = ['1', '7', '3', '0', '9', '0', '4', '2'];
let correctCount = 0;

poolValues.forEach(val => {
    const el = document.createElement('div');
    el.className = 'draggable-number';
    el.innerText = val;
    makeDraggable(el);
    numbersPool.appendChild(el);
});

function makeDraggable(el) {
    let offsetX, offsetY;
    el.addEventListener('mousedown', startDrag);
    el.addEventListener('touchstart', startDrag, {passive: false});

    function startDrag(e) {
        if (e.type === 'touchstart') e.preventDefault();
        unlockAudio();
        playSound(sndClick);
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        const rect = el.getBoundingClientRect();
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        el.style.position = 'fixed';
        el.style.width = '55px'; el.style.height = '55px';
        el.style.zIndex = 1000; el.style.pointerEvents = 'none';

        function moveAt(pageX, pageY) {
            el.style.left = (pageX - offsetX) + 'px';
            el.style.top = (pageY - offsetY) + 'px';
        }
        moveAt(clientX, clientY);

        function onMouseMove(event) {
            const moveX = event.clientX || (event.touches ? event.touches[0].clientX : null);
            const moveY = event.clientY || (event.touches ? event.touches[0].clientY : null);
            if (moveX !== null) moveAt(moveX, moveY);
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onMouseMove, {passive: false});

        function stopDrag() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onMouseMove);
            el.style.pointerEvents = 'auto';
            checkSnap(el);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }
}

function checkSnap(el) {
    let snapped = false;
    const nRect = el.getBoundingClientRect();
    const val = el.innerText;
    for (let slot of slots) {
        const sRect = slot.getBoundingClientRect();
        const isOverlap = !(nRect.right < sRect.left || nRect.left > sRect.right || nRect.bottom < sRect.top || nRect.top > sRect.bottom);
        if (isOverlap && !slot.classList.contains('correct')) {
            if (val === slot.dataset.needed) {
                slot.innerText = val; slot.classList.add('correct');
                el.remove(); correctCount++; snapped = true;
                if (correctCount === 4) { playSound(sndCorrect); setTimeout(startCakePhase, 1000); } 
                else { playSound(sndClick); }
                break; 
            } else {
                playSound(sndError);
                slot.classList.add('error');
                if (answerNumbers.includes(val)) {
                    setTimeout(() => { slot.classList.remove('error'); el.style.position = 'relative'; el.style.left = '0'; el.style.top = '0'; }, 400);
                } else {
                    el.style.opacity = '0';
                    setTimeout(() => { slot.classList.remove('error'); el.remove(); }, 500);
                }
                snapped = true; break;
            }
        }
    }
    if (!snapped) { el.style.position = 'relative'; el.style.left = '0'; el.style.top = '0'; }
}

function startCakePhase() {
    document.getElementById('game-password').style.display = 'none';
    document.getElementById('game-zone').classList.remove('hidden');
}

// --- FASA 2: TAP THE CAKE ---
let clicks = 0;
const cakeWrapper = document.getElementById('cake-wrapper');
cakeWrapper.addEventListener('click', () => {
    unlockAudio(); clicks++; playSound(sndTap);
    let progress = Math.min(Math.floor((clicks / 12) * 100), 100);
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('power-val').innerText = progress;
    let scale = 1 + (clicks * 0.25);
    cakeWrapper.style.setProperty('--s', scale);
    cakeWrapper.style.transform = `scale(${scale})`;
    if (clicks >= 8) cakeWrapper.classList.add('shake-mode');
    if (clicks >= 12) { cakeWrapper.style.transform = 'scale(20)'; cakeWrapper.style.opacity = '0'; setTimeout(showLetter, 200); }
});

// --- FASA 3: WISH LETTER ---
const letterContent = document.getElementById('letter-content');
function showLetter() {
    document.getElementById('game-zone').style.display = 'none';
    const overlay = document.getElementById('letter-overlay');
    overlay.style.display = 'flex';
    playSound(sndBgm);
    setTimeout(() => { overlay.classList.add('show'); setInterval(createConfetti, 400); }, 10);
}

document.getElementById('btn-scroll-top').addEventListener('click', () => {
    playSound(sndClick);
    letterContent.scrollTo({ top: 0, behavior: 'smooth' });
});

function createConfetti() {
    const c = document.createElement('div');
    c.style.cssText = `position:absolute;width:6px;height:6px;background:hsl(${Math.random()*360},70%,60%);left:${Math.random()*100}vw;top:-10px;z-index:110;opacity:0.8;`;
    document.getElementById('confetti').appendChild(c);
    c.animate([{transform:'translateY(0)'},{transform:'translateY(110vh) rotate(360deg)'}], { duration: Math.random() * 2000 + 3000, easing: 'linear' }).onfinish = () => c.remove();
}