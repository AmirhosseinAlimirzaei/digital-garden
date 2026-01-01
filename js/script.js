// ===== CONFIGURATION =====
const CONTENTS_PATH = 'Contents';
const MANIFEST_PATH = `${CONTENTS_PATH}/manifest.json`;
const AMBIENCE_PATH = `${CONTENTS_PATH}/ambience`;

// ===== STATE =====
let booksData = [];
let currentBookData = null;
let currentLanguage = 'persian';
let isPlaying = false;
let currentAmbient = 'off';
let ambientVolume = 0.5; // Default 50%

// ===== DOM ELEMENTS =====
const themeToggle = document.getElementById('themeToggle');
const booksGrid = document.getElementById('booksGrid');
const loadingState = document.getElementById('loadingState');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const audioPlayer = document.getElementById('audioPlayer');
const ambientPlayer = document.getElementById('ambientPlayer');
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
const ambientToggle = document.getElementById('ambientToggle');
const ambientMenu = document.getElementById('ambientMenu');
const ambientOptions = document.querySelectorAll('.ambient-option');
const ambientVolumeSlider = document.getElementById('ambientVolumeSlider');
const volumeValueLabel = document.getElementById('volumeValue');

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

// ===== IMAGE LOADING WITH SKELETON =====
function setupImageLoading(imgElement, containerElement, onLoadCallback) {
    imgElement.onload = () => {
        if (containerElement) {
            containerElement.classList.add('image-loaded');
        }
        imgElement.classList.add('loaded');
        if (onLoadCallback) onLoadCallback();
    };
    imgElement.onerror = () => {
        if (containerElement) {
            containerElement.style.display = 'none';
        }
    };
}

// ===== AMBIENT MUSIC WITH FADE =====
const AMBIENT_FADE_DURATION = 1000; // milliseconds
let ambientFadeInterval = null;

function initAmbient() {
    // Load saved volume (default 50%)
    const savedVolume = localStorage.getItem('ambientVolume');
    if (savedVolume !== null) {
        ambientVolume = parseFloat(savedVolume);
    } else {
        ambientVolume = 0.5; // Default 50%
    }

    // Update slider position
    if (ambientVolumeSlider) {
        ambientVolumeSlider.value = ambientVolume * 100;
        updateVolumeLabel(ambientVolume * 100);
    }

    const savedAmbient = localStorage.getItem('ambient') || 'off';
    setAmbient(savedAmbient, false);
    updateAmbientIcon();
}

function updateVolumeLabel(value) {
    if (volumeValueLabel) {
        volumeValueLabel.textContent = `${Math.round(value)}%`;
    }
}

function fadeOutAudio(audio, duration, callback) {
    if (ambientFadeInterval) clearInterval(ambientFadeInterval);

    const startVolume = audio.volume;
    if (startVolume === 0) {
        audio.pause();
        if (callback) callback();
        return;
    }

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    ambientFadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(0, startVolume - (volumeStep * currentStep));

        if (currentStep >= steps) {
            clearInterval(ambientFadeInterval);
            audio.pause();
            audio.volume = 0;
            if (callback) callback();
        }
    }, stepDuration);
}

function fadeInAudio(audio, duration, targetVolume) {
    if (ambientFadeInterval) clearInterval(ambientFadeInterval);

    audio.volume = 0;
    audio.play().catch(err => console.warn('Ambient playback failed:', err));

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    ambientFadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.min(targetVolume, volumeStep * currentStep);

        if (currentStep >= steps) {
            clearInterval(ambientFadeInterval);
            audio.volume = targetVolume;
        }
    }, stepDuration);
}

function setAmbient(type, save = true) {
    const previousAmbient = currentAmbient;
    currentAmbient = type;

    // Update frost overlay
    updateFrostOverlay(type);

    // Update button state
    if (type === 'off') {
        ambientToggle.classList.remove('active');
        if (previousAmbient !== 'off') {
            fadeOutAudio(ambientPlayer, AMBIENT_FADE_DURATION);
        }
    } else {
        ambientToggle.classList.add('active');

        if (previousAmbient !== 'off' && previousAmbient !== type) {
            // Crossfade: fade out current, then fade in new
            fadeOutAudio(ambientPlayer, AMBIENT_FADE_DURATION, () => {
                ambientPlayer.src = `${AMBIENCE_PATH}/${type}.mp3`;
                fadeInAudio(ambientPlayer, AMBIENT_FADE_DURATION, ambientVolume);
            });
        } else {
            // Just fade in
            ambientPlayer.src = `${AMBIENCE_PATH}/${type}.mp3`;
            fadeInAudio(ambientPlayer, AMBIENT_FADE_DURATION, ambientVolume);
        }
    }

    // Update menu active state
    ambientOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.ambient === type);
    });

    // Update icon
    updateAmbientIcon();

    if (save) {
        localStorage.setItem('ambient', type);
    }
}

function updateFrostOverlay(type) {
    const frostOverlay = document.getElementById('frostOverlay');
    if (frostOverlay) {
        if (type === 'snow') {
            frostOverlay.classList.add('active');
        } else {
            frostOverlay.classList.remove('active');
        }
    }
}

function updateAmbientIcon() {
    const icons = document.querySelectorAll('.ambient-icon');
    icons.forEach(icon => icon.classList.remove('visible'));

    if (currentAmbient === 'off') {
        document.querySelector('.ambient-off')?.classList.add('visible');
    } else if (currentAmbient === 'snow') {
        document.querySelector('.ambient-snow')?.classList.add('visible');
    } else if (currentAmbient === 'rain') {
        document.querySelector('.ambient-rain')?.classList.add('visible');
    }
}

function toggleAmbientMenu() {
    ambientMenu.classList.toggle('active');
}

// Volume slider handler
if (ambientVolumeSlider) {
    ambientVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        ambientVolume = value / 100;
        updateVolumeLabel(value);

        // Update current playing audio volume immediately
        if (currentAmbient !== 'off') {
            ambientPlayer.volume = ambientVolume;
        }

        // Save to localStorage
        localStorage.setItem('ambientVolume', ambientVolume.toString());
    });

    // Prevent menu from closing when interacting with slider
    ambientVolumeSlider.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.ambient-toggle')) {
        ambientMenu.classList.remove('active');
    }
});

ambientToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAmbientMenu();
});

ambientOptions.forEach(option => {
    option.addEventListener('click', () => {
        setAmbient(option.dataset.ambient);
        // Don't close menu so user can adjust volume
    });
});

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

    // Setup image loading for book cards
    document.querySelectorAll('.book-card').forEach(card => {
        const inner = card.querySelector('.book-card-inner');
        const img = inner.querySelector('img');

        img.onload = () => {
            inner.classList.add('image-loaded');
        };

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

    // Setup modal cover with loading effect
    const modalCover = document.getElementById('modalCover');
    const modalCoverContainer = modalCover.parentElement;
    modalCoverContainer.classList.remove('image-loaded');
    modalCover.src = currentBookData.cover;
    modalCover.onload = () => {
        modalCoverContainer.classList.add('image-loaded');
    };

    document.getElementById('modalTitle').textContent = currentBookData.title;
    document.getElementById('modalDescription').textContent = currentBookData.description;

    // Handle infographic with loading effect
    const infographicImg = document.getElementById('modalInfographic');
    const infographicContainerEl = document.getElementById('infographicContainer');

    if (currentBookData.infographic) {
        infographicContainerEl.classList.remove('image-loaded');
        infographicImg.src = currentBookData.infographic;
        infographicImg.classList.remove('loaded');

        infographicImg.onload = () => {
            infographicContainerEl.classList.add('image-loaded');
            infographicImg.classList.add('loaded');
        };
        infographicImg.onerror = () => {
            infographicContainerEl.style.display = 'none';
        };
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
        fullscreenImage.classList.remove('loaded');
        fullscreenImage.src = imgSrc;
        fullscreenImage.onload = () => {
            fullscreenImage.classList.add('loaded');
        };
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
    initAmbient();
    booksData = await loadBooksData();

    if (loadingState) loadingState.remove();

    renderBooks();
}

init();