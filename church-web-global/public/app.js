// app.js - Frontend JavaScript for Church Web Global Funnel

// State management
const state = {
    currentStep: 1,
    selectedTemplate: null,
    selectedPages: ['home', 'about', 'ministries', 'events', 'contact'],
    customization: {},
    createdSite: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeFunnel();
});

function initializeFunnel() {
    // Load templates on step 1
    if (document.getElementById('step1')) {
        loadTemplates();
        setupStep1Listeners();
    }

    // Setup listeners for all steps
    setupStep2Listeners();
    setupStep3Listeners();
    setupStep4Listeners();
}

// =====================================
// STEP 1: Template Selection
// =====================================

async function loadTemplates() {
    const templatesGrid = document.getElementById('templates-grid');
    const loadingDiv = document.getElementById('templates-loading');
    const errorDiv = document.getElementById('templates-error');

    try {
        const response = await fetch('/api/templates');
        const data = await response.json();

        loadingDiv.style.display = 'none';

        if (data.success && data.templates) {
            // If DUDA returns templates, use them
            displayTemplates(data.templates);
        } else {
            // Fallback to mock templates for demo
            displayMockTemplates();
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        loadingDiv.style.display = 'none';
        
        // Show mock templates as fallback
        displayMockTemplates();
    }
}

function displayTemplates(templates) {
    const templatesGrid = document.getElementById('templates-grid');
    templatesGrid.innerHTML = '';

    templates.forEach(template => {
        const card = createTemplateCard(template);
        templatesGrid.appendChild(card);
    });
}

function displayMockTemplates() {
    const templatesGrid = document.getElementById('templates-grid');
    templatesGrid.innerHTML = '';

    const mockTemplates = [
        { id: 'modern-church', name: 'Modern Church', description: 'Clean and contemporary design', icon: '⛪' },
        { id: 'traditional-faith', name: 'Traditional Faith', description: 'Classic church aesthetic', icon: '✝️' },
        { id: 'community-focused', name: 'Community Focused', description: 'Welcoming and warm design', icon: '🤝' },
        { id: 'youth-ministry', name: 'Youth Ministry', description: 'Vibrant and energetic style', icon: '🌟' },
        { id: 'contemporary-worship', name: 'Contemporary Worship', description: 'Modern worship design', icon: '🎵' },
        { id: 'ministry-hub', name: 'Ministry Hub', description: 'Multi-ministry focused', icon: '🏛️' }
    ];

    mockTemplates.forEach(template => {
        const card = createTemplateCard(template);
        templatesGrid.appendChild(card);
    });
}

function createTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.dataset.templateId = template.id || template.template_id;

    card.innerHTML = `
        <div class="template-image">
            <span style="font-size: 64px;">${template.icon || '⛪'}</span>
        </div>
        <div class="template-info">
            <h3>${template.name || template.template_name}</h3>
            <p>${template.description || 'Professional church website template'}</p>
        </div>
    `;

    card.addEventListener('click', () => selectTemplate(template, card));

    return card;
}

function selectTemplate(template, cardElement) {
    // Remove selection from all cards
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    cardElement.classList.add('selected');

    // Update state
    state.selectedTemplate = template;

    // Enable next button
    document.getElementById('step1-next').disabled = false;
}

function setupStep1Listeners() {
    const nextButton = document.getElementById('step1-next');
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (state.selectedTemplate) {
                goToStep(2);
            }
        });
    }
}

// =====================================
// STEP 2: Page Selection
// =====================================

function setupStep2Listeners() {
    const backButton = document.getElementById('step2-back');
    const nextButton = document.getElementById('step2-next');

    if (backButton) {
        backButton.addEventListener('click', () => goToStep(1));
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            updateSelectedPages();
            goToStep(3);
        });
    }

    // Track checkbox changes
    const checkboxes = document.querySelectorAll('input[name="page"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedPages);
    });
}

function updateSelectedPages() {
    const checkboxes = document.querySelectorAll('input[name="page"]:checked');
    state.selectedPages = Array.from(checkboxes).map(cb => cb.value);
}

// =====================================
// STEP 3: Customization
// =====================================

function setupStep3Listeners() {
    const backButton = document.getElementById('step3-back');
    const nextButton = document.getElementById('step3-next');

    if (backButton) {
        backButton.addEventListener('click', () => goToStep(2));
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (validateCustomizationForm()) {
                collectCustomizationData();
                createSitePreview();
            }
        });
    }
}

function validateCustomizationForm() {
    const form = document.getElementById('customization-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    return true;
}

function collectCustomizationData() {
    state.customization = {
        churchName: document.getElementById('church-name').value,
        email: document.getElementById('church-email').value,
        phone: document.getElementById('church-phone').value,
        address: document.getElementById('church-address').value,
        description: document.getElementById('church-description').value,
        serviceTime: document.getElementById('service-time').value,
        pastorName: document.getElementById('pastor-name').value,
        social: {
            facebook: document.getElementById('facebook-url').value,
            instagram: document.getElementById('instagram-url').value,
            youtube: document.getElementById('youtube-url').value
        }
    };
}

// =====================================
// STEP 4: Preview & Signup
// =====================================

async function createSitePreview() {
    goToStep(4);

    const loadingDiv = document.getElementById('site-creating');
    const previewContainer = document.getElementById('preview-container');

    loadingDiv.style.display = 'block';
    previewContainer.style.display = 'none';

    try {
        const response = await fetch('/api/sites/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                templateId: state.selectedTemplate.id || state.selectedTemplate.template_id,
                siteName: state.customization.churchName,
                pages: state.selectedPages,
                customization: state.customization
            })
        });

        const data = await response.json();

        loadingDiv.style.display = 'none';

        if (data.success) {
            state.createdSite = data.site;
            displaySitePreview(data);
        } else {
            alert('Error creating site preview. Please try again or contact support.');
            console.error('Site creation error:', data.error);
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        console.error('Error creating site:', error);
        alert('Error creating site preview. Please try again or contact support.');
    }
}

function displaySitePreview(data) {
    const previewContainer = document.getElementById('preview-container');
    const siteName = document.getElementById('preview-site-name');
    const previewLink = document.getElementById('preview-link');

    siteName.textContent = state.customization.churchName;
    previewLink.href = data.previewUrl || '#';

    // Pre-fill signup email
    document.getElementById('signup-email').value = state.customization.email;

    previewContainer.style.display = 'block';
}

function setupStep4Listeners() {
    const backButton = document.getElementById('step4-back');
    const finishButton = document.getElementById('step4-finish');

    if (backButton) {
        backButton.addEventListener('click', () => goToStep(3));
    }

    if (finishButton) {
        finishButton.addEventListener('click', handleSignup);
    }
}

async function handleSignup() {
    const signupForm = document.getElementById('signup-form');
    
    if (!signupForm.checkValidity()) {
        signupForm.reportValidity();
        return;
    }

    const selectedPlan = document.querySelector('input[name="plan"]:checked');
    if (!selectedPlan) {
        alert('Please select a plan');
        return;
    }

    const signupData = {
        siteName: state.createdSite?.site_name || state.customization.churchName,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
        plan: selectedPlan.value,
        churchName: state.customization.churchName
    };

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupData)
        });

        const data = await response.json();

        if (data.success) {
            // Success! Redirect to success page or dashboard
            showSuccessMessage();
        } else {
            alert('Signup failed. Please try again or contact support.');
            console.error('Signup error:', data.error);
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again or contact support.');
    }
}

function showSuccessMessage() {
    const container = document.querySelector('.funnel-container .container');
    container.innerHTML = `
        <div style="text-align: center; padding: 80px 20px;">
            <div style="font-size: 80px; margin-bottom: 24px;">🎉</div>
            <h2 style="font-size: 36px; margin-bottom: 16px;">Welcome to Church Web Global!</h2>
            <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 32px;">
                Your church website has been created and published successfully!
            </p>
            <p style="margin-bottom: 32px;">
                You'll receive a confirmation email shortly with your login details and next steps.
            </p>
            <a href="/" class="btn btn-primary">Return to Home</a>
        </div>
    `;
}

// =====================================
// Navigation
// =====================================

function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.funnel-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress bar
    updateProgressBar(stepNumber);

    // Update state
    state.currentStep = stepNumber;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar(currentStep) {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// =====================================
// Utility Functions
// =====================================

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        state,
        goToStep,
        selectTemplate,
        updateSelectedPages,
        collectCustomizationData
    };
}
