const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const uploadForm = document.getElementById('uploadForm');
const logoutBtn = document.getElementById('logoutBtn');
const progressWrapper = document.getElementById('progressWrapper');
const uploadProgress = document.getElementById('uploadProgress');
const progressPercent = document.getElementById('progressPercent');

// File input handlers to show filename
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
        const fileName = e.target.files[0]?.name || 'No file chosen';
        e.target.parentElement.querySelector('.file-name').textContent = fileName;
    });
});

// Check login status
if (localStorage.getItem('adminLoggedIn') === 'true') {
    showDashboard();
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('adminLoggedIn', 'true');
            showDashboard();
        } else {
            alert('Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Make sure the server is running.');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    showLogin();
});

function showDashboard() {
    loginCard.classList.add('hidden');
    setTimeout(() => {
        loginCard.style.display = 'none';
        dashboard.style.display = 'block';
        // Trigger reflow
        dashboard.offsetHeight;
        dashboard.classList.remove('hidden');
    }, 500);
}

function showLogin() {
    dashboard.classList.add('hidden');
    setTimeout(() => {
        dashboard.style.display = 'none';
        loginCard.style.display = 'block';
        // Trigger reflow
        loginCard.offsetHeight;
        loginCard.classList.remove('hidden');
    }, 500);
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(uploadForm);
    const xhr = new XMLHttpRequest();

    progressWrapper.classList.remove('hidden');
    uploadProgress.style.width = '0%';
    progressPercent.textContent = '0%';

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            uploadProgress.style.width = percent + '%';
            progressPercent.textContent = percent + '%';
        }
    });

    xhr.onload = () => {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                // Simulate 100% completion visual
                uploadProgress.style.width = '100%';
                progressPercent.textContent = '100%';

                setTimeout(() => {
                    alert('Book published successfully!');
                    uploadForm.reset();
                    document.querySelectorAll('.file-name').forEach(el => el.textContent = 'No file chosen');
                    progressWrapper.classList.add('hidden');
                }, 500);
            } else {
                alert('Upload failed: ' + response.message);
            }
        } else {
            alert('Upload failed. Server error.');
        }
    };

    xhr.onerror = () => {
        alert('Upload failed. Network error.');
    };

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
});
