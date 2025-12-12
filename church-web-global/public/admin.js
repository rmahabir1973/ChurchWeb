// Admin Panel JavaScript

let isLoggedIn = false;
let templates = [];
let sessionId = localStorage.getItem('adminSession');

// Check auth status on load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();
    setupEventListeners();
});

async function checkAuthStatus() {
    try {
        const headers = sessionId ? { 'X-Admin-Session': sessionId } : {};
        const response = await fetch('/api/admin/status', { headers });
        const data = await response.json();
        
        if (data.needsSetup) {
            document.getElementById('setup-notice').style.display = 'block';
        }
        
        if (data.authenticated) {
            showDashboard();
        } else {
            // Clear invalid session
            localStorage.removeItem('adminSession');
            sessionId = null;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// Helper for authenticated requests
function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    if (sessionId) {
        options.headers['X-Admin-Session'] = sessionId;
    }
    return fetch(url, options);
}

function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.admin-nav button[data-section]').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });
    
    // Template modal
    document.getElementById('add-template-btn').addEventListener('click', () => openTemplateModal());
    document.getElementById('cancel-modal').addEventListener('click', closeTemplateModal);
    document.getElementById('template-form').addEventListener('submit', handleTemplateSave);
    
    // Change password
    document.getElementById('change-password-form').addEventListener('submit', handlePasswordChange);
    
    // Close modal on overlay click
    document.getElementById('template-modal').addEventListener('click', (e) => {
        if (e.target.id === 'template-modal') closeTemplateModal();
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionId = data.sessionId;
            localStorage.setItem('adminSession', sessionId);
            showDashboard();
        } else {
            errorDiv.textContent = data.error || 'Invalid password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
    }
}

async function handleLogout() {
    try {
        await authFetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('adminSession');
    sessionId = null;
    isLoggedIn = false;
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('password').value = '';
}

function showDashboard() {
    isLoggedIn = true;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadDashboardData();
    loadTemplates();
}

function switchSection(sectionName) {
    // Update nav buttons
    document.querySelectorAll('.admin-nav button[data-section]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
    });
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionName}`);
    });
    
    if (sectionName === 'templates') {
        loadTemplates();
    }
}

async function loadDashboardData() {
    try {
        // Load template count
        const templatesRes = await fetch('/api/admin/templates');
        const templatesData = await templatesRes.json();
        if (templatesData.success) {
            const enabledCount = templatesData.templates.filter(t => t.enabled).length;
            document.getElementById('stat-templates').textContent = enabledCount;
        }
        
        // Check API status
        const apiRes = await fetch('/api/test');
        const apiData = await apiRes.json();
        document.getElementById('stat-api').textContent = apiData.duda ? 'Connected' : 'Disconnected';
        document.getElementById('stat-api').style.color = apiData.duda ? '#10b981' : '#ef4444';
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadTemplates() {
    try {
        const response = await fetch('/api/admin/templates');
        const data = await response.json();
        
        if (data.success) {
            templates = data.templates;
            renderTemplates();
        }
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

function renderTemplates() {
    const container = document.getElementById('templates-list');
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    <h3>No templates configured</h3>
                    <p>Add a template to get started</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = templates.map((template, index) => `
        <div class="card">
            <div class="template-card">
                <img src="${template.custom_thumbnail || '/api/templates/' + template.base_site_name + '/thumbnail'}" 
                     alt="${template.name}" 
                     class="template-thumbnail"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 150 100%22><rect fill=%22%23e5e7eb%22 width=%22150%22 height=%22100%22/><text x=%2275%22 y=%2250%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2212%22>No Preview</text></svg>'">
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>${template.description || 'No description'}</p>
                    <span class="template-id">ID: ${template.base_site_name}</span>
                    <span class="status-badge ${template.enabled ? 'status-enabled' : 'status-disabled'}" style="margin-left: 8px;">
                        ${template.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <div class="template-actions">
                        <button class="btn btn-secondary" onclick="openTemplateModal(${index})">Edit</button>
                        <button class="btn ${template.enabled ? 'btn-danger' : 'btn-success'}" onclick="toggleTemplate(${index})">
                            ${template.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button class="btn btn-danger" onclick="deleteTemplate(${index})">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function openTemplateModal(index = -1) {
    const modal = document.getElementById('template-modal');
    const form = document.getElementById('template-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    document.getElementById('template-index').value = index;
    
    if (index >= 0 && templates[index]) {
        title.textContent = 'Edit Template';
        const template = templates[index];
        document.getElementById('template-id').value = template.base_site_name;
        document.getElementById('template-name').value = template.name;
        document.getElementById('template-description').value = template.description || '';
        document.getElementById('template-thumbnail').value = template.custom_thumbnail || '';
        document.getElementById('template-enabled').checked = template.enabled;
    } else {
        title.textContent = 'Add Template';
        document.getElementById('template-enabled').checked = true;
    }
    
    modal.classList.add('active');
}

function closeTemplateModal() {
    document.getElementById('template-modal').classList.remove('active');
}

async function handleTemplateSave(e) {
    e.preventDefault();
    
    const index = parseInt(document.getElementById('template-index').value);
    const templateData = {
        base_site_name: document.getElementById('template-id').value.trim(),
        name: document.getElementById('template-name').value.trim(),
        description: document.getElementById('template-description').value.trim(),
        custom_thumbnail: document.getElementById('template-thumbnail').value.trim() || null,
        enabled: document.getElementById('template-enabled').checked
    };
    
    try {
        const url = index >= 0 ? `/api/admin/templates/${index}` : '/api/admin/templates';
        const method = index >= 0 ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTemplateModal();
            loadTemplates();
            loadDashboardData();
        } else {
            alert(data.error || 'Failed to save template');
        }
    } catch (error) {
        alert('Error saving template');
    }
}

async function toggleTemplate(index) {
    const template = templates[index];
    template.enabled = !template.enabled;
    
    try {
        const response = await fetch(`/api/admin/templates/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTemplates();
            loadDashboardData();
        } else {
            alert(data.error || 'Failed to update template');
        }
    } catch (error) {
        alert('Error updating template');
    }
}

async function deleteTemplate(index) {
    if (!confirm('Are you sure you want to delete this template?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/templates/${index}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTemplates();
            loadDashboardData();
        } else {
            alert(data.error || 'Failed to delete template');
        }
    } catch (error) {
        alert('Error deleting template');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Password updated successfully');
            document.getElementById('change-password-form').reset();
        } else {
            alert(data.error || 'Failed to change password');
        }
    } catch (error) {
        alert('Error changing password');
    }
}
