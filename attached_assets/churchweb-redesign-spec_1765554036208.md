# ChurchWeb Global - Complete Website Redesign Specification

## Project Brief
Redesign ChurchWeb Global website into a modern SaaS platform for church website hosting. Transform from traditional hosting site into streamlined funnel-driven demo creation experience. Target: churches seeking professional web presence without technical complexity.

**Current State:** 200+ church portfolio, Duda-based development, traditional purple branding
**Goal:** Modern, conversion-optimized site that showcases expertise while simplifying customer journey

---

## Design System

### Color Palette
```css
/* Primary Colors */
--color-primary: #6B46C1;           /* Deep Purple - main brand */
--color-accent: #D946A6;            /* Vibrant Magenta - from logo */
--color-white: #FFFFFF;             /* Backgrounds, light text */
--color-lavender-light: #F3E8FF;    /* Light backgrounds, cards */

/* Secondary Colors */
--color-navy-dark: #1E1B4B;         /* Headers, footer */
--color-gray-warm: #64748B;         /* Body text */
--color-green-success: #10B981;     /* CTAs, success states */
--color-gray-light: #F8FAFC;        /* Alternate backgrounds */
--color-purple-light: #A5B4FC;      /* Footer links */
--color-border: #E5E7EB;            /* Card borders */

/* Gradients */
--gradient-hero: linear-gradient(135deg, #6B46C1 0%, #D946A6 100%);
--gradient-cta: linear-gradient(135deg, #6B46C1 0%, #D946A6 100%);
--gradient-background: linear-gradient(180deg, #FDFBFF 0%, #F3E8FF 100%);
--gradient-card-hover: linear-gradient(135deg, #F3E8FF 0%, #FFFFFF 100%);
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-accent: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.5rem;      /* 40px */
--text-5xl: 3.5rem;      /* 56px */

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

/* Line Heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing Scale
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### Border Radius
```css
--radius-sm: 0.5rem;   /* 8px */
--radius-md: 0.75rem;  /* 12px */
--radius-lg: 1rem;     /* 16px */
--radius-xl: 1.5rem;   /* 24px */
--radius-full: 9999px; /* Full circle */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Transitions
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large desktops */
```

**Responsive Strategy:**
- Design mobile-first (320px base)
- Stack columns vertically on mobile
- Reduce font sizes by 20% on mobile
- Reduce spacing by 30% on mobile
- Hamburger menu below 1024px
- Maximum content width: 1280px

---

## Component Library

### 1. Navigation Header

**Structure:**
```html
<header class="navigation-header">
  <div class="nav-container">
    <div class="nav-logo">
      <img src="logo.svg" alt="ChurchWeb Global" />
      <span>ChurchWeb Global</span>
    </div>
    <nav class="nav-menu">
      <a href="#home">Home</a>
      <a href="#features">Features</a>
      <a href="#templates">Templates</a>
      <a href="#pricing">Pricing</a>
      <a href="#portfolio">Portfolio</a>
      <a href="#resources">Resources</a>
      <a href="#about">About</a>
    </nav>
    <div class="nav-actions">
      <button class="btn-ghost">Login</button>
      <button class="btn-primary">Start Free Trial</button>
    </div>
    <button class="nav-toggle">☰</button>
  </div>
</header>
```

**Styling:**
```css
.navigation-header {
  position: fixed;
  top: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
  transition: var(--transition-base);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-navy-dark);
}

.nav-logo img {
  height: 40px;
  width: auto;
}

.nav-menu {
  display: flex;
  gap: var(--space-8);
}

.nav-menu a {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-gray-warm);
  text-decoration: none;
  transition: var(--transition-base);
}

.nav-menu a:hover {
  color: var(--color-primary);
}

.nav-actions {
  display: flex;
  gap: var(--space-4);
}

.nav-toggle {
  display: none;
}

/* Scroll Effect */
.navigation-header.scrolled {
  box-shadow: var(--shadow-md);
}

/* Mobile */
@media (max-width: 1024px) {
  .nav-menu {
    display: none;
  }
  
  .nav-toggle {
    display: block;
  }
  
  .nav-menu.mobile-open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 72px;
    left: 0;
    right: 0;
    background: white;
    padding: var(--space-6);
    border-bottom: 1px solid var(--color-border);
  }
}
```

---

### 2. Button Components

```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: var(--transition-base);
  text-decoration: none;
}

/* Primary Button */
.btn-primary {
  background: var(--gradient-cta);
  color: var(--color-white);
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Secondary Button */
.btn-secondary {
  background: var(--color-white);
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-secondary:hover {
  background: var(--color-lavender-light);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-gray-warm);
  border: 1px solid var(--color-border);
}

.btn-ghost:hover {
  background: var(--color-gray-light);
  color: var(--color-primary);
}

/* Large Button */
.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-lg);
  height: 56px;
}

/* Small Button */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}
```

---

### 3. Card Component

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  transition: var(--transition-base);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.card-icon svg {
  width: 24px;
  height: 24px;
  color: var(--color-accent);
}

.card-title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-navy-dark);
  margin-bottom: var(--space-3);
}

.card-description {
  font-size: var(--text-base);
  color: var(--color-gray-warm);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

.card-link {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.card-link:hover {
  color: var(--color-accent);
}
```

---

## Page Sections

### SECTION 1: Hero Section

**HTML Structure:**
```html
<section class="hero-section">
  <div class="hero-container">
    <div class="hero-content">
      <div class="hero-badge">
        <span>✨ Trusted by 200+ Churches Worldwide</span>
      </div>
      
      <h1 class="hero-title">
        Modern Website Solutions Built for Your 
        <span class="gradient-text">Ministry</span>
      </h1>
      
      <p class="hero-subtitle">
        Launch your professional church website in minutes, not months. 
        No technical skills required.
      </p>
      
      <div class="hero-features">
        <span class="feature-pill">✓ No Coding Required</span>
        <span class="feature-pill">✓ Mobile-First Design</span>
        <span class="feature-pill">✓ Live Streaming Ready</span>
      </div>
      
      <div class="hero-cta">
        <button class="btn-primary btn-lg">
          Create Your Free Demo Site
        </button>
        <button class="btn-secondary btn-lg">
          <svg><!-- Play icon --></svg>
          Watch 2-Minute Tour
        </button>
      </div>
      
      <p class="hero-disclaimer">
        No credit card required • 14-day free trial
      </p>
      
      <div class="hero-trust-bar">
        <span>Powered by:</span>
        <img src="duda-logo.svg" alt="Duda" />
        <img src="microsoft-logo.svg" alt="Microsoft" />
        <img src="youtube-logo.svg" alt="YouTube" />
      </div>
    </div>
    
    <div class="hero-visual">
      <div class="browser-mockup">
        <img src="church-website-mockup.png" alt="Church Website Example" />
      </div>
      <div class="floating-card card-1">
        <span>📅 Event Management</span>
      </div>
      <div class="floating-card card-2">
        <span>📧 Email Hosting</span>
      </div>
      <div class="floating-card card-3">
        <span>📱 Mobile Responsive</span>
      </div>
    </div>
  </div>
  
  <div class="hero-background">
    <div class="gradient-orb orb-1"></div>
    <div class="gradient-orb orb-2"></div>
    <div class="pattern-overlay"></div>
  </div>
</section>
```

**CSS Styling:**
```css
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--space-24) var(--space-6);
  background: var(--gradient-background);
  overflow: hidden;
}

.hero-container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 60% 40%;
  gap: var(--space-16);
  align-items: center;
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  background: var(--color-lavender-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  margin-bottom: var(--space-6);
}

.hero-title {
  font-size: var(--text-5xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  color: var(--color-navy-dark);
  margin-bottom: var(--space-6);
  font-family: var(--font-accent);
}

.gradient-text {
  background: var(--gradient-hero);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--color-gray-warm);
  line-height: var(--leading-relaxed);
  max-width: 600px;
  margin-bottom: var(--space-8);
}

.hero-features {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.feature-pill {
  padding: var(--space-2) var(--space-4);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-gray-warm);
}

.hero-cta {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.hero-disclaimer {
  font-size: var(--text-sm);
  color: var(--color-gray-warm);
  margin-bottom: var(--space-8);
}

.hero-trust-bar {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding-top: var(--space-8);
  border-top: 1px solid var(--color-border);
}

.hero-trust-bar span {
  font-size: var(--text-sm);
  color: var(--color-gray-warm);
  font-weight: var(--weight-medium);
}

.hero-trust-bar img {
  height: 24px;
  opacity: 0.5;
  transition: var(--transition-base);
}

.hero-trust-bar img:hover {
  opacity: 1;
}

.hero-visual {
  position: relative;
}

.browser-mockup {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  padding: var(--space-2);
  transform: perspective(1000px) rotateY(-5deg);
}

.browser-mockup img {
  width: 100%;
  border-radius: var(--radius-md);
}

.floating-card {
  position: absolute;
  padding: var(--space-4) var(--space-6);
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  animation: float 3s ease-in-out infinite;
}

.card-1 {
  top: 10%;
  right: -10%;
}

.card-2 {
  bottom: 30%;
  right: -5%;
  animation-delay: 1s;
}

.card-3 {
  top: 50%;
  left: -10%;
  animation-delay: 2s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: var(--color-primary);
  top: -200px;
  right: -200px;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: var(--color-accent);
  bottom: -100px;
  left: -100px;
}

.pattern-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L30 10 M30 50 L30 60 M0 30 L10 30 M50 30 L60 30' stroke='%236B46C1' stroke-width='0.5' opacity='0.1' fill='none'/%3E%3C/svg%3E");
  opacity: 0.5;
}

/* Mobile Responsive */
@media (max-width: 1024px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .hero-title {
    font-size: var(--text-4xl);
  }
  
  .hero-subtitle {
    font-size: var(--text-lg);
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-cta {
    flex-direction: column;
  }
  
  .hero-visual {
    margin-top: var(--space-16);
  }
  
  .floating-card {
    display: none;
  }
}
```

---

### SECTION 2: Social Proof Banner

**HTML Structure:**
```html
<section class="social-proof-banner">
  <div class="stats-container">
    <div class="stat-item">
      <div class="stat-number" data-count="200">0</div>
      <div class="stat-label">Churches Served</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-number" data-count="50000">0</div>
      <div class="stat-label">Members Reached</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-number">99.9%</div>
      <div class="stat-label">Uptime Guarantee</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-number">Since 2010</div>
      <div class="stat-label">Years of Service</div>
    </div>
  </div>
</section>
```

**CSS Styling:**
```css
.social-proof-banner {
  background: var(--color-primary);
  padding: var(--space-16) var(--space-6);
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: var(--text-5xl);
  font-weight: var(--weight-bold);
  color: var(--color-white);
  margin-bottom: var(--space-2);
}

.stat-label {
  font-size: var(--text-base);
  color: var(--color-lavender-light);
}

.stat-divider {
  width: 1px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
}

/* Animated Counter */
@keyframes countUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-number {
  animation: countUp 0.5s ease-out;
}

/* Mobile */
@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: var(--space-8);
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-number {
    font-size: var(--text-4xl);
  }
}
```

**JavaScript for Counter Animation:**
```javascript
// Animate numbers on scroll into view
const observerOptions = {
  threshold: 0.5,
  rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = entry.target;
      const count = parseInt(target.dataset.count);
      animateCount(target, count);
      observer.unobserve(target);
    }
  });
}, observerOptions);

document.querySelectorAll('[data-count]').forEach(el => {
  observer.observe(el);
});

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
```

---

### SECTION 3: Features Overview

**HTML Structure:**
```html
<section class="features-section">
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title">Everything Your Church Needs Online</h2>
      <p class="section-subtitle">
        Professional tools designed specifically for churches and ministries
      </p>
    </div>
    
    <div class="features-grid">
      <!-- Feature Card 1 -->
      <div class="card feature-card">
        <div class="card-icon">
          <svg><!-- Layout icon --></svg>
        </div>
        <h3 class="card-title">Beautiful Website Templates</h3>
        <p class="card-description">
          Choose from dozens of professionally designed templates created 
          specifically for churches. No coding required.
        </p>
        <a href="#templates" class="card-link">
          Explore Templates →
        </a>
      </div>
      
      <!-- Feature Card 2 -->
      <div class="card feature-card">
        <div class="card-icon">
          <svg><!-- Mail icon --></svg>
        </div>
        <h3 class="card-title">Smart Email Hosting</h3>
        <p class="card-description">
          Professional email hosting with Microsoft 365 integration. 
          Get @yourchurch.com emails.
        </p>
        <a href="#email" class="card-link">
          Learn More →
        </a>
      </div>
      
      <!-- Feature Card 3 -->
      <div class="card feature-card">
        <div class="card-icon">
          <svg><!-- Smartphone icon --></svg>
        </div>
        <h3 class="card-title">Mobile Responsive</h3>
        <p class="card-description">
          Your website looks perfect on every device - desktop, tablet, 
          and mobile. Reach your congregation anywhere.
        </p>
        <a href="#mobile" class="card-link">
          See Examples →
        </a>
      </div>
      
      <!-- Feature Card 4 -->
      <div class="card feature-card">
        <div class="card-icon">
          <svg><!-- Video icon --></svg>
        </div>
        <h3 class="card-title">Live Stream Integration</h3>
        <p class="card-description">
          Easily embed your live streams from YouTube, Vimeo, or Facebook Live. 
          Connect with members remotely.
        </p>
        <a href="#streaming" class="card-link">
          View Setup →
        </a>
      </div>
      
      <!-- Feature Card 5 -->
      <div class="card feature-card">
        <div class="card-icon">
          <svg><!-- Calendar icon --></svg>
        </div>
        <h3 class="card-title">Event Management</h3>
        <p class="card-description">
          Promote church events, accept RSVPs, and keep your congregation 
          informed about upcoming activities.
        </p>
        <a href="#events" class="card-link">
          Try It Free →
        </a>
      </div>
      
      <!-- Feature Card 6 -->
      <div class="card feature-card">
        <div class="card-icon">
          <svg><!-- Shield icon --></svg>
        </div>
        <h3 class="card-title">Secure & Reliable</h3>
        <p class="card-description">
          SSL certificates included, daily backups, and 99.9% uptime guarantee. 
          Your ministry's online home is safe with us.
        </p>
        <a href="#security" class="card-link">
          Security Info →
        </a>
      </div>
    </div>
  </div>
</section>
```

**CSS Styling:**
```css
.features-section {
  padding: var(--space-32) var(--space-6);
  background: var(--color-white);
}

.section-container {
  max-width: 1280px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto var(--space-16);
}

.section-title {
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  color: var(--color-navy-dark);
  margin-bottom: var(--space-4);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--color-gray-warm);
  line-height: var(--leading-relaxed);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

/* Mobile */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: var(--text-3xl);
  }
}
```

---

### SECTION 4: Demo Builder Preview

**HTML Structure:**
```html
<section class="demo-section">
  <div class="demo-container">
    <div class="demo-visual">
      <div class="demo-steps-preview">
        <div class="step-indicator active" data-step="1">
          <div class="step-number">1</div>
          <div class="step-content">Choose Template</div>
        </div>
        <div class="step-connector"></div>
        <div class="step-indicator" data-step="2">
          <div class="step-number">2</div>
          <div class="step-content">Customize Content</div>
        </div>
        <div class="step-connector"></div>
        <div class="step-indicator" data-step="3">
          <div class="step-number">3</div>
          <div class="step-content">Preview Site</div>
        </div>
        <div class="step-connector"></div>
        <div class="step-indicator" data-step="4">
          <div class="step-number">4</div>
          <div class="step-content">Go Live</div>
        </div>
      </div>
    </div>
    
    <div class="demo-content">
      <span class="eyebrow-text">SaaS-Style Simplicity</span>
      <h2 class="section-title">Launch Your Website in 4 Simple Steps</h2>
      
      <div class="steps-list">
        <div class="step-item">
          <div class="step-icon">
            <svg><!-- Template icon --></svg>
          </div>
          <div class="step-info">
            <h4 class="step-title">1. Choose Your Template</h4>
            <p class="step-description">
              Browse our collection of professionally designed church templates 
              and pick your favorite.
            </p>
          </div>
        </div>
        
        <div class="step-item">
          <div class="step-icon">
            <svg><!-- Edit icon --></svg>
          </div>
          <div class="step-info">
            <h4 class="step-title">2. Customize Your Content</h4>
            <p class="step-description">
              Add your church's information, photos, and branding. 
              Our intuitive editor makes it easy.
            </p>
          </div>
        </div>
        
        <div class="step-item">
          <div class="step-icon">
            <svg><!-- Eye icon --></svg>
          </div>
          <div class="step-info">
            <h4 class="step-title">3. Preview Your Site</h4>
            <p class="step-description">
              See exactly how your website will look on all devices before 
              going live.
            </p>
          </div>
        </div>
        
        <div class="step-item">
          <div class="step-icon">
            <svg><!-- Rocket icon --></svg>
          </div>
          <div class="step-info">
            <h4 class="step-title">4. Go Live Instantly</h4>
            <p class="step-description">
              Publish your website with a single click. No waiting, 
              no technical setup required.
            </p>
          </div>
        </div>
      </div>
      
      <button class="btn-primary btn-lg">Start Building Now</button>
    </div>
  </div>
</section>
```

**CSS Styling:**
```css
.demo-section {
  padding: var(--space-32) var(--space-6);
  background: var(--gradient-background);
}

.demo-container {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 55% 45%;
  gap: var(--space-16);
  align-items: center;
}

.eyebrow-text {
  display: inline-block;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-3);
}

.demo-steps-preview {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-12);
  box-shadow: var(--shadow-2xl);
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: var(--transition-base);
}

.step-indicator.active {
  background: var(--color-lavender-light);
}

.step-number {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--gradient-cta);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--weight-bold);
  font-size: var(--text-xl);
}

.step-indicator:not(.active) .step-number {
  background: var(--color-gray-light);
  color: var(--color-gray-warm);
}

.step-connector {
  width: 2px;
  height: 32px;
  background: var(--color-border);
  margin-left: 24px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin: var(--space-12) 0;
}

.step-item {
  display: flex;
  gap: var(--space-4);
}

.step-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--gradient-cta);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-icon svg {
  width: 24px;
  height: 24px;
}

.step-title {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--color-navy-dark);
  margin-bottom: var(--space-2);
}

.step-description {
  font-size: var(--text-base);
  color: var(--color-gray-warm);
  line-height: var(--leading-relaxed);
}

/* Mobile */
@media (max-width: 1024px) {
  .demo-container {
    grid-template-columns: 1fr;
  }
  
  .demo-visual {
    order: 2;
    margin-top: var(--space-12);
  }
}
```

---

### SECTION 5: Pricing

**HTML Structure:**
```html
<section class="pricing-section">
  <div class="section-container">
    <div class="section-header">
      <h2 class="section-title">Simple, Transparent Pricing</h2>
      <p class="section-subtitle">
        Start free, upgrade as you grow. No hidden fees.
      </p>
      
      <div class="billing-toggle">
        <span class="toggle-label">Monthly</span>
        <label class="switch">
          <input type="checkbox" id="billingToggle">
          <span class="slider"></span>
        </label>
        <span class="toggle-label">
          Annual <span class="discount-badge">Save 20%</span>
        </span>
      </div>
    </div>
    
    <div class="pricing-grid">
      <!-- Starter Plan -->
      <div class="pricing-card">
        <div class="plan-header">
          <h3 class="plan-name">Starter</h3>
          <p class="plan-description">Perfect for small churches</p>
        </div>
        <div class="plan-price">
          <span class="currency">$</span>
          <span class="amount" data-monthly="29" data-annual="23">29</span>
          <span class="period">/month</span>
        </div>
        <button class="btn-ghost btn-lg full-width">Start Free Trial</button>
        <div class="plan-features">
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Custom Domain</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>5 Pages</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>SSL Certificate</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Mobile Responsive</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Basic Email Support</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>3 Email Accounts</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Weekly Backups</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Basic Analytics</span>
          </div>
        </div>
      </div>
      
      <!-- Professional Plan (Popular) -->
      <div class="pricing-card popular">
        <div class="popular-badge">Most Popular</div>
        <div class="plan-header">
          <h3 class="plan-name">Professional</h3>
          <p class="plan-description">Most popular for growing churches</p>
        </div>
        <div class="plan-price">
          <span class="currency">$</span>
          <span class="amount" data-monthly="59" data-annual="47">59</span>
          <span class="period">/month</span>
        </div>
        <button class="btn-primary btn-lg full-width">Start Free Trial</button>
        <div class="plan-features">
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span><strong>Everything in Starter, plus:</strong></span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Unlimited Pages</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Live Streaming Integration</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Event Management</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Priority Email Support</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>10 Email Accounts</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Daily Backups</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Advanced Analytics</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Online Giving Integration</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Custom Forms</span>
          </div>
        </div>
      </div>
      
      <!-- Enterprise Plan -->
      <div class="pricing-card">
        <div class="plan-header">
          <h3 class="plan-name">Enterprise</h3>
          <p class="plan-description">For large churches & multi-campus</p>
        </div>
        <div class="plan-price">
          <span class="amount-custom">Custom</span>
        </div>
        <button class="btn-ghost btn-lg full-width">Contact Sales</button>
        <div class="plan-features">
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span><strong>Everything in Professional, plus:</strong></span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Multi-Campus Management</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Dedicated Account Manager</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>24/7 Phone Support</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Unlimited Email Accounts</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Custom Integrations</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>White-Label Options</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>SLA Guarantee</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Migration Assistance</span>
          </div>
          <div class="feature-item">
            <svg class="checkmark"><!-- Check icon --></svg>
            <span>Training & Onboarding</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**CSS Styling:**
```css
.pricing-section {
  padding: var(--space-32) var(--space-6);
  background: #FDFBFF;
}

.billing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.toggle-label {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-gray-warm);
}

.discount-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  background: var(--color-green-success);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  margin-left: var(--space-2);
}

.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--color-border);
  transition: var(--transition-base);
  border-radius: var(--radius-full);
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: var(--transition-base);
  border-radius: 50%;
}

input:checked + .slider {
  background: var(--gradient-cta);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
  margin-top: var(--space-16);
}

.pricing-card {
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-10);
  position: relative;
  transition: var(--transition-base);
}

.pricing-card:hover {
  box-shadow: var(--shadow-xl);
}

.pricing-card.popular {
  transform: scale(1.05);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-2xl);
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-cta);
  color: white;
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.plan-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.plan-name {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  color: var(--color-navy-dark);
  margin-bottom: var(--space-2);
}

.plan-description {
  font-size: var(--text-base);
  color: var(--color-gray-warm);
}

.plan-price {
  text-align: center;
  margin-bottom: var(--space-6);
}

.currency {
  font-size: var(--text-2xl);
  color: var(--color-navy-dark);
  font-weight: var(--weight-semibold);
  vertical-align: top;
}

.amount {
  font-size: var(--text-5xl);
  font-weight: var(--weight-bold);
  color: var(--color-navy-dark);
}

.period {
  font-size: var(--text-base);
  color: var(--color-gray-warm);
}

.amount-custom {
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  color: var(--color-navy-dark);
}

.full-width {
  width: 100%;
  margin-bottom: var(--space-8);
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.checkmark {
  width: 20px;
  height: 20px;
  color: var(--color-green-success);
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-item span {
  font-size: var(--text-base);
  color: var(--color-gray-warm);
  line-height: var(--leading-normal);
}

/* Mobile */
@media (max-width: 1024px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  
  .pricing-card.popular {
    transform: scale(1);
  }
}
```

**JavaScript for Price Toggle:**
```javascript
const billingToggle = document.getElementById('billingToggle');
const priceAmounts = document.querySelectorAll('.amount');

billingToggle.addEventListener('change', function() {
  const isAnnual = this.checked;
  
  priceAmounts.forEach(amount => {
    const monthly = amount.dataset.monthly;
    const annual = amount.dataset.annual;
    
    if (monthly && annual) {
      amount.textContent = isAnnual ? annual : monthly;
    }
  });
});
```

---

### SECTION 6: Footer

**HTML Structure:**
```html
<footer class="footer">
  <div class="footer-container">
    <div class="footer-grid">
      <!-- Brand Column -->
      <div class="footer-column">
        <div class="footer-brand">
          <img src="logo-white.svg" alt="ChurchWeb Global" />
          <span>ChurchWeb Global</span>
        </div>
        <p class="footer-tagline">
          Empowering churches online since 2010
        </p>
        <div class="social-links">
          <a href="#" aria-label="Facebook">
            <svg><!-- Facebook icon --></svg>
          </a>
          <a href="#" aria-label="Twitter">
            <svg><!-- Twitter icon --></svg>
          </a>
          <a href="#" aria-label="Instagram">
            <svg><!-- Instagram icon --></svg>
          </a>
          <a href="#" aria-label="YouTube">
            <svg><!-- YouTube icon --></svg>
          </a>
        </div>
      </div>
      
      <!-- Product Column -->
      <div class="footer-column">
        <h4 class="footer-heading">Product</h4>
        <ul class="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#templates">Templates</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#demo">Demo</a></li>
          <li><a href="#updates">What's New</a></li>
        </ul>
      </div>
      
      <!-- Resources Column -->
      <div class="footer-column">
        <h4 class="footer-heading">Resources</h4>
        <ul class="footer-links">
          <li><a href="#help">Help Center</a></li>
          <li><a href="#blog">Blog</a></li>
          <li><a href="#guides">Guides</a></li>
          <li><a href="#api">API Docs</a></li>
          <li><a href="#status">Status</a></li>
        </ul>
      </div>
      
      <!-- Company Column -->
      <div class="footer-column">
        <h4 class="footer-heading">Company</h4>
        <ul class="footer-links">
          <li><a href="#about">About Us</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#careers">Careers</a></li>
          <li><a href="#partners">Partners</a></li>
          <li><a href="#press">Press Kit</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p class="copyright">
        © 2025 ChurchWeb Global. All rights reserved.
      </p>
      <div class="footer-legal">
        <a href="#terms">Terms of Service</a>
        <span class="separator">|</span>
        <a href="#privacy">Privacy Policy</a>
        <span class="separator">|</span>
        <a href="#cookies">Cookie Policy</a>
      </div>
    </div>
  </div>
</footer>
```

**CSS Styling:**
```css
.footer {
  background: var(--color-navy-dark);
  color: var(--color-purple-light);
  padding: var(--space-20) var(--space-6) var(--space-10);
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--space-12);
  margin-bottom: var(--space-16);
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: white;
  margin-bottom: var(--space-4);
}

.footer-brand img {
  height: 32px;
  width: auto;
}

.footer-tagline {
  font-size: var(--text-base);
  color: var(--color-purple-light);
  margin-bottom: var(--space-6);
  max-width: 300px;
}

.social-links {
  display: flex;
  gap: var(--space-4);
}

.social-links a {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: var(--transition-base);
}

.social-links a:hover {
  background: var(--color-primary);
  transform: translateY(-2px);
}

.social-links svg {
  width: 20px;
  height: 20px;
}

.footer-heading {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: white;
  margin-bottom: var(--space-6);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer-links a {
  font-size: var(--text-base);
  color: var(--color-purple-light);
  text-decoration: none;
  transition: var(--transition-base);
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  padding-top: var(--space-8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  font-size: var(--text-sm);
  color: var(--color-purple-light);
}

.footer-legal {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  font-size: var(--text-sm);
}

.footer-legal a {
  color: var(--color-purple-light);
  text-decoration: none;
  transition: var(--transition-base);
}

.footer-legal a:hover {
  color: white;
}

.separator {
  color: rgba(255, 255, 255, 0.3);
}

/* Mobile */
@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: var(--space-4);
    text-align: center;
  }
}
```

---

## Additional Interactive Elements

### Scroll Animations
```javascript
// Fade in elements on scroll
const observeElements = document.querySelectorAll('.card, .section-header, .step-item');

const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      fadeInObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

observeElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  fadeInObserver.observe(el);
});

// CSS for fade-in
const style = document.createElement('style');
style.textContent = `
  .fade-in {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  @keyframes fadeInUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
```

### Smooth Scroll
```javascript
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
```

### Navigation Scroll Effect
```javascript
// Add shadow to navigation on scroll
const header = document.querySelector('.navigation-header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});
```

---

## Performance Optimization

### Image Optimization
```html
<!-- Use responsive images -->
<img 
  src="image-800w.webp"
  srcset="image-400w.webp 400w, image-800w.webp 800w, image-1200w.webp 1200w"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
  alt="Description"
  loading="lazy"
/>
```

### Critical CSS
```html
<!-- Inline critical CSS in <head> -->
<style>
  /* Above-the-fold styles only */
  body { margin: 0; font-family: 'Inter', sans-serif; }
  .navigation-header { /* ... */ }
  .hero-section { /* ... */ }
</style>

<!-- Load full stylesheet async -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

### Lazy Loading
```javascript
// Lazy load images
const lazyImages = document.querySelectorAll('img[loading="lazy"]');

if ('loading' in HTMLImageElement.prototype) {
  // Browser supports native lazy loading
} else {
  // Fallback for older browsers
  const lazyLoadScript = document.createElement('script');
  lazyLoadScript.src = 'lazysizes.min.js';
  document.body.appendChild(lazyLoadScript);
}
```

---

## SEO Implementation

### Meta Tags Template
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>ChurchWeb Global - Professional Church Website Hosting | Since 2010</title>
  <meta name="title" content="ChurchWeb Global - Professional Church Website Hosting">
  <meta name="description" content="Launch your professional church website in minutes. Trusted by 200+ churches worldwide. No coding required. Try free for 14 days.">
  <meta name="keywords" content="church website, church hosting, church website builder, ministry website, religious website hosting">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://churchwebglobal.com/">
  <meta property="og:title" content="ChurchWeb Global - Professional Church Website Hosting">
  <meta property="og:description" content="Launch your professional church website in minutes. Trusted by 200+ churches worldwide.">
  <meta property="og:image" content="https://churchwebglobal.com/og-image.jpg">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://churchwebglobal.com/">
  <meta property="twitter:title" content="ChurchWeb Global - Professional Church Website Hosting">
  <meta property="twitter:description" content="Launch your professional church website in minutes. Trusted by 200+ churches worldwide.">
  <meta property="twitter:image" content="https://churchwebglobal.com/twitter-image.jpg">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
  
  <!-- Schema Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ChurchWeb Global",
    "url": "https://churchwebglobal.com",
    "logo": "https://churchwebglobal.com/logo.png",
    "description": "Professional website hosting for churches and religious organizations",
    "foundingDate": "2010",
    "sameAs": [
      "https://facebook.com/churchwebglobal",
      "https://twitter.com/churchwebglobal",
      "https://instagram.com/churchwebglobal"
    ]
  }
  </script>
</head>
<body>
```

---

## Accessibility Implementation

### ARIA Labels and Semantic HTML
```html
<!-- Proper heading hierarchy -->
<h1>Main Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>

<!-- ARIA labels for interactive elements -->
<button aria-label="Open navigation menu" class="nav-toggle">☰</button>

<nav aria-label="Main navigation">
  <ul>
    <li><a href="#home">Home</a></li>
  </ul>
</nav>

<!-- Skip to main content link -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<main id="main-content">
  <!-- Main content -->
</main>

<!-- Form accessibility -->
<form>
  <label for="email">Email Address</label>
  <input 
    type="email" 
    id="email" 
    name="email"
    aria-required="true"
    aria-describedby="email-help"
  />
  <span id="email-help">We'll never share your email</span>
</form>
```

### Focus Styles
```css
/* Visible focus indicators */
*:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

---

## Implementation Priority Checklist

### Week 1: Foundation
- [ ] Set up design system (CSS variables)
- [ ] Create component library (buttons, cards, etc.)
- [ ] Build navigation header
- [ ] Build footer
- [ ] Implement hero section

### Week 2: Core Content
- [ ] Social proof banner
- [ ] Features overview section
- [ ] Demo builder preview section
- [ ] Responsive design for all sections

### Week 3: Conversion
- [ ] Pricing section with toggle
- [ ] Template gallery (placeholder)
- [ ] Final CTA section
- [ ] Form integrations

### Week 4: Polish & Optimize
- [ ] Scroll animations
- [ ] Mobile menu functionality
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Accessibility audit
- [ ] Cross-browser testing

---

## Testing Checklist

### Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Devices
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Laptop (1280x800)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667, 414x896)

### Performance
- [ ] Lighthouse score >90 (mobile)
- [ ] Page load time <2 seconds
- [ ] All images optimized (WebP)
- [ ] CSS and JS minified
- [ ] No console errors

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast ratios meet standards
- [ ] All images have alt text

### Functionality
- [ ] All links work
- [ ] Forms submit correctly
- [ ] Buttons have hover states
- [ ] Animations smooth
- [ ] Mobile menu opens/closes
- [ ] Pricing toggle works
- [ ] Smooth scroll works

---

## Files to Create

1. **index.html** - Main landing page
2. **styles.css** - Complete stylesheet
3. **script.js** - All JavaScript functionality
4. **logo.svg** - Updated logo (white and colored versions)
5. **images/** - Directory for all images and mockups

---

## Final Notes

This specification provides a complete blueprint for rebuilding the ChurchWeb Global website. Follow the design system strictly for consistency. All components are mobile-first and responsive. Focus on conversion optimization with clear CTAs throughout. The design balances modern SaaS aesthetics with warmth appropriate for religious organizations.

Priority is given to performance and accessibility to ensure the site works for all users. The modular component approach allows for easy maintenance and future updates.

Target completion: 4 weeks from start date.
