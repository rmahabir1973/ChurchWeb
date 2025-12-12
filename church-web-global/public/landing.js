// ===================================
// CHURCHWEB GLOBAL - LANDING PAGE JS
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initScrollEffects();
    initCounterAnimation();
    initPricingToggle();
    initSmoothScroll();
    initScrollAnimations();
});

// ===================================
// NAVIGATION
// ===================================
function initNavigation() {
    const header = document.getElementById('nav-header');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const menuIcon = document.getElementById('menu-icon');

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('mobile-open');
            menuIcon.textContent = navMenu.classList.contains('mobile-open') ? '✕' : '☰';
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('mobile-open');
                menuIcon.textContent = '☰';
            });
        });
    }

    // Scroll effect for header
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// ===================================
// SCROLL EFFECTS
// ===================================
function initScrollEffects() {
    // Parallax effect for hero orbs
    const orbs = document.querySelectorAll('.gradient-orb');
    
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        
        orbs.forEach((orb, index) => {
            const speed = index === 0 ? 0.1 : 0.15;
            orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });
}

// ===================================
// COUNTER ANIMATION
// ===================================
function initCounterAnimation() {
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const count = parseInt(target.dataset.count);
                if (count) {
                    animateCount(target, count);
                }
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-count]').forEach(el => {
        observer.observe(el);
    });
}

function animateCount(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString() + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 30);
}

// ===================================
// PRICING TOGGLE
// ===================================
function initPricingToggle() {
    const billingToggle = document.getElementById('billingToggle');
    const priceAmounts = document.querySelectorAll('.amount');

    if (billingToggle) {
        billingToggle.addEventListener('change', function() {
            const isAnnual = this.checked;
            
            priceAmounts.forEach(amount => {
                const monthly = amount.dataset.monthly;
                const annual = amount.dataset.annual;
                
                if (monthly && annual) {
                    // Animate the price change
                    amount.style.opacity = '0';
                    amount.style.transform = 'translateY(-10px)';
                    
                    setTimeout(() => {
                        amount.textContent = isAnnual ? annual : monthly;
                        amount.style.opacity = '1';
                        amount.style.transform = 'translateY(0)';
                    }, 150);
                }
            });
        });

        // Add transition styles
        priceAmounts.forEach(amount => {
            amount.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        });
    }
}

// ===================================
// SMOOTH SCROLL
// ===================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===================================
// SCROLL ANIMATIONS
// ===================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add stagger delay based on element index within its container
                const siblings = entry.target.parentElement.querySelectorAll('.animate-on-scroll');
                let delay = 0;
                siblings.forEach((sibling, i) => {
                    if (sibling === entry.target) {
                        delay = i * 100;
                    }
                });
                
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        fadeInObserver.observe(el);
    });
}

// ===================================
// DEMO STEPS ANIMATION
// ===================================
function initDemoStepsAnimation() {
    const stepIndicators = document.querySelectorAll('.step-indicator');
    let currentStep = 0;

    function animateSteps() {
        stepIndicators.forEach((step, index) => {
            step.classList.remove('active');
            if (index === currentStep) {
                step.classList.add('active');
            }
        });
        
        currentStep = (currentStep + 1) % stepIndicators.length;
    }

    // Animate steps every 2 seconds
    setInterval(animateSteps, 2000);
}

// Start demo animation when section is visible
const demoSection = document.querySelector('.demo-section');
if (demoSection) {
    const demoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                initDemoStepsAnimation();
                demoObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    demoObserver.observe(demoSection);
}
