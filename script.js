const numbersPool = document.getElementById('numbers-pool');
const slots = document.querySelectorAll('.slot');
let correctCount = 0;

// Nombor jawapan dan nombor hiasan (keliru)
const answerNumbers = ['3', '0', '0', '4'];
const poolValues = ['1', '7', '3', '0', '9', '0', '4', '2'];

poolValues.forEach(val => {
    const el = document.createElement('div');
    el.classList.add('draggable-number');
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
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        const rect = el.getBoundingClientRect();
        
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

        el.style.position = 'fixed';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.zIndex = 1000;
        el.style.pointerEvents = 'none';

        moveAt(clientX, clientY);

        function moveAt(pageX, pageY) {
            el.style.left = (pageX - offsetX) + 'px';
            el.style.top = (pageY - offsetY) + 'px';
        }

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
                // JAWAPAN BETUL & KOTAK BETUL
                slot.innerText = val;
                slot.classList.add('correct');
                el.remove();
                correctCount++;
                snapped = true;
                if (correctCount === 4) setTimeout(startCakePhase, 500);
                break; 
            } else {
                // SALAH LETAK KOTAK
                slot.classList.add('error');
                
                // Cek: Adakah nombor ni sebenarnya sebahagian daripada jawapan?
                if (answerNumbers.includes(val)) {
                    // Kalau nombor betul tapi salah kotak, hantar balik ke pool
                    setTimeout(() => {
                        slot.classList.remove('error');
                        el.style.position = 'relative';
                        el.style.left = '0'; el.style.top = '0';
                        el.style.zIndex = '20';
                    }, 400);
                } else {
                    // Kalau memang nombor salah (sampah), baru fade out
                    el.style.opacity = '0';
                    setTimeout(() => {
                        slot.classList.remove('error');
                        el.remove();
                    }, 500);
                }
                snapped = true; 
                break;
            }
        }
    }

    if (!snapped) {
        el.style.position = 'relative';
        el.style.left = '0'; el.style.top = '0';
        el.style.zIndex = '20';
    }
}

function startCakePhase() {
    document.getElementById('game-password').style.display = 'none';
    document.getElementById('game-zone').classList.remove('hidden');
}

let clicks = 0;
const cakeWrapper = document.getElementById('cake-wrapper');
cakeWrapper.addEventListener('click', () => {
    clicks++;
    let progress = Math.min(Math.floor((clicks / 12) * 100), 100);
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('power-val').innerText = progress;
    let scale = 1 + (clicks * 0.25);
    cakeWrapper.style.setProperty('--s', scale);
    cakeWrapper.style.transform = `scale(${scale})`;
    if (clicks >= 8) cakeWrapper.classList.add('shake-mode');
    if (clicks >= 12) {
        cakeWrapper.style.transform = 'scale(20)';
        cakeWrapper.style.opacity = '0';
        setTimeout(showLetter, 200);
    }
});

function showLetter() {
    document.getElementById('game-zone').style.display = 'none';
    const overlay = document.getElementById('letter-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.classList.add('show');
        // Confetti Loop diubah kepada 400ms supaya tak terlalu sesak
        setInterval(createConfetti, 400);
    }, 10);
}

function createConfetti() {
    const c = document.createElement('div');
    // Kurangkan saiz sikit supaya lebih halus
    c.style.cssText = `position:absolute;width:6px;height:6px;background:hsl(${Math.random()*360},70%,60%);left:${Math.random()*100}vw;top:-10px;z-index:110;opacity:0.8;`;
    document.getElementById('confetti').appendChild(c);
    c.animate([{transform:'translateY(0)'},{transform:'translateY(110vh) rotate(360deg)'}], {
        duration: Math.random() * 2000 + 3000, 
        easing: 'linear'
    }).onfinish = () => c.remove();
}