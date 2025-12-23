// Admin Panel JavaScript

let isLoggedIn = false;
let templates = [];
let clients = [];
let sites = [];
let trials = [];
let sessionId = localStorage.getItem('adminSession');

// Pagination state
let clientsPage = 1;
let sitesPage = 1;
const pageSize = 20;

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
            localStorage.removeItem('adminSession');
            sessionId = null;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    if (sessionId) {
        options.headers['X-Admin-Session'] = sessionId;
    }
    return fetch(url, options);
}

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    document.querySelectorAll('.admin-nav button[data-section]').forEach(btn => {
        btn.addEventListener('click', () => switchSection(btn.dataset.section));
    });
    
    document.getElementById('add-template-btn').addEventListener('click', () => openTemplateModal());
    document.getElementById('cancel-modal').addEventListener('click', closeTemplateModal);
    document.getElementById('template-form').addEventListener('submit', handleTemplateSave);
    document.getElementById('thumbnail-file').addEventListener('change', handleThumbnailUpload);
    document.getElementById('change-password-form').addEventListener('submit', handlePasswordChange);
    
    document.getElementById('template-modal').addEventListener('click', (e) => {
        if (e.target.id === 'template-modal') closeTemplateModal();
    });
    
    // Import clients buttons
    document.getElementById('import-clients-btn')?.addEventListener('click', importDudaClients);
    document.getElementById('import-clients-btn-2')?.addEventListener('click', importDudaClients);
    document.getElementById('clear-sites-btn')?.addEventListener('click', clearAllSites);
    
    // Refresh stats
    document.getElementById('refresh-stats-btn')?.addEventListener('click', loadDashboardData);
    
    // Add client
    document.getElementById('add-client-btn')?.addEventListener('click', () => {
        document.getElementById('client-modal').classList.add('active');
    });
    document.getElementById('client-form')?.addEventListener('submit', handleAddClient);
    
    // Search
    document.getElementById('search-clients-btn')?.addEventListener('click', () => loadClients(1));
    document.getElementById('client-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadClients(1);
    });
    document.getElementById('client-filter')?.addEventListener('change', () => loadClients(1));
    
    document.getElementById('search-sites-btn')?.addEventListener('click', () => loadSites(1));
    document.getElementById('site-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadSites(1);
    });
    document.getElementById('site-filter')?.addEventListener('change', () => loadSites(1));
    
    // Trial tabs
    document.querySelectorAll('.tab[data-trial-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab[data-trial-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadTrials(tab.dataset.trialTab);
        });
    });
    
    // Test email form
    document.getElementById('test-email-form')?.addEventListener('submit', handleTestEmail);
    
    // Extend trial form
    document.getElementById('extend-trial-form')?.addEventListener('submit', handleExtendTrial);
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
    document.querySelectorAll('.admin-nav button[data-section]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionName);
    });
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionName}`);
    });
    
    if (sectionName === 'templates') loadTemplates();
    if (sectionName === 'clients') loadClients(1);
    if (sectionName === 'sites') loadSites(1);
    if (sectionName === 'trials') loadTrials('active');
    if (sectionName === 'settings') loadApiStatus();
    if (sectionName === 'dns') loadDnsZones();
}

async function loadDashboardData() {
    try {
        const [templatesRes, apiRes, statsRes] = await Promise.all([
            authFetch('/api/admin/templates'),
            fetch('/api/test'),
            authFetch('/api/admin/stats')
        ]);
        
        const templatesData = await templatesRes.json();
        const apiData = await apiRes.json();
        const statsData = await statsRes.json();
        
        if (templatesData.success) {
            const enabledCount = templatesData.templates.filter(t => t.enabled).length;
            document.getElementById('stat-templates').textContent = enabledCount;
        }
        
        document.getElementById('stat-api').textContent = apiData.duda ? 'Connected' : 'Disconnected';
        document.getElementById('stat-api').style.color = apiData.duda ? '#10b981' : '#ef4444';
        
        if (statsData.success) {
            document.getElementById('stat-clients').textContent = statsData.totalClients || 0;
            document.getElementById('stat-clients-sub').textContent = `${statsData.legacyClients || 0} legacy`;
            document.getElementById('stat-sites').textContent = statsData.totalSites || 0;
            document.getElementById('stat-trials').textContent = statsData.activeTrials || 0;
            document.getElementById('stat-paid').textContent = statsData.paidAccounts || 0;
            
            // Recent clients
            if (statsData.recentClients) {
                renderRecentClients(statsData.recentClients);
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function renderRecentClients(recentClients) {
    const tbody = document.getElementById('recent-clients-body');
    if (!recentClients || recentClients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No clients yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentClients.slice(0, 5).map(client => `
        <tr>
            <td>${client.email}</td>
            <td>${client.church_name || '-'}</td>
            <td><span class="status-badge ${client.is_legacy ? 'status-legacy' : 'status-active'}">${client.is_legacy ? 'Legacy' : 'New'}</span></td>
            <td>${formatDate(client.created_at)}</td>
        </tr>
    `).join('');
}

async function loadClients(page = 1) {
    clientsPage = page;
    const search = document.getElementById('client-search')?.value || '';
    const filter = document.getElementById('client-filter')?.value || 'all';
    
    try {
        const response = await authFetch(`/api/admin/clients?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}&filter=${filter}`);
        const data = await response.json();
        
        if (data.success) {
            clients = data.clients;
            renderClients();
            renderPagination('clients-pagination', data.total, page, pageSize, loadClients);
        }
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

function renderClients() {
    const tbody = document.getElementById('clients-table-body');
    if (!clients || clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No clients found</td></tr>';
        return;
    }
    
    tbody.innerHTML = clients.map(client => `
        <tr>
            <td>${client.email}</td>
            <td>${client.first_name || ''} ${client.last_name || ''}</td>
            <td>${client.church_name || '-'}</td>
            <td>${client.site_count || 0}</td>
            <td><span class="status-badge ${client.is_legacy ? 'status-legacy' : 'status-active'}">${client.is_legacy ? 'Legacy' : 'New'}</span></td>
            <td>${formatDate(client.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewClient('${client.email}')">View</button>
                <button class="btn btn-sm btn-primary" onclick="sendMagicLink('${client.email}')">Send Access</button>
            </td>
        </tr>
    `).join('');
}

async function loadSites(page = 1) {
    sitesPage = page;
    const search = document.getElementById('site-search')?.value || '';
    const filter = document.getElementById('site-filter')?.value || 'all';
    
    try {
        const response = await authFetch(`/api/admin/sites?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}&filter=${filter}`);
        const data = await response.json();
        
        if (data.success) {
            sites = data.sites;
            renderSites();
            renderPagination('sites-pagination', data.total, page, pageSize, loadSites);
        }
    } catch (error) {
        console.error('Error loading sites:', error);
    }
}

function renderSites() {
    const tbody = document.getElementById('sites-table-body');
    if (!sites || sites.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No sites found</td></tr>';
        return;
    }
    
    tbody.innerHTML = sites.map(site => `
        <tr>
            <td>${site.site_name}</td>
            <td>${site.church_name || '-'}</td>
            <td>${site.client_email || '-'}</td>
            <td><span class="status-badge ${site.is_published ? 'status-active' : 'status-trial'}">${site.is_published ? 'Published' : 'Unpublished'}</span></td>
            <td>${formatDate(site.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editSite('${site.site_name}')" title="Open DUDA Editor">Edit</button>
                <button class="btn btn-sm btn-secondary" onclick="previewSite('${site.site_name}', '${site.preview_url || ''}')" title="View live site">Preview</button>
            </td>
        </tr>
    `).join('');
}

async function loadTrials(tab = 'active') {
    try {
        const response = await authFetch(`/api/admin/trials?filter=${tab}`);
        const data = await response.json();
        
        if (data.success) {
            trials = data.trials;
            renderTrials();
        }
    } catch (error) {
        console.error('Error loading trials:', error);
    }
}

function renderTrials() {
    const tbody = document.getElementById('trials-table-body');
    if (!trials || trials.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No trials found</td></tr>';
        return;
    }
    
    tbody.innerHTML = trials.map(trial => {
        const daysLeft = getDaysLeft(trial.trial_expiry);
        let statusClass = 'status-trial';
        let statusText = `${daysLeft} days`;
        
        if (trial.has_paid) {
            statusClass = 'status-paid';
            statusText = 'Upgraded';
        } else if (daysLeft <= 0) {
            statusClass = 'status-expired';
            statusText = 'Expired';
        } else if (daysLeft <= 3) {
            statusClass = 'status-expired';
            statusText = `${daysLeft} days`;
        }
        
        return `
            <tr>
                <td>${trial.email}</td>
                <td>${trial.site_name}</td>
                <td>${formatDate(trial.trial_start)}</td>
                <td>${formatDate(trial.trial_expiry)}</td>
                <td>${daysLeft > 0 ? daysLeft : 0}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${!trial.has_paid ? `
                        <button class="btn btn-sm btn-warning" onclick="openExtendTrialModal('${trial.email}', '${trial.site_name}', '${trial.trial_expiry}')">Extend</button>
                        <button class="btn btn-sm btn-success" onclick="upgradeToFull('${trial.email}', '${trial.site_name}')">Upgrade</button>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

async function loadTemplates() {
    try {
        const response = await authFetch('/api/admin/templates');
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
                    <span class="status-badge ${template.enabled ? 'status-active' : 'status-expired'}" style="margin-left: 8px;">
                        ${template.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <div class="template-actions">
                        <button class="btn btn-sm btn-secondary" onclick="openTemplateModal(${index})">Edit</button>
                        <button class="btn btn-sm ${template.enabled ? 'btn-danger' : 'btn-success'}" onclick="toggleTemplate(${index})">
                            ${template.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${index})">Delete</button>
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
    
    // Reset thumbnail preview
    document.getElementById('thumbnail-preview').style.display = 'none';
    document.getElementById('thumbnail-preview-img').src = '';
    
    if (index >= 0 && templates[index]) {
        title.textContent = 'Edit Template';
        const t = templates[index];
        document.getElementById('template-id').value = t.base_site_name;
        document.getElementById('template-name').value = t.name;
        document.getElementById('template-description').value = t.description || '';
        document.getElementById('template-thumbnail').value = t.custom_thumbnail || '';
        document.getElementById('template-enabled').checked = t.enabled;
        
        // Show existing thumbnail preview if exists
        if (t.custom_thumbnail) {
            showThumbnailPreview(t.custom_thumbnail);
        }
    } else {
        title.textContent = 'Add Template';
    }
    
    modal.classList.add('active');
}

function closeTemplateModal() {
    document.getElementById('template-modal').classList.remove('active');
}

async function handleTemplateSave(e) {
    e.preventDefault();
    
    const index = parseInt(document.getElementById('template-index').value);
    const template = {
        base_site_name: document.getElementById('template-id').value,
        name: document.getElementById('template-name').value,
        description: document.getElementById('template-description').value,
        custom_thumbnail: document.getElementById('template-thumbnail').value || null,
        enabled: document.getElementById('template-enabled').checked
    };
    
    try {
        const url = index >= 0 ? `/api/admin/templates/${index}` : '/api/admin/templates';
        const method = index >= 0 ? 'PUT' : 'POST';
        
        const response = await authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeTemplateModal();
            loadTemplates();
        } else {
            alert(data.error || 'Failed to save template');
        }
    } catch (error) {
        alert('Failed to save template');
    }
}

async function toggleTemplate(index) {
    if (!templates[index]) return;
    
    const template = { ...templates[index], enabled: !templates[index].enabled };
    
    try {
        const response = await authFetch(`/api/admin/templates/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });
        
        if (response.ok) {
            loadTemplates();
        }
    } catch (error) {
        alert('Failed to update template');
    }
}

async function deleteTemplate(index) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
        const response = await authFetch(`/api/admin/templates/${index}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTemplates();
        }
    } catch (error) {
        alert('Failed to delete template');
    }
}

// Thumbnail upload handling
async function handleThumbnailUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload an image file (JPEG, PNG, GIF, or WebP)');
        e.target.value = '';
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
    }
    
    const formData = new FormData();
    formData.append('thumbnail', file);
    
    try {
        const response = await fetch('/api/admin/upload-thumbnail', {
            method: 'POST',
            headers: {
                'X-Admin-Session': sessionId
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Set the URL in the input field
            document.getElementById('template-thumbnail').value = data.url;
            // Show preview
            showThumbnailPreview(data.url);
        } else {
            alert(data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload thumbnail');
    }
    
    // Reset file input for future uploads
    e.target.value = '';
}

function showThumbnailPreview(url) {
    const preview = document.getElementById('thumbnail-preview');
    const img = document.getElementById('thumbnail-preview-img');
    img.src = url;
    preview.style.display = 'block';
}

function removeThumbnail() {
    document.getElementById('template-thumbnail').value = '';
    document.getElementById('thumbnail-preview').style.display = 'none';
    document.getElementById('thumbnail-preview-img').src = '';
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
        const response = await authFetch('/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Password updated successfully');
            e.target.reset();
        } else {
            alert(data.error || 'Failed to update password');
        }
    } catch (error) {
        alert('Failed to update password');
    }
}

async function importDudaClients() {
    if (!confirm('This will import all existing clients from DUDA. Continue?')) return;
    
    const btn = document.getElementById('import-clients-btn');
    const btn2 = document.getElementById('import-clients-btn-2');
    
    [btn, btn2].forEach(b => {
        if (b) {
            b.disabled = true;
            b.innerHTML = '<span class="loading-spinner"></span> Importing...';
        }
    });
    
    try {
        const response = await authFetch('/api/admin/import-duda-clients', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Import complete!\n\nImported: ${data.imported}\nAlready existed: ${data.skipped}\nErrors: ${data.errors?.length || 0}`);
            loadDashboardData();
            loadClients(1);
        } else {
            alert(data.error || 'Import failed');
        }
    } catch (error) {
        alert('Import failed: ' + error.message);
    } finally {
        [btn, btn2].forEach(b => {
            if (b) {
                b.disabled = false;
                b.innerHTML = 'Import DUDA Clients';
            }
        });
    }
}

async function clearAllSites() {
    if (!confirm('Are you sure you want to clear ALL sites and legacy clients?\n\nThis action cannot be undone!')) return;
    
    // Double confirm for safety
    if (!confirm('This will permanently delete all imported sites. Are you absolutely sure?')) return;
    
    const btn = document.getElementById('clear-sites-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Clearing...';
    }
    
    try {
        const response = await authFetch('/api/admin/clear-sites', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Cleared successfully!\n\nSites removed: ${data.sitesDeleted}\nClients removed: ${data.clientsDeleted}`);
            loadDashboardData();
            loadClients(1);
            loadSites(1);
        } else {
            alert(data.error || 'Clear failed');
        }
    } catch (error) {
        alert('Clear failed: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Clear All Sites';
        }
    }
}

async function handleAddClient(e) {
    e.preventDefault();
    
    const client = {
        email: document.getElementById('client-email').value,
        firstName: document.getElementById('client-first-name').value,
        lastName: document.getElementById('client-last-name').value,
        churchName: document.getElementById('client-church').value,
        phone: document.getElementById('client-phone').value
    };
    
    try {
        const response = await authFetch('/api/admin/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('client-modal');
            loadClients(1);
            alert('Client added successfully');
        } else {
            alert(data.error || 'Failed to add client');
        }
    } catch (error) {
        alert('Failed to add client');
    }
}

async function sendMagicLink(email) {
    if (!confirm(`Send portal access link to ${email}?`)) return;
    
    try {
        const response = await authFetch('/api/admin/send-access-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.emailSent ? 'Access link sent successfully!' : 'Link generated (check server logs)');
        } else {
            alert(data.error || 'Failed to send access link');
        }
    } catch (error) {
        alert('Failed to send access link');
    }
}

function viewClient(email) {
    // Switch to clients section with search
    switchSection('clients');
    document.getElementById('client-search').value = email;
    loadClients(1);
}

function previewSite(siteName, previewUrl) {
    // Use the stored preview URL if available, otherwise try common patterns
    if (previewUrl && previewUrl !== 'null' && previewUrl !== 'undefined') {
        window.open(previewUrl, '_blank');
    } else {
        // Fallback to DUDA preview (may not work for all sites)
        alert('No live URL found for this site. The site may not be published yet.');
    }
}

async function editSite(siteName) {
    // Generate SSO link to open DUDA editor
    try {
        const response = await authFetch(`/api/admin/site-editor-link/${siteName}`);
        const data = await response.json();
        
        if (data.success && data.editorUrl) {
            window.open(data.editorUrl, '_blank');
        } else {
            alert(data.error || 'Failed to generate editor link');
        }
    } catch (error) {
        console.error('Error getting editor link:', error);
        alert('Failed to generate editor link. Please try again.');
    }
}

function openExtendTrialModal(email, siteName, currentExpiry) {
    document.getElementById('extend-trial-email').value = email;
    document.getElementById('extend-trial-site').value = siteName;
    document.getElementById('extend-current-expiry').textContent = formatDate(currentExpiry);
    document.getElementById('extend-trial-modal').classList.add('active');
}

async function handleExtendTrial(e) {
    e.preventDefault();
    
    const email = document.getElementById('extend-trial-email').value;
    const siteName = document.getElementById('extend-trial-site').value;
    const days = parseInt(document.getElementById('extend-days').value);
    
    try {
        const response = await authFetch('/api/admin/extend-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, siteName, days })
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('extend-trial-modal');
            loadTrials(document.querySelector('.tab[data-trial-tab].active')?.dataset.trialTab || 'active');
            alert('Trial extended successfully!');
        } else {
            alert(data.error || 'Failed to extend trial');
        }
    } catch (error) {
        alert('Failed to extend trial');
    }
}

async function upgradeToFull(email, siteName) {
    if (!confirm(`Upgrade ${email} to full access (mark as paid)?`)) return;
    
    try {
        const response = await authFetch('/api/admin/upgrade-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, siteName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTrials(document.querySelector('.tab[data-trial-tab].active')?.dataset.trialTab || 'active');
            alert('Account upgraded successfully!');
        } else {
            alert(data.error || 'Failed to upgrade');
        }
    } catch (error) {
        alert('Failed to upgrade');
    }
}

async function handleTestEmail(e) {
    e.preventDefault();
    
    const email = {
        from: document.getElementById('email-from').value,
        to: document.getElementById('email-to').value,
        subject: document.getElementById('email-subject').value,
        body: document.getElementById('email-body').value
    };
    
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Sending...';
    
    try {
        const response = await authFetch('/api/admin/send-test-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(email)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Test email sent successfully!');
            e.target.reset();
        } else {
            alert(data.error || 'Failed to send email');
        }
    } catch (error) {
        alert('Failed to send email');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Test Email';
    }
}

async function loadApiStatus() {
    try {
        const response = await authFetch('/api/admin/api-status');
        const data = await response.json();
        
        if (data.success) {
            updateStatusBadge('duda-status', data.duda);
            updateStatusBadge('whmcs-status', data.whmcs);
            updateStatusBadge('postmark-status', data.postmark);
            updateStatusBadge('db-status', data.database);
            updateStatusBadge('cloudflare-status', data.cloudflare);
            
            window.cloudflareConfigured = data.cloudflare;
        }
    } catch (error) {
        console.error('Error loading API status:', error);
    }
}

function updateStatusBadge(id, isConnected) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = isConnected ? 'Connected' : 'Not Configured';
        el.className = `status-badge ${isConnected ? 'status-active' : 'status-expired'}`;
    }
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysLeft(expiryDate) {
    if (!expiryDate) return 0;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function renderPagination(containerId, total, currentPage, pageSize, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="(${callback.name})(${currentPage - 1})">Previous</button>`;
    
    for (let i = 1; i <= totalPages && i <= 5; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="(${callback.name})(${i})">${i}</button>`;
    }
    
    if (totalPages > 5) {
        html += `<span style="padding: 8px;">...</span>`;
        html += `<button onclick="(${callback.name})(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="(${callback.name})(${currentPage + 1})">Next</button>`;
    
    container.innerHTML = html;
}

// ============================================
// DNS MANAGEMENT FUNCTIONS
// ============================================

let allZones = [];
let currentZoneId = null;
let currentZoneName = null;

async function loadDnsZones() {
    const tbody = document.getElementById('zones-table-body');
    const notConfigured = document.getElementById('dns-not-configured');
    const configured = document.getElementById('dns-configured');
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><span class="loading-spinner"></span> Loading zones...</td></tr>';
    
    try {
        const response = await authFetch('/api/admin/cloudflare/zones');
        const data = await response.json();
        
        if (!data.success) {
            if (data.error && data.error.includes('not configured')) {
                notConfigured.style.display = 'block';
                configured.style.display = 'none';
                return;
            }
            throw new Error(data.error || 'Failed to load zones');
        }
        
        notConfigured.style.display = 'none';
        configured.style.display = 'block';
        
        allZones = data.zones || [];
        document.getElementById('zone-count').textContent = allZones.length;
        
        renderZonesTable(allZones);
    } catch (error) {
        console.error('Error loading zones:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #dc2626;">Error: ${error.message}</td></tr>`;
    }
}

function renderZonesTable(zones) {
    const tbody = document.getElementById('zones-table-body');
    
    if (zones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No domains found</td></tr>';
        return;
    }
    
    tbody.innerHTML = zones.map(zone => `
        <tr>
            <td><strong>${zone.name}</strong></td>
            <td>
                <span class="status-badge ${zone.status === 'active' ? 'status-active' : 'status-expired'}">
                    ${zone.status}
                </span>
            </td>
            <td>${zone.type || 'full'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openDnsRecords('${zone.id}', '${zone.name}')">
                    Manage DNS
                </button>
                <button class="btn btn-sm btn-warning" onclick="quickDudaSetup('${zone.id}', '${zone.name}')">
                    Point to DUDA
                </button>
            </td>
        </tr>
    `).join('');
}

function filterZones() {
    const search = document.getElementById('zone-search').value.toLowerCase();
    const filtered = allZones.filter(zone => zone.name.toLowerCase().includes(search));
    document.getElementById('zone-count').textContent = filtered.length;
    renderZonesTable(filtered);
}

async function openDnsRecords(zoneId, zoneName) {
    currentZoneId = zoneId;
    currentZoneName = zoneName;
    
    document.getElementById('dns-modal-title').textContent = `DNS Records - ${zoneName}`;
    document.getElementById('dns-records-modal').style.display = 'flex';
    
    await loadDnsRecords(zoneId);
}

async function loadDnsRecords(zoneId) {
    const tbody = document.getElementById('dns-records-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><span class="loading-spinner"></span> Loading records...</td></tr>';
    
    try {
        const response = await authFetch(`/api/admin/cloudflare/zones/${zoneId}/dns`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load DNS records');
        }
        
        const records = data.records || [];
        
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No DNS records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = records.map(record => `
            <tr>
                <td><span class="status-badge" style="background: #e0e7ff; color: #3730a3;">${record.type}</span></td>
                <td>${record.name.replace(`.${currentZoneName}`, '') === currentZoneName ? '@' : record.name.replace(`.${currentZoneName}`, '')}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${record.content}">${record.content}</td>
                <td>${record.proxied ? '<span style="color: #f97316;">Proxied</span>' : '<span style="color: #6b7280;">DNS only</span>'}</td>
                <td>${record.ttl === 1 ? 'Auto' : record.ttl + 's'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick='editDnsRecord(${JSON.stringify(record)})'>Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDnsRecord('${record.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading DNS records:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #dc2626;">Error: ${error.message}</td></tr>`;
    }
}

function closeDnsModal() {
    document.getElementById('dns-records-modal').style.display = 'none';
    currentZoneId = null;
    currentZoneName = null;
}

function openAddRecordModal() {
    document.getElementById('record-modal-title').textContent = 'Add DNS Record';
    document.getElementById('record-id').value = '';
    document.getElementById('record-zone-id').value = currentZoneId;
    document.getElementById('dns-record-form').reset();
    document.getElementById('record-proxied').checked = true;
    document.getElementById('edit-record-modal').style.display = 'flex';
}

function editDnsRecord(record) {
    document.getElementById('record-modal-title').textContent = 'Edit DNS Record';
    document.getElementById('record-id').value = record.id;
    document.getElementById('record-zone-id').value = currentZoneId;
    document.getElementById('record-type').value = record.type;
    document.getElementById('record-name').value = record.name.replace(`.${currentZoneName}`, '') === currentZoneName ? '@' : record.name.replace(`.${currentZoneName}`, '');
    document.getElementById('record-content').value = record.content;
    document.getElementById('record-ttl').value = record.ttl;
    document.getElementById('record-proxied').checked = record.proxied;
    
    if (record.type === 'MX') {
        document.getElementById('priority-group').style.display = 'block';
        document.getElementById('record-priority').value = record.priority || 10;
    } else {
        document.getElementById('priority-group').style.display = 'none';
    }
    
    document.getElementById('edit-record-modal').style.display = 'flex';
}

function closeRecordModal() {
    document.getElementById('edit-record-modal').style.display = 'none';
}

async function handleDnsRecordSubmit(e) {
    e.preventDefault();
    
    const recordId = document.getElementById('record-id').value;
    const zoneId = document.getElementById('record-zone-id').value;
    const isEdit = !!recordId;
    
    const recordData = {
        type: document.getElementById('record-type').value,
        name: document.getElementById('record-name').value,
        content: document.getElementById('record-content').value,
        ttl: parseInt(document.getElementById('record-ttl').value),
        proxied: document.getElementById('record-proxied').checked
    };
    
    if (recordData.type === 'MX') {
        recordData.priority = parseInt(document.getElementById('record-priority').value);
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Saving...';
    
    try {
        const url = isEdit 
            ? `/api/admin/cloudflare/zones/${zoneId}/dns/${recordId}`
            : `/api/admin/cloudflare/zones/${zoneId}/dns`;
        
        const response = await authFetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recordData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(JSON.stringify(data.error) || 'Failed to save record');
        }
        
        closeRecordModal();
        await loadDnsRecords(zoneId);
    } catch (error) {
        alert('Error saving DNS record: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Record';
    }
}

async function deleteDnsRecord(recordId) {
    if (!confirm('Are you sure you want to delete this DNS record?')) return;
    
    try {
        const response = await authFetch(`/api/admin/cloudflare/zones/${currentZoneId}/dns/${recordId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete record');
        }
        
        await loadDnsRecords(currentZoneId);
    } catch (error) {
        alert('Error deleting DNS record: ' + error.message);
    }
}

async function quickDudaSetup(zoneId, zoneName) {
    if (!confirm(`This will configure ${zoneName} to point to DUDA:\n\n- Root (@) A record → 34.102.136.180\n- www CNAME → cname.dudaone.com\n\nExisting records will be updated. Continue?`)) {
        return;
    }
    
    try {
        const response = await authFetch(`/api/admin/cloudflare/zones/${zoneId}/quick-setup/duda`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to configure domain');
        }
        
        alert(`Success! ${zoneName} is now configured for DUDA.\n\nChanges:\n${data.results.map(r => `${r.type}: ${r.action}`).join('\n')}`);
        
        if (currentZoneId === zoneId) {
            await loadDnsRecords(zoneId);
        }
    } catch (error) {
        alert('Error configuring domain for DUDA: ' + error.message);
    }
}

// Event listeners for DNS section
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('refresh-zones-btn')?.addEventListener('click', loadDnsZones);
    document.getElementById('search-zones-btn')?.addEventListener('click', filterZones);
    document.getElementById('zone-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterZones();
    });
    
    document.getElementById('close-dns-modal')?.addEventListener('click', closeDnsModal);
    document.getElementById('add-record-btn')?.addEventListener('click', openAddRecordModal);
    document.getElementById('quick-duda-btn')?.addEventListener('click', () => quickDudaSetup(currentZoneId, currentZoneName));
    
    document.getElementById('close-record-modal')?.addEventListener('click', closeRecordModal);
    document.getElementById('cancel-record-btn')?.addEventListener('click', closeRecordModal);
    document.getElementById('dns-record-form')?.addEventListener('submit', handleDnsRecordSubmit);
    
    document.getElementById('record-type')?.addEventListener('change', (e) => {
        const priorityGroup = document.getElementById('priority-group');
        if (e.target.value === 'MX') {
            priorityGroup.style.display = 'block';
        } else {
            priorityGroup.style.display = 'none';
        }
    });
    
    document.getElementById('dns-records-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'dns-records-modal') closeDnsModal();
    });
    
    document.getElementById('edit-record-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'edit-record-modal') closeRecordModal();
    });
});
