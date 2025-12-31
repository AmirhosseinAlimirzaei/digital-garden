// ===== CONFIGURATION =====
const CONTENTS_PATH = 'Contents';
const MANIFEST_PATH = `${CONTENTS_PATH}/manifest.json`;

// ===== STATE =====
let booksData = [];
let currentBookData = null;
let currentLanguage = 'persian';
let isPlaying = false;

// ===== DOM ELEMENTS =====
const themeToggle = document.getElementById('themeToggle');
const booksGrid = document.getElementById('booksGrid');
const loadingState = document.getElementById('loadingState');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const btnEnglish = document.getElementById('btnEnglish');
const btnPersian = document.getElementById('btnPersian');
const currentLangLabel = document.getElementById('currentLangLabel');
const downloadMp3 = document.getElementById('downloadMp3');
const downloadPdf = document.getElementById('downloadPdf');
const downloadLangIndicator = document.getElementById('downloadLangIndicator');
const languageSelector = document.getElementById('languageSelector');
const audioPlayerSection = document.getElementById('audioPlayerSection');
const fullscreenOverlay = document.getElementById('fullscreenOverlay');
const fullscreenClose = document.getElementById('fullscreenClose');
const fullscreenImage = document.getElementById('fullscreenImage');
const infographicContainer = document.getElementById('infographicContainer');
const speedBtns = document.querySelectorAll('.speed-btn');

// ===== THEME TOGGLE =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
});

// ===== HELPER FUNCTIONS =====
function encodePathComponent(str) {
    return encodeURIComponent(str).replace(/%2F/g, '/');
}

function buildPath(folder, subfolder, filename) {
    return `${CONTENTS_PATH}/${encodePathComponent(folder)}/${subfolder}/${encodePathComponent(filename)}`;
}

// ===== LOAD BOOKS FROM MANIFEST =====
async function loadBooksData() {
    try {
        const response = await fetch(MANIFEST_PATH);
        if (!response.ok) {
            throw new Error('Manifest file not found');
        }
        
        const manifest = await response.json();
        
        return manifest.books.map((book, index) => {
            const folder = book.folder;
            
            return {
                id: index + 1,
                folder: folder,
                title: book.title,
                description: book.description || 'No description available.',
                cover: buildPath(folder, 'images', book.cover),
                infographic: book.infographic ? buildPath(folder, 'images', book.infographic) : null,
                audioPersian: book.audioPersian ? buildPath(folder, 'data', book.audioPersian) : null,
                audioEnglish: book.audioEnglish ? buildPath(folder, 'data', book.audioEnglish) : null,
                pdf: book.pdf ? buildPath(folder, 'data', book.pdf) : null,
                hasEnglishAudio: !!book.audioEnglish,
                hasPersianAudio: !!book.audioPersian
            };
        });
    } catch (error) {
        console.error('Error loading manifest:', error);
        return [];
    }
}

// ===== RENDER BOOKS =====
function renderBooks() {
    if (booksData.length === 0) {
        booksGrid.innerHTML = `
            <div class="error-message">
                <svg viewBox="0 0 24 24">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                </svg>
                <h3>No books found</h3>
                <p>Please check that the manifest.json file exists in the Contents folder.</p>
            </div>
        `;
        return;
    }

    booksGrid.innerHTML = booksData.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <div class="book-card-inner">
                <img src="${book.cover}" alt="${book.title}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/300x450/6c5ce7/ffffff?text=${encodeURIComponent(book.title.substring(0, 10))}'">
                <div class="book-card-overlay">
                    <div class="book-card-title">${book.title}</div>
                    <div class="book-card-hint">
                        <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                        Click to explore
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            openModal(parseInt(card.dataset.bookId));
        });
    });
}

// ===== MODAL FUNCTIONS =====
function openModal(bookId) {
    currentBookData = booksData.find(b => b.id === bookId);
    if (!currentBookData) return;

    // Default to Persian if available, otherwise English
    if (currentBookData.hasPersianAudio) {
        currentLanguage = 'persian';
    } else if (currentBookData.hasEnglishAudio) {
        currentLanguage = 'english';
    }
    
    updateLanguageUI();

    document.getElementById('modalCover').src = currentBookData.cover;
    document.getElementById('modalTitle').textContent = currentBookData.title;
    document.getElementById('modalDescription').textContent = currentBookData.description;
    
    // Handle infographic
    const infographicImg = document.getElementById('modalInfographic');
    const infographicContainerEl = document.getElementById('infographicContainer');
    
    if (currentBookData.infographic) {
        infographicImg.src = currentBookData.infographic;
        infographicImg.onerror = () => { infographicContainerEl.style.display = 'none'; };
        infographicImg.onload = () => { infographicContainerEl.style.display = 'block'; };
        infographicContainerEl.style.display = 'block';
    } else {
        infographicContainerEl.style.display = 'none';
    }

    // Handle English audio button
    if (currentBookData.hasEnglishAudio) {
        btnEnglish.classList.remove('disabled');
        btnEnglish.removeAttribute('title');
    } else {
        btnEnglish.classList.add('disabled');
        btnEnglish.setAttribute('title', 'English audio not available');
    }

    // Handle Persian audio button
    if (currentBookData.hasPersianAudio) {
        btnPersian.classList.remove('disabled');
        btnPersian.removeAttribute('title');
    } else {
        btnPersian.classList.add('disabled');
        btnPersian.setAttribute('title', 'Persian audio not available');
    }

    // Handle PDF download button
    if (currentBookData.pdf) {
        downloadPdf.href = currentBookData.pdf;
        downloadPdf.style.display = 'flex';
    } else {
        downloadPdf.style.display = 'none';
    }

    // Hide audio player if no audio available
    if (!currentBookData.hasPersianAudio && !currentBookData.hasEnglishAudio) {
        audioPlayerSection.style.display = 'none';
        downloadMp3.style.display = 'none';
    } else {
        audioPlayerSection.style.display = 'flex';
        downloadMp3.style.display = 'flex';
    }

    updateAudioSource();
    resetAudioPlayer();

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    audioPlayer.pause();
    resetAudioPlayer();
}

function resetAudioPlayer() {
    isPlaying = false;
    playPauseBtn.classList.remove('playing');
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    
    // Reset playback speed to 1x
    audioPlayer.playbackRate = 1;
    speedBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.speed === '1');
    });
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// ===== LANGUAGE SWITCHING =====
function updateLanguageUI() {
    btnEnglish.classList.toggle('active', currentLanguage === 'english');
    btnPersian.classList.toggle('active', currentLanguage === 'persian');
    currentLangLabel.textContent = currentLanguage === 'english' ? 'English Version' : 'Persian Version (فارسی)';
    downloadLangIndicator.textContent = currentLanguage === 'english' ? 'EN' : 'FA';
}

function updateAudioSource() {
    if (!currentBookData) return;
    const audioSrc = currentLanguage === 'english' ? currentBookData.audioEnglish : currentBookData.audioPersian;
    if (audioSrc) {
        audioPlayer.src = audioSrc;
        downloadMp3.href = audioSrc;
    }
}

function switchLanguage(lang) {
    if (lang === currentLanguage) return;
    if (lang === 'english' && !currentBookData.hasEnglishAudio) return;
    if (lang === 'persian' && !currentBookData.hasPersianAudio) return;
    
    currentLanguage = lang;
    updateLanguageUI();
    audioPlayer.pause();
    resetAudioPlayer();
    updateAudioSource();
}

btnEnglish.addEventListener('click', () => switchLanguage('english'));
btnPersian.addEventListener('click', () => switchLanguage('persian'));

// ===== DOWNLOAD HANDLERS =====
downloadMp3.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!downloadMp3.href || downloadMp3.href === '#' || downloadMp3.href.endsWith('#')) {
        e.preventDefault();
    }
});

downloadPdf.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!downloadPdf.href || downloadPdf.href === '#' || downloadPdf.href.endsWith('#')) {
        e.preventDefault();
    }
});

// ===== AUDIO PLAYER =====
playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play().catch(err => console.warn('Playback failed:', err));
    }
});

progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioPlayer.duration) audioPlayer.currentTime = percent * audioPlayer.duration;
});

function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    playPauseBtn.classList.add('playing');
});

audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
    playPauseBtn.classList.remove('playing');
});

audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        progressFill.style.width = `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%`;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
});

audioPlayer.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
});

audioPlayer.addEventListener('ended', resetAudioPlayer);

// ===== PLAYBACK SPEED =====
speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed);
        audioPlayer.playbackRate = speed;
        
        // Update active state
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ===== FULLSCREEN INFOGRAPHIC =====
infographicContainer.addEventListener('click', () => {
    const imgSrc = document.getElementById('modalInfographic').src;
    if (imgSrc && !imgSrc.includes('placeholder')) {
        fullscreenImage.src = imgSrc;
        fullscreenOverlay.classList.add('active');
    }
});

fullscreenClose.addEventListener('click', () => {
    fullscreenOverlay.classList.remove('active');
});

fullscreenOverlay.addEventListener('click', (e) => {
    if (e.target === fullscreenOverlay) {
        fullscreenOverlay.classList.remove('active');
    }
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Close modal with Escape
    if (e.key === 'Escape') {
        if (fullscreenOverlay.classList.contains('active')) {
            fullscreenOverlay.classList.remove('active');
        } else if (modalOverlay.classList.contains('active')) {
            closeModal();
        }
    }
    
    // Space to play/pause when modal is open
    if (e.key === ' ' && modalOverlay.classList.contains('active') && !fullscreenOverlay.classList.contains('active')) {
        e.preventDefault();
        playPauseBtn.click();
    }
});

// ===== INITIALIZE =====
async function init() {
    initTheme();
    booksData = await loadBooksData();
    
    if (loadingState) loadingState.remove();
    
    renderBooks();
}

init();