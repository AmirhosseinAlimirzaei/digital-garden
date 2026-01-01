// ===== ADMIN CONFIGURATION =====
const ADMIN_CREDENTIALS = {
    username: 'root',
    password: '123456'
};

const SESSION_KEY = 'admin_session';
const CONTENTS_PATH = 'Contents';

// ===== STATE =====
let uploadedFiles = {
    cover: null,
    infographic: null,
    podcastPersian: null,
    podcastEnglish: null,
    pdf: null
};

let ghConfig = {
    owner: '',
    repo: '',
    branch: 'main',
    token: ''
};

// ===== CHECK CURRENT PAGE =====
const isLoginPage = document.querySelector('.login-page') !== null;
const isAdminPage = document.querySelector('.admin-page') !== null;

// ===== AUTHENTICATION =====
function checkAuth() {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (isAdminPage && !session) {
        window.location.href = 'login.html';
    }
    if (isLoginPage && session) {
        window.location.href = 'admin.html';
    }
}

function login(username, password) {
    return username === ADMIN_CREDENTIALS.username &&
        password === ADMIN_CREDENTIALS.password;
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

// ===== LOGIN PAGE FUNCTIONALITY =====
if (isLoginPage) {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    // Create particles
    createParticles();

    // Password visibility toggle
    passwordToggle?.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        passwordToggle.classList.toggle('active');
    });

    // Login form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Reset error state
        errorMessage.classList.remove('show');

        // Show loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        // Simulate network delay
        await delay(1500);

        if (login(username, password)) {
            // Success
            loginBtn.classList.remove('loading');
            loginBtn.classList.add('success');

            // Store session
            sessionStorage.setItem(SESSION_KEY, 'authenticated');

            // Redirect after animation
            await delay(1000);
            window.location.href = 'admin.html';
        } else {
            // Error
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            errorMessage.classList.add('show');

            // Shake input fields
            usernameInput.parentElement.classList.add('shake');
            passwordInput.parentElement.classList.add('shake');

            setTimeout(() => {
                usernameInput.parentElement.classList.remove('shake');
                passwordInput.parentElement.classList.remove('shake');
            }, 500);
        }
    });
}

// ===== ADMIN PAGE FUNCTIONALITY =====
if (isAdminPage) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const adminOverlay = document.getElementById('adminOverlay');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const logoutBtn = document.getElementById('logoutBtn');
    const bookForm = document.getElementById('bookForm');
    const resetFormBtn = document.getElementById('resetFormBtn');
    const publishModal = document.getElementById('publishModal');
    const uploadZones = document.querySelectorAll('.upload-zone');

    // Settings Elements
    const settingsForm = document.getElementById('settingsForm');
    const tokenToggle = document.getElementById('tokenToggle');
    const testConnectionBtn = document.getElementById('testConnectionBtn');

    // Load GitHub Settings
    loadGhSettings();

    // Mobile menu toggle
    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        menuToggle.classList.toggle('active');
        adminOverlay.classList.toggle('sidebar-open');
    });

    adminOverlay?.addEventListener('click', () => {
        sidebar.classList.remove('active');
        menuToggle.classList.remove('active');
        adminOverlay.classList.remove('sidebar-open');
    });

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;

            // Update nav state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });

            // Close mobile menu
            sidebar.classList.remove('active');
            menuToggle?.classList.remove('active');
            adminOverlay?.classList.remove('sidebar-open');
        });
    });

    // Logout
    logoutBtn?.addEventListener('click', logout);

    // File upload handling
    uploadZones.forEach(zone => {
        const uploadType = zone.dataset.upload;
        const input = zone.querySelector('input[type="file"]');
        const preview = zone.querySelector('.upload-preview');
        const removeBtn = zone.querySelector('.remove-file');

        // Click to upload
        zone.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-file')) {
                input.click();
            }
        });

        // Drag and drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(uploadType, file, zone);
        });

        // File input change
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileUpload(uploadType, file, zone);
        });

        // Remove file
        removeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFile(uploadType, zone, input);
        });
    });

    // Handle file upload
    function handleFileUpload(type, file, zone) {
        uploadedFiles[type] = file;
        zone.classList.add('has-file');

        const preview = zone.querySelector('.upload-preview');

        if (type === 'cover' || type === 'infographic') {
            // Image preview
            const img = preview.querySelector('img');
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            // Audio/PDF preview
            const fileName = preview.querySelector('.file-name');
            if (fileName) {
                fileName.textContent = file.name;
            }
        }
    }

    // Remove file
    function removeFile(type, zone, input) {
        uploadedFiles[type] = null;
        zone.classList.remove('has-file');
        input.value = '';
    }

    // Reset form
    resetFormBtn?.addEventListener('click', () => {
        bookForm.reset();
        uploadZones.forEach(zone => {
            const type = zone.dataset.upload;
            const input = zone.querySelector('input[type="file"]');
            removeFile(type, zone, input);
        });
    });

    // Form submission
    bookForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate Settings first
        if (!ghConfig.token || !ghConfig.owner || !ghConfig.repo) {
            alert('Please configure GitHub settings first!');
            document.querySelector('[data-section="settings"]').click();
            return;
        }

        const bookName = document.getElementById('bookName').value.trim();
        const bookDescription = document.getElementById('bookDescription').value.trim();

        // Validate required fields
        if (!bookName || !bookDescription) {
            alert('Please fill in all required text fields');
            return;
        }

        // Validate required files
        if (!uploadedFiles.cover) {
            alert('Please upload a cover image');
            return;
        }
        if (!uploadedFiles.infographic) {
            alert('Please upload an infographic');
            return;
        }
        if (!uploadedFiles.podcastPersian) {
            alert('Please upload the Persian podcast');
            return;
        }
        if (!uploadedFiles.pdf) {
            alert('Please upload the PDF file');
            return;
        }

        // Show publishing modal
        showPublishModal();
        await publishToGitHub(bookName, bookDescription);
    });

    // ===== SETTINGS HANDLING =====
    tokenToggle?.addEventListener('click', () => {
        const input = document.getElementById('ghToken');
        input.type = input.type === 'password' ? 'text' : 'password';
        tokenToggle.classList.toggle('active');
    });

    settingsForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveGhSettings();
        alert('Settings saved successfully!');
    });

    testConnectionBtn?.addEventListener('click', async () => {
        saveGhSettings(); // Save current inputs to state first
        testConnectionBtn.disabled = true;
        testConnectionBtn.textContent = 'Testing...';

        try {
            await githubReq(`repos/${ghConfig.owner}/${ghConfig.repo}`);
            alert('Connection Successful! Repository found.');
        } catch (error) {
            alert('Connection Failed: ' + error.message);
        } finally {
            testConnectionBtn.disabled = false;
            testConnectionBtn.innerHTML = `
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                Test Connection
            `;
        }
    });

    function loadGhSettings() {
        const saved = localStorage.getItem('gh_config');
        if (saved) {
            ghConfig = JSON.parse(saved);
            if (document.getElementById('ghOwner')) {
                document.getElementById('ghOwner').value = ghConfig.owner;
                document.getElementById('ghRepo').value = ghConfig.repo;
                document.getElementById('ghBranch').value = ghConfig.branch;
                document.getElementById('ghToken').value = ghConfig.token;
            }
        }
    }

    function saveGhSettings() {
        ghConfig = {
            owner: document.getElementById('ghOwner').value.trim(),
            repo: document.getElementById('ghRepo').value.trim(),
            branch: document.getElementById('ghBranch').value.trim(),
            token: document.getElementById('ghToken').value.trim()
        };
        localStorage.setItem('gh_config', JSON.stringify(ghConfig));
    }
}

// ===== GITHUB API CLIENT =====
async function githubReq(endpoint, method = 'GET', body = null) {
    const url = `https://api.github.com/${endpoint}`;
    const headers = {
        'Authorization': `token ${ghConfig.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'GitHub API Error');
    }

    return response.json();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function uploadFileToGitHub(path, file, message) {
    const content = await fileToBase64(file);

    // Check if file exists to get sha (for update)
    let sha = null;
    try {
        const existing = await githubReq(`repos/${ghConfig.owner}/${ghConfig.repo}/contents/${path}?ref=${ghConfig.branch}`);
        sha = existing.sha;
    } catch (e) {
        // File doesn't exist, that's fine
    }

    const body = {
        message: message,
        content: content,
        branch: ghConfig.branch
    };
    if (sha) body.sha = sha;

    await githubReq(`repos/${ghConfig.owner}/${ghConfig.repo}/contents/${path}`, 'PUT', body);
}

async function updateManifest(newBookEntry) {
    const path = `${CONTENTS_PATH}/manifest.json`;
    let manifest = { books: [] };
    let sha = null;

    try {
        const data = await githubReq(`repos/${ghConfig.owner}/${ghConfig.repo}/contents/${path}?ref=${ghConfig.branch}`);
        manifest = JSON.parse(atob(data.content));
        sha = data.sha;
    } catch (e) {
        console.log('Manifest not found, creating new one');
    }

    // Add new book
    manifest.books.push(newBookEntry);

    // Upload updated manifest
    const content = btoa(JSON.stringify(manifest, null, 2));
    const body = {
        message: `Add book: ${newBookEntry.title}`,
        content: content,
        branch: ghConfig.branch
    };
    if (sha) body.sha = sha;

    await githubReq(`repos/${ghConfig.owner}/${ghConfig.repo}/contents/${path}`, 'PUT', body);
}

// ===== PUBLISHING WORKFLOW =====
async function showPublishModal() {
    const modal = document.getElementById('publishModal');
    const overlay = document.getElementById('adminOverlay');

    modal.classList.remove('completed');
    modal.classList.add('active');
    overlay.classList.add('active');

    // Reset steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });

    document.getElementById('overallProgressFill').style.width = '0%';
    document.getElementById('progressPercent').textContent = '0%';
    document.getElementById('publishTitle').textContent = 'Publishing Your Book';
    document.getElementById('publishSubtitle').textContent = 'Uploading files to GitHub...';
}

async function updateStep(stepIndex, status) {
    const steps = document.querySelectorAll('.step');
    const step = steps[stepIndex];

    if (status === 'active') {
        step.classList.add('active');
    } else if (status === 'completed') {
        step.classList.remove('active');
        step.classList.add('completed');

        // Update progress
        const total = steps.length;
        const progress = ((stepIndex + 1) / total) * 100;
        document.getElementById('overallProgressFill').style.width = `${progress}%`;
        document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
    }
}

async function publishToGitHub(bookName, description) {
    const folderName = bookName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const bookPath = `${CONTENTS_PATH}/${folderName}`;

    try {
        // Step 1: Images
        updateStep(0, 'active'); // Creating Folder (conceptually)
        updateStep(0, 'completed');

        updateStep(1, 'active'); // Uploading Images
        await uploadFileToGitHub(`${bookPath}/images/${uploadedFiles.cover.name}`, uploadedFiles.cover, `Add cover for ${bookName}`);
        await uploadFileToGitHub(`${bookPath}/images/${uploadedFiles.infographic.name}`, uploadedFiles.infographic, `Add infographic for ${bookName}`);
        updateStep(1, 'completed');

        // Step 2: Audio
        updateStep(2, 'active');
        await uploadFileToGitHub(`${bookPath}/data/${uploadedFiles.podcastPersian.name}`, uploadedFiles.podcastPersian, `Add Persian audio for ${bookName}`);
        if (uploadedFiles.podcastEnglish) {
            await uploadFileToGitHub(`${bookPath}/data/${uploadedFiles.podcastEnglish.name}`, uploadedFiles.podcastEnglish, `Add English audio for ${bookName}`);
        }
        updateStep(2, 'completed');

        // Step 3: PDF
        updateStep(3, 'active');
        await uploadFileToGitHub(`${bookPath}/data/${uploadedFiles.pdf.name}`, uploadedFiles.pdf, `Add PDF for ${bookName}`);
        updateStep(3, 'completed');

        // Step 4: Manifest
        updateStep(4, 'active');
        const entry = {
            folder: folderName,
            title: bookName,
            description: description,
            cover: uploadedFiles.cover.name,
            infographic: uploadedFiles.infographic.name,
            audioPersian: uploadedFiles.podcastPersian.name,
            audioEnglish: uploadedFiles.podcastEnglish ? uploadedFiles.podcastEnglish.name : null,
            pdf: uploadedFiles.pdf.name
        };
        await updateManifest(entry);
        updateStep(4, 'completed');

        // Success
        await delay(500);
        const modal = document.getElementById('publishModal');
        modal.classList.add('completed');
        document.getElementById('publishTitle').textContent = 'Book Published Successfully!';
        document.getElementById('publishSubtitle').textContent = `"${bookName}" is now live on GitHub!`;

    } catch (error) {
        console.error(error);
        alert(`Publishing Failed: ${error.message}`);
        document.getElementById('publishModal').classList.remove('active');
        document.getElementById('adminOverlay').classList.remove('active');
    }
}

// Publish modal actions
document.getElementById('viewBookBtn')?.addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.getElementById('addAnotherBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('publishModal');
    const overlay = document.getElementById('adminOverlay');

    modal.classList.remove('active', 'completed');
    overlay.classList.remove('active');

    // Reset form
    document.getElementById('resetFormBtn')?.click();
});

// ===== HELPER FUNCTIONS =====
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${10 + Math.random() * 10}s`;
        container.appendChild(particle);
    }
}

// ===== INITIALIZE =====
checkAuth();