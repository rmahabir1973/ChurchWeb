// app.js - Frontend JavaScript for Church Web Global 5-Step Funnel

const state = {
    currentStep: 1,
    totalSteps: 5,
    selectedTemplate: null,
    churchInfo: {},
    suggestedPages: [],
    selectedPages: [],
    pageContent: {},
    createdSite: null,
    previewUrl: null
};

document.addEventListener('DOMContentLoaded', () => {
    initializeFunnel();
});

function initializeFunnel() {
    loadTemplates();
    setupAllListeners();
}

function setupAllListeners() {
    document.getElementById('step1-next')?.addEventListener('click', () => {
        if (state.selectedTemplate) goToStep(2);
    });
    
    document.getElementById('step2-back')?.addEventListener('click', () => goToStep(1));
    document.getElementById('step2-next')?.addEventListener('click', handleStep2Submit);
    
    document.getElementById('step3-back')?.addEventListener('click', () => goToStep(2));
    document.getElementById('step3-next')?.addEventListener('click', handleStep3Submit);
    
    document.getElementById('step4-back')?.addEventListener('click', () => goToStep(3));
    document.getElementById('step4-next')?.addEventListener('click', () => goToStep(5));
    
    document.getElementById('step5-back')?.addEventListener('click', () => goToStep(4));
    document.getElementById('step5-finish')?.addEventListener('click', handleSignup);
}

async function loadTemplates() {
    const grid = document.getElementById('templates-grid');
    const loading = document.getElementById('templates-loading');

    try {
        const response = await fetch('/api/templates/custom');
        const data = await response.json();
        loading.style.display = 'none';

        if (data.success && data.templates?.length > 0) {
            renderTemplates(data.templates);
        } else {
            renderMockTemplates();
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        loading.style.display = 'none';
        renderMockTemplates();
    }
}

function renderTemplates(templates) {
    const grid = document.getElementById('templates-grid');
    grid.innerHTML = '';

    templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = template.template_id || template.id;

        const thumbnailUrl = template.desktop_thumbnail_url || template.thumbnail_url;
        const hasImage = thumbnailUrl && !thumbnailUrl.includes('null');
        
        card.innerHTML = `
            <div class="template-image">
                ${hasImage 
                    ? `<img src="${thumbnailUrl}" alt="${template.template_name || template.name}" onerror="this.parentElement.innerHTML='<span style=font-size:64px>⛪</span>'">`
                    : `<span style="font-size: 64px;">${template.icon || '⛪'}</span>`}
            </div>
            <div class="template-info">
                <h3>${template.template_name || template.name}</h3>
                <p>${template.description || 'Professional church website template'}</p>
            </div>
        `;

        card.addEventListener('click', () => selectTemplate(template, card));
        grid.appendChild(card);
    });
}

function renderMockTemplates() {
    const mockTemplates = [
        { id: 'modern-church', template_id: 'modern-church', name: 'Modern Church', template_name: 'Modern Church', description: 'Clean and contemporary design', icon: '⛪' },
        { id: 'traditional-faith', template_id: 'traditional-faith', name: 'Traditional Faith', template_name: 'Traditional Faith', description: 'Classic church aesthetic', icon: '✝️' },
        { id: 'community-focused', template_id: 'community-focused', name: 'Community Focused', template_name: 'Community Focused', description: 'Welcoming and warm design', icon: '🤝' },
        { id: 'youth-ministry', template_id: 'youth-ministry', name: 'Youth Ministry', template_name: 'Youth Ministry', description: 'Vibrant and energetic style', icon: '🌟' },
        { id: 'contemporary-worship', template_id: 'contemporary-worship', name: 'Contemporary Worship', template_name: 'Contemporary Worship', description: 'Modern worship design', icon: '🎵' },
        { id: 'ministry-hub', template_id: 'ministry-hub', name: 'Ministry Hub', template_name: 'Ministry Hub', description: 'Multi-ministry focused', icon: '🏛️' }
    ];
    renderTemplates(mockTemplates);
}

function selectTemplate(template, cardElement) {
    document.querySelectorAll('.template-card').forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');
    state.selectedTemplate = template;
    document.getElementById('step1-next').disabled = false;
}

async function handleStep2Submit() {
    const form = document.getElementById('church-info-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    state.churchInfo = {
        churchName: document.getElementById('church-name').value,
        email: document.getElementById('church-email').value,
        phone: document.getElementById('church-phone').value,
        address: document.getElementById('church-address').value,
        description: document.getElementById('church-description').value,
        serviceTime: document.getElementById('service-time').value,
        pastorName: document.getElementById('pastor-name').value,
        denomination: document.getElementById('denomination').value
    };

    goToStep(3);
    await loadPageSuggestions();
}

async function loadPageSuggestions() {
    const loading = document.getElementById('ai-loading');
    const container = document.getElementById('pages-container');
    
    loading.style.display = 'block';
    container.style.display = 'none';

    try {
        const response = await fetch('/api/ai/suggest-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.churchInfo)
        });
        const data = await response.json();

        loading.style.display = 'none';
        container.style.display = 'block';

        if (data.success && data.suggestions) {
            state.suggestedPages = data.suggestions;
            renderPageSuggestions(data.suggestions);
        } else {
            renderDefaultPages();
        }
    } catch (error) {
        console.error('Error getting suggestions:', error);
        loading.style.display = 'none';
        container.style.display = 'block';
        renderDefaultPages();
    }
}

function renderPageSuggestions(pages) {
    const suggestedGrid = document.getElementById('suggested-pages');
    const optionalGrid = document.getElementById('optional-pages');
    
    suggestedGrid.innerHTML = '';
    optionalGrid.innerHTML = '';

    const recommended = pages.filter(p => p.priority <= 2 || p.required);
    const optional = pages.filter(p => p.priority > 2 && !p.required);

    recommended.forEach(page => {
        suggestedGrid.appendChild(createPageCard(page, true));
    });

    optional.forEach(page => {
        optionalGrid.appendChild(createPageCard(page, false));
    });
}

function renderDefaultPages() {
    const defaultPages = [
        { name: 'Home', slug: 'home', description: 'Welcome page', priority: 1, required: true },
        { name: 'About Us', slug: 'about', description: 'Church story and mission', priority: 2 },
        { name: 'Services', slug: 'services', description: 'Service times', priority: 2 },
        { name: 'Contact', slug: 'contact', description: 'Contact information', priority: 2 },
        { name: 'Ministries', slug: 'ministries', description: 'Ministry programs', priority: 3 },
        { name: 'Sermons', slug: 'sermons', description: 'Past messages', priority: 3 },
        { name: 'Events', slug: 'events', description: 'Upcoming events', priority: 3 },
        { name: 'Give', slug: 'give', description: 'Online giving', priority: 4 }
    ];
    state.suggestedPages = defaultPages;
    renderPageSuggestions(defaultPages);
}

function createPageCard(page, checked) {
    const div = document.createElement('div');
    div.className = 'page-card-wrapper';
    
    const icons = {
        home: '🏠', about: 'ℹ️', services: '⛪', contact: '📧',
        ministries: '🙏', sermons: '🎤', events: '📅', give: '💝',
        connect: '🤝', prayer: '🙏', blog: '📝'
    };

    div.innerHTML = `
        <label class="page-checkbox">
            <input type="checkbox" name="page" value="${page.slug}" ${checked ? 'checked' : ''} ${page.required ? 'disabled checked' : ''} onchange="togglePageContent('${page.slug}', this.checked)">
            <div class="checkbox-card">
                <span class="page-icon">${icons[page.slug] || '📄'}</span>
                <h4>${page.name}</h4>
                <p>${page.description}</p>
                ${page.required ? '<span class="required-badge">Required</span>' : ''}
            </div>
        </label>
        <div class="page-content-section" id="content-${page.slug}" style="display: ${checked ? 'block' : 'none'};">
            <div class="content-header">
                <span>Page Content (Optional)</span>
                <button type="button" class="btn-ai-generate" onclick="generatePageContent('${page.slug}', '${page.name}')">
                    <span class="ai-icon">✨</span> Generate with AI
                </button>
            </div>
            <textarea 
                id="textarea-${page.slug}" 
                class="page-content-textarea" 
                placeholder="Add content for your ${page.name} page, or click 'Generate with AI' to get started..."
                rows="4"
            ></textarea>
            <div class="ai-generating" id="generating-${page.slug}" style="display: none;">
                <span class="spinner-small"></span> Generating content...
            </div>
        </div>
    `;

    return div;
}

function togglePageContent(slug, isChecked) {
    const contentSection = document.getElementById(`content-${slug}`);
    if (contentSection) {
        contentSection.style.display = isChecked ? 'block' : 'none';
    }
}

async function generatePageContent(slug, pageName) {
    const textarea = document.getElementById(`textarea-${slug}`);
    const generating = document.getElementById(`generating-${slug}`);
    const btn = document.querySelector(`#content-${slug} .btn-ai-generate`);
    
    if (!textarea) return;
    
    btn.disabled = true;
    generating.style.display = 'flex';
    
    try {
        const response = await fetch('/api/ai/generate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pageName: slug,
                churchInfo: state.churchInfo
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.content) {
            textarea.value = data.content;
            state.pageContent = state.pageContent || {};
            state.pageContent[slug] = data.content;
        } else {
            alert('Could not generate content. Please try again or write your own.');
        }
    } catch (error) {
        console.error('AI generation error:', error);
        alert('Error generating content. Please try again.');
    } finally {
        btn.disabled = false;
        generating.style.display = 'none';
    }
}

// Store content when user types
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('page-content-textarea')) {
        const slug = e.target.id.replace('textarea-', '');
        state.pageContent = state.pageContent || {};
        state.pageContent[slug] = e.target.value;
    }
});

async function handleStep3Submit() {
    const checkboxes = document.querySelectorAll('input[name="page"]:checked');
    state.selectedPages = Array.from(checkboxes).map(cb => {
        const pageInfo = state.suggestedPages.find(p => p.slug === cb.value);
        const content = state.pageContent?.[cb.value] || '';
        return { 
            ...(pageInfo || { slug: cb.value, name: cb.value }),
            content: content
        };
    });

    goToStep(4);
    await createSitePreview();
}

async function createSitePreview() {
    const loading = document.getElementById('preview-loading');
    const section = document.getElementById('preview-section');
    
    loading.style.display = 'block';
    section.style.display = 'none';

    try {
        const response = await fetch('/api/sites/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                templateId: state.selectedTemplate.template_id || state.selectedTemplate.id,
                churchInfo: state.churchInfo,
                pages: state.selectedPages
            })
        });

        const data = await response.json();
        loading.style.display = 'none';

        if (data.success) {
            state.createdSite = data.site;
            state.previewUrl = data.previewUrl;
            displayPreview(data);
        } else {
            alert('Error creating preview. Please try again.');
            console.error('Site creation error:', data.error);
        }
    } catch (error) {
        loading.style.display = 'none';
        console.error('Error creating site:', error);
        alert('Error creating preview. Please try again.');
    }
}

function displayPreview(data) {
    const section = document.getElementById('preview-section');
    const siteName = document.getElementById('preview-site-name');
    const previewLink = document.getElementById('preview-link');
    const iframe = document.getElementById('preview-iframe');

    siteName.textContent = state.churchInfo.churchName;
    previewLink.href = data.previewUrl || '#';
    
    if (data.previewUrl) {
        iframe.src = data.previewUrl;
    }

    section.style.display = 'block';
    
    document.getElementById('signup-email').value = state.churchInfo.email;
}

async function handleSignup() {
    const form = document.getElementById('signup-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const selectedPlan = document.querySelector('input[name="plan"]:checked');
    if (!selectedPlan) {
        alert('Please select a plan');
        return;
    }

    const signupData = {
        siteName: state.createdSite?.site_name,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
        plan: selectedPlan.value,
        churchName: state.churchInfo.churchName,
        firstName: state.churchInfo.contactName?.split(' ')[0] || state.churchInfo.churchName,
        lastName: state.churchInfo.contactName?.split(' ').slice(1).join(' ') || 'Church'
    };

    const finishBtn = document.getElementById('step5-finish');
    finishBtn.disabled = true;
    finishBtn.textContent = 'Creating Account...';

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData)
        });

        const data = await response.json();

        if (data.success) {
            state.invoiceId = data.invoiceId;
            state.orderId = data.orderId;
            showSuccess(signupData.plan, data);
        } else {
            alert('Signup failed: ' + (data.error || 'Please try again'));
            finishBtn.disabled = false;
            finishBtn.textContent = 'Create Account & Pay';
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
        finishBtn.disabled = false;
        finishBtn.textContent = 'Create Account & Pay';
    }
}

function showSuccess(plan, signupData = {}) {
    document.querySelectorAll('.funnel-step').forEach(step => step.classList.remove('active'));
    document.getElementById('step-success').style.display = 'block';
    document.getElementById('step-success').classList.add('active');
    
    document.getElementById('success-site-name').textContent = state.churchInfo.churchName;
    document.getElementById('success-plan').textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    
    document.querySelector('.progress-container').style.display = 'none';
    
    // If we have invoice info, start polling for payment status
    if (signupData.invoiceId) {
        startPaymentPolling(signupData.invoiceId, state.createdSite?.site_name);
    }
}

async function startPaymentPolling(invoiceId, siteName) {
    const statusEl = document.getElementById('payment-status');
    const publishBtn = document.getElementById('publish-site-btn');
    
    if (!statusEl) return;
    
    statusEl.textContent = 'Waiting for payment...';
    statusEl.className = 'payment-status pending';
    
    const checkPayment = async () => {
        try {
            const response = await fetch(`/api/invoice/${invoiceId}/status`);
            const data = await response.json();
            
            if (data.success && data.isPaid) {
                statusEl.textContent = 'Payment confirmed!';
                statusEl.className = 'payment-status paid';
                
                if (publishBtn) {
                    publishBtn.disabled = false;
                    publishBtn.textContent = 'Publish Your Site Now';
                    publishBtn.onclick = () => publishSite(siteName, invoiceId);
                }
                return; // Stop polling
            } else {
                statusEl.textContent = 'Payment pending - complete payment in WHMCS';
                setTimeout(checkPayment, 10000); // Check every 10 seconds
            }
        } catch (error) {
            console.error('Payment check error:', error);
            setTimeout(checkPayment, 15000);
        }
    };
    
    // Start polling after a short delay
    setTimeout(checkPayment, 5000);
}

async function publishSite(siteName, invoiceId) {
    const publishBtn = document.getElementById('publish-site-btn');
    if (publishBtn) {
        publishBtn.disabled = true;
        publishBtn.textContent = 'Publishing...';
    }
    
    try {
        const response = await fetch(`/api/sites/${siteName}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoiceId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const statusEl = document.getElementById('payment-status');
            if (statusEl) {
                statusEl.textContent = 'Site is now live!';
                statusEl.className = 'payment-status published';
            }
            
            if (publishBtn) {
                publishBtn.textContent = 'View Live Site';
                publishBtn.disabled = false;
                publishBtn.onclick = () => window.open(data.siteUrl, '_blank');
            }
            
            const liveUrl = document.getElementById('live-site-url');
            if (liveUrl && data.siteUrl) {
                liveUrl.href = data.siteUrl;
                liveUrl.textContent = data.siteUrl;
                liveUrl.style.display = 'block';
            }
        } else {
            alert('Could not publish site: ' + (data.error || 'Please try again'));
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = 'Try Again';
            }
        }
    } catch (error) {
        console.error('Publish error:', error);
        alert('Error publishing site. Please try again.');
        if (publishBtn) {
            publishBtn.disabled = false;
            publishBtn.textContent = 'Try Again';
        }
    }
}

function goToStep(stepNumber) {
    document.querySelectorAll('.funnel-step').forEach(step => step.classList.remove('active'));
    
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    updateProgressBar(stepNumber);
    state.currentStep = stepNumber;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar(currentStep) {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
}
