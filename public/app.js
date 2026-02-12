// app.js - Frontend JavaScript for Church Web Global 4-Step Funnel

const state = {
    currentStep: 1,
    totalSteps: 4,
    selectedTemplate: null,
    churchInfo: {},
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
    document.getElementById('step3-next')?.addEventListener('click', () => goToStep(4));
    
    document.getElementById('step4-back')?.addEventListener('click', () => goToStep(3));
    document.getElementById('step4-finish')?.addEventListener('click', handleSignup);
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
        tagline: document.getElementById('church-tagline').value,
        mission: document.getElementById('church-description').value,
        story: document.getElementById('church-story').value,
        serviceTime: document.getElementById('service-time').value,
        pastorName: document.getElementById('pastor-name').value,
        denomination: document.getElementById('denomination').value
    };

    goToStep(3);
    await createSitePreview();
}

async function createSitePreview() {
    const loading = document.getElementById('preview-loading');
    const section = document.getElementById('preview-section');
    
    loading.style.display = 'block';
    section.style.display = 'none';

    try {
        // Build collection data for Replit1 from church info
        const collectionData = {
            collectionName: 'Replit1',
            rows: [{
                Welcome_Message: `Welcome to ${state.churchInfo.churchName}`,
                tagline: state.churchInfo.tagline || `A community of faith in ${state.churchInfo.city || 'your city'}`,
                About_short_blurb: state.churchInfo.mission || `${state.churchInfo.churchName} is a welcoming church community.`,
                About_Story: state.churchInfo.story || `${state.churchInfo.churchName} was founded to serve our community and share the love of God with everyone who walks through our doors.`
            }]
        };

        const response = await fetch('/api/sites/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                templateId: state.selectedTemplate.template_id || state.selectedTemplate.id,
                churchInfo: state.churchInfo,
                collectionData: collectionData
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

async function displayPreview(data) {
    const section = document.getElementById('preview-section');
    const siteName = document.getElementById('preview-site-name');
    const previewLink = document.getElementById('preview-link');
    const editorLink = document.getElementById('editor-link');
    const iframe = document.getElementById('preview-iframe');

    siteName.textContent = state.churchInfo.churchName;
    previewLink.href = data.previewUrl || '#';
    
    if (data.previewUrl) {
        iframe.src = data.previewUrl;
    }

    section.style.display = 'block';
    
    document.getElementById('signup-email').value = state.churchInfo.email;
    
    // Start free trial automatically
    if (state.createdSite?.site_name && state.churchInfo.email) {
        try {
            const trialResponse = await fetch('/api/trial/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: state.churchInfo.email,
                    siteName: state.createdSite.site_name,
                    churchName: state.churchInfo.churchName
                })
            });
            const trialData = await trialResponse.json();
            
            if (trialData.success) {
                state.trial = trialData.trial;
                console.log('Trial started:', trialData.message);
                
                // Show trial banner
                const trialBanner = document.getElementById('trial-banner');
                if (trialBanner) {
                    trialBanner.style.display = 'flex';
                }
                
                // Get SSO editor link
                const editorResponse = await fetch('/api/trial/editor-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: state.churchInfo.email,
                        siteName: state.createdSite.site_name
                    })
                });
                const editorData = await editorResponse.json();
                
                if (editorData.success && editorData.editorUrl) {
                    editorLink.href = editorData.editorUrl;
                    editorLink.style.display = 'inline-block';
                    editorLink.textContent = 'Customize in Editor';
                    state.editorUrl = editorData.editorUrl;
                }
            }
        } catch (error) {
            console.log('Trial setup note:', error.message);
            // Continue without trial - they can still preview
        }
    }
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

    const finishBtn = document.getElementById('step4-finish');
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
    
    // Show trial days remaining
    const trialDaysEl = document.getElementById('trial-days-remaining');
    if (trialDaysEl && state.trial) {
        trialDaysEl.textContent = `${state.trial.daysRemaining || 14} days remaining`;
    }
    
    // Setup "Continue Editing" button
    const openEditorBtn = document.getElementById('open-editor-btn');
    if (openEditorBtn && state.editorUrl) {
        openEditorBtn.onclick = () => window.open(state.editorUrl, '_blank');
    } else if (openEditorBtn) {
        openEditorBtn.style.display = 'none';
    }
    
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
