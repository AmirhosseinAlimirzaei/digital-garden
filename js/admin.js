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
        await simulatePublishing(bookName, bookDescription);
    });
}

// ===== PUBLISHING SIMULATION =====
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
    document.getElementById('publishSubtitle').textContent = 'Please wait while we process your files...';
}

async function simulatePublishing(bookName, description) {
    const steps = document.querySelectorAll('.step');
    const progressFill = document.getElementById('overallProgressFill');
    const progressPercent = document.getElementById('progressPercent');
    const modal = document.getElementById('publishModal');

    const stepDurations = [800, 1200, 1500, 1000, 600];
    let totalProgress = 0;

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        step.classList.add('active');

        await delay(stepDurations[i]);

        step.classList.remove('active');
        step.classList.add('completed');

        totalProgress = ((i + 1) / steps.length) * 100;
        progressFill.style.width = `${totalProgress}%`;
        progressPercent.textContent = `${Math.round(totalProgress)}%`;
    }

    // Complete
    await delay(500);
    modal.classList.add('completed');
    document.getElementById('publishTitle').textContent = 'Book Published Successfully!';
    document.getElementById('publishSubtitle').textContent = `"${bookName}" is now live on your website`;

    // Generate manifest entry for console (for demonstration)
    console.log('New book entry:', generateManifestEntry(bookName, description));
}

function generateManifestEntry(bookName, description) {
    const folderName = bookName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    
    return {
        folder: folderName,
        title: bookName,
        description: description,
        cover: uploadedFiles.cover?.name || 'cover.jpg',
        infographic: uploadedFiles.infographic?.name || 'infographic.jpg',
        audioPersian: uploadedFiles.podcastPersian?.name || 'persian.mp3',
        audioEnglish: uploadedFiles.podcastEnglish?.name || null,
        pdf: uploadedFiles.pdf?.name || 'book.pdf'
    };
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