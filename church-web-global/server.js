// server.js - Main Express Server for Church Web Global
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const OpenAI = require('openai');

// Config file paths
const CONFIG_DIR = path.join(__dirname, 'config');
const TEMPLATES_CONFIG = path.join(CONFIG_DIR, 'templates.json');
const ADMIN_CONFIG = path.join(CONFIG_DIR, 'admin.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load or initialize config files
function loadConfig(filePath, defaultData) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (error) {
        console.error(`Error loading config ${filePath}:`, error);
    }
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
}

function saveConfig(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Simple password hashing
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Session storage (in-memory for simplicity)
const adminSessions = new Map();

// Initialize OpenAI client (uses Replit AI Integrations)
let openai = null;
if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
    });
    console.log('OpenAI AI Integration configured: Yes');
} else {
    console.log('OpenAI AI Integration configured: No');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// DUDA API Configuration
const DUDA_API_USER = process.env.DUDA_API_USER;
const DUDA_API_PASSWORD = process.env.DUDA_API_PASSWORD;
let DUDA_API_ENDPOINT = process.env.DUDA_API_ENDPOINT || 'https://api.duda.co/api';
if (DUDA_API_ENDPOINT && !/\/api\/?$/.test(DUDA_API_ENDPOINT)) {
  DUDA_API_ENDPOINT = DUDA_API_ENDPOINT.replace(/\/$/, '') + '/api';
}
DUDA_API_ENDPOINT = DUDA_API_ENDPOINT.replace(/\/$/, '');
console.log(`DUDA API Endpoint configured: ${DUDA_API_ENDPOINT}`);

// DUDA MCP AI Configuration
const DUDA_MCP_TOKEN = process.env.DUDA_MCP_TOKEN;
const DUDA_MCP_URL = process.env.DUDA_MCP_URL;
console.log(`DUDA MCP AI configured: ${DUDA_MCP_URL ? 'Yes' : 'No'}`);

// WHMCS API Configuration
const WHMCS_API_URL = process.env.WHMCS_API_URL;
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;
console.log(`WHMCS API configured: ${WHMCS_API_URL ? 'Yes' : 'No'}`);

// Create base64 encoded auth string for DUDA
const authString = Buffer.from(`${DUDA_API_USER}:${DUDA_API_PASSWORD}`).toString('base64');

// DUDA API Headers
const dudaHeaders = {
  'Authorization': `Basic ${authString}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'ChurchWebGlobal/1.0'
};

// Helper function for DUDA API calls
async function callDudaAPI(method, endpoint, data = null) {
  try {
    const config = {
      method: method,
      url: `${DUDA_API_ENDPOINT}${endpoint}`,
      headers: dudaHeaders,
      data: data
    };
    
    console.log(`DUDA API Request: ${method} ${config.url}`);
    if (data) {
      console.log(`DUDA API Request Body:`, JSON.stringify(data).substring(0, 500));
    }
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error.response?.status;
    const errorData = error.response?.data || { message: error.message };
    console.error(`DUDA API Error [${statusCode}]:`, errorData);
    
    if (statusCode === 403) {
      console.error('403 Forbidden - Check API credentials or permissions.');
    }
    
    return { 
      success: false, 
      error: errorData,
      statusCode: statusCode
    };
  }
}

// Helper function for WHMCS API calls
async function callWHMCSAPI(action, params = {}) {
  if (!WHMCS_API_URL || !WHMCS_API_IDENTIFIER || !WHMCS_API_SECRET) {
    return { success: false, error: 'WHMCS not configured' };
  }
  
  try {
    const formData = new URLSearchParams({
      identifier: WHMCS_API_IDENTIFIER,
      secret: WHMCS_API_SECRET,
      action: action,
      responsetype: 'json',
      ...params
    });
    
    console.log(`WHMCS API Request: ${action} to ${WHMCS_API_URL}`);
    const response = await axios.post(WHMCS_API_URL, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000
    });
    
    console.log(`WHMCS API Response:`, JSON.stringify(response.data).substring(0, 200));
    
    if (response.data.result === 'success') {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.data.message || 'WHMCS error', rawResponse: response.data };
    }
  } catch (error) {
    const statusCode = error.response?.status;
    const responseData = error.response?.data;
    console.error(`WHMCS API Error [${statusCode}]:`, error.message, responseData ? JSON.stringify(responseData).substring(0, 200) : '');
    return { success: false, error: error.message, statusCode, responseData };
  }
}

// In-memory store for created sites (in production, use a database)
const createdSites = new Map();

// ============================================
// API ROUTES
// ============================================

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Church Web Global API is running!',
    features: {
      dudaApi: !!DUDA_API_USER,
      dudaMcp: !!DUDA_MCP_TOKEN,
      whmcs: !!WHMCS_API_URL
    },
    timestamp: new Date().toISOString()
  });
});

// Test WHMCS connection
app.get('/api/whmcs/test', async (req, res) => {
  try {
    // Use GetProducts - commonly available action to test connection
    const result = await callWHMCSAPI('GetProducts');
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'WHMCS connection successful!',
        productCount: result.data?.totalresults || 0,
        products: result.data?.products?.product?.map(p => ({ id: p.pid, name: p.name })) || []
      });
    } else if (result.rawResponse) {
      // Connection worked but got an error response
      res.json({ 
        success: false, 
        message: 'WHMCS responded but returned an error',
        error: result.error,
        hint: 'Check API credentials permissions in WHMCS Admin > Setup > Staff Management > API Credentials'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error,
        statusCode: result.statusCode,
        configured: true
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Content Generation for page content
app.post('/api/ai/generate-content', async (req, res) => {
  try {
    const { pageName, churchInfo, contentType } = req.body;
    
    if (!pageName || !churchInfo?.churchName) {
      return res.status(400).json({ success: false, error: 'Page name and church info required' });
    }
    
    if (!openai) {
      return res.status(503).json({ success: false, error: 'AI content generation is not configured' });
    }
    
    const prompt = buildContentPrompt(pageName, churchInfo, contentType);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional church website copywriter. Write warm, welcoming, and authentic content for church websites. Keep content concise, genuine, and focused on community and faith. Use a friendly but reverent tone.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    const generatedContent = completion.choices[0]?.message?.content || '';
    
    res.json({ 
      success: true, 
      content: generatedContent,
      pageName: pageName
    });
  } catch (error) {
    console.error('AI Content Generation Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate content' });
  }
});

// Build content generation prompt based on page type
function buildContentPrompt(pageName, churchInfo, contentType = 'full') {
  const churchName = churchInfo.churchName;
  const denomination = churchInfo.denomination || '';
  const description = churchInfo.description || '';
  
  const pagePrompts = {
    'home': `Write a welcoming homepage introduction for ${churchName}${denomination ? `, a ${denomination} church` : ''}. Include: a warm welcome message, brief mission statement, and invitation to visit. ${description ? `Additional context: ${description}` : ''} Keep it to 2-3 short paragraphs.`,
    
    'about': `Write an "About Us" page for ${churchName}. Include: church history/story, mission and vision, what makes this church special, and core values. ${description ? `Context: ${description}` : ''} Keep it authentic and warm, 3-4 paragraphs.`,
    
    'services': `Write a "Services" or "Worship" page for ${churchName}. Describe typical worship service format, what visitors can expect, service times placeholder, and how to prepare for a visit. Keep it welcoming for newcomers, 2-3 paragraphs.`,
    
    'contact': `Write a brief "Contact Us" page introduction for ${churchName}. Be welcoming and encourage people to reach out with questions or prayer requests. Keep it to 1-2 short paragraphs.`,
    
    'ministries': `Write a "Ministries" page overview for ${churchName}. Describe various ministry opportunities like children's ministry, youth group, small groups, and outreach. Invite people to get involved. 2-3 paragraphs.`,
    
    'sermons': `Write a "Sermons" page introduction for ${churchName}. Describe what visitors will find (past sermons, series, topics) and encourage spiritual growth through the word. 1-2 paragraphs.`,
    
    'events': `Write an "Events" page introduction for ${churchName}. Describe the types of events the church hosts (worship nights, community events, holiday celebrations) and encourage participation. 1-2 paragraphs.`,
    
    'give': `Write a "Give" or "Donate" page for ${churchName}. Explain why giving matters, how donations support the church's mission, and express gratitude. Keep it genuine and not pushy. 2 paragraphs.`,
    
    'connect': `Write a "Connect" or "Get Involved" page for ${churchName}. Encourage visitors to join small groups, volunteer, or become members. Make it warm and inviting. 2 paragraphs.`
  };
  
  return pagePrompts[pageName.toLowerCase()] || 
    `Write content for the "${pageName}" page of ${churchName}. Keep it welcoming and appropriate for a church website. 2-3 paragraphs.`;
}

// Get all templates
app.get('/api/templates', async (req, res) => {
  try {
    const result = await callDudaAPI('GET', '/sites/multiscreen/templates');
    
    if (result.success) {
      res.json({ success: true, templates: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get only CUSTOM templates (filtered to approved templates from config)
app.get('/api/templates/custom', async (req, res) => {
  try {
    const templatesConfig = loadConfig(TEMPLATES_CONFIG, { approved_templates: [] });
    const enabledTemplates = templatesConfig.approved_templates.filter(t => t.enabled);
    
    if (enabledTemplates.length === 0) {
      return res.json({ success: true, templates: [] });
    }
    
    const result = await callDudaAPI('GET', '/sites/multiscreen/templates');
    
    if (result.success && Array.isArray(result.data)) {
      const approvedIds = enabledTemplates.map(t => t.base_site_name);
      
      // Filter to only show approved templates and apply custom thumbnails
      const customTemplates = result.data
        .filter(template => approvedIds.includes(template.base_site_name))
        .map(template => {
          // Find config for this template
          const config = enabledTemplates.find(t => t.base_site_name === template.base_site_name);
          
          // Override thumbnail and name if custom ones are configured
          return {
            ...template,
            template_name: config?.name || template.template_name,
            description: config?.description || template.description,
            thumbnail_url: config?.custom_thumbnail || template.thumbnail_url,
            desktop_thumbnail_url: config?.custom_thumbnail || template.desktop_thumbnail_url
          };
        });
      
      res.json({ success: true, templates: customTemplates });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific template details
app.get('/api/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await callDudaAPI('GET', `/sites/multiscreen/templates/${templateId}`);
    
    if (result.success) {
      res.json({ success: true, template: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DUDA MCP AI ENDPOINTS
// ============================================

// Get AI page suggestions based on church info
app.post('/api/ai/suggest-pages', async (req, res) => {
  try {
    const { churchName, description, denomination, size, ministries } = req.body;
    
    if (!DUDA_MCP_TOKEN || !DUDA_MCP_URL) {
      // Fallback to default suggestions if MCP not configured
      return res.json({
        success: true,
        suggestions: getDefaultPageSuggestions(ministries),
        source: 'default'
      });
    }
    
    // Call DUDA MCP AI for intelligent suggestions
    const prompt = `Suggest website pages for a ${size || 'medium-sized'} ${denomination || 'Christian'} church called "${churchName}". 
      Description: ${description || 'A welcoming community church'}
      Ministries: ${ministries?.join(', ') || 'General worship services'}
      
      Provide a JSON array of recommended pages with: name, description, priority (1-5), and suggested content sections.`;
    
    try {
      const mcpResponse = await axios.post(DUDA_MCP_URL, {
        prompt: prompt,
        token: DUDA_MCP_TOKEN
      }, {
        headers: { 
          'Authorization': `Bearer ${DUDA_MCP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      res.json({
        success: true,
        suggestions: mcpResponse.data.suggestions || mcpResponse.data,
        source: 'ai'
      });
    } catch (mcpError) {
      console.error('MCP AI Error:', mcpError.message);
      // Fallback to default suggestions
      res.json({
        success: true,
        suggestions: getDefaultPageSuggestions(ministries),
        source: 'default'
      });
    }
  } catch (error) {
    console.error('AI suggestion error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI content suggestions for a specific page
app.post('/api/ai/suggest-content', async (req, res) => {
  try {
    const { pageName, churchInfo } = req.body;
    
    if (!DUDA_MCP_TOKEN || !DUDA_MCP_URL) {
      return res.json({
        success: true,
        content: getDefaultPageContent(pageName, churchInfo),
        source: 'default'
      });
    }
    
    try {
      const prompt = `Generate website content for the "${pageName}" page of a church called "${churchInfo.churchName}".
        Church description: ${churchInfo.description || ''}
        Pastor: ${churchInfo.pastorName || 'Not specified'}
        Service time: ${churchInfo.serviceTime || 'Sunday mornings'}
        
        Provide: headline, subheadline, main content paragraphs, and call-to-action text.`;
      
      const mcpResponse = await axios.post(DUDA_MCP_URL, {
        prompt: prompt,
        token: DUDA_MCP_TOKEN
      }, {
        headers: { 
          'Authorization': `Bearer ${DUDA_MCP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      res.json({
        success: true,
        content: mcpResponse.data,
        source: 'ai'
      });
    } catch (mcpError) {
      console.error('MCP AI Error:', mcpError.message);
      res.json({
        success: true,
        content: getDefaultPageContent(pageName, churchInfo),
        source: 'default'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Default page suggestions fallback
function getDefaultPageSuggestions(ministries = []) {
  const basePages = [
    { name: 'Home', slug: 'home', description: 'Welcome page with service times and quick links', priority: 1, required: true },
    { name: 'About Us', slug: 'about', description: 'Church history, mission, and leadership', priority: 2 },
    { name: 'Services', slug: 'services', description: 'Service times and what to expect', priority: 2 },
    { name: 'Contact', slug: 'contact', description: 'Location, contact form, and directions', priority: 2 }
  ];
  
  const optionalPages = [
    { name: 'Ministries', slug: 'ministries', description: 'Overview of church ministries', priority: 3 },
    { name: 'Sermons', slug: 'sermons', description: 'Watch or listen to past sermons', priority: 3 },
    { name: 'Events', slug: 'events', description: 'Upcoming church events and activities', priority: 3 },
    { name: 'Give', slug: 'give', description: 'Online giving and donation options', priority: 4 },
    { name: 'Connect', slug: 'connect', description: 'Small groups and community connection', priority: 4 },
    { name: 'Prayer', slug: 'prayer', description: 'Submit prayer requests', priority: 5 }
  ];
  
  return [...basePages, ...optionalPages];
}

// Default page content fallback
function getDefaultPageContent(pageName, churchInfo) {
  const templates = {
    home: {
      headline: `Welcome to ${churchInfo.churchName}`,
      subheadline: churchInfo.description || 'A place where everyone belongs',
      cta: 'Plan Your Visit'
    },
    about: {
      headline: `About ${churchInfo.churchName}`,
      subheadline: 'Our story, mission, and values',
      cta: 'Meet Our Team'
    },
    services: {
      headline: 'Join Us for Worship',
      subheadline: churchInfo.serviceTime || 'Sunday at 10:00 AM',
      cta: 'What to Expect'
    },
    contact: {
      headline: 'Get in Touch',
      subheadline: "We'd love to hear from you",
      cta: 'Send Message'
    }
  };
  
  return templates[pageName.toLowerCase()] || {
    headline: pageName,
    subheadline: `Learn more about our ${pageName.toLowerCase()}`,
    cta: 'Learn More'
  };
}

// ============================================
// SITE CREATION ENDPOINTS
// ============================================

// Cache for template mappings (base_site_name -> template_id)
let templateCache = null;
let templateCacheTime = 0;
const TEMPLATE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to resolve template_id from either numeric ID or base_site_name
async function resolveTemplateId(templateIdOrBaseName) {
  // If it's already a numeric string or number, return as string
  if (/^\d+$/.test(String(templateIdOrBaseName))) {
    return String(templateIdOrBaseName);
  }
  
  // Otherwise, look up by base_site_name
  const now = Date.now();
  if (!templateCache || (now - templateCacheTime) > TEMPLATE_CACHE_TTL) {
    const result = await callDudaAPI('GET', '/sites/multiscreen/templates');
    if (result.success && Array.isArray(result.data)) {
      templateCache = {};
      for (const t of result.data) {
        if (t.base_site_name && t.template_id) {
          templateCache[t.base_site_name] = String(t.template_id);
        }
      }
      templateCacheTime = now;
      console.log(`Template cache updated: ${Object.keys(templateCache).length} templates`);
    }
  }
  
  if (templateCache && templateCache[templateIdOrBaseName]) {
    console.log(`Resolved template ${templateIdOrBaseName} -> ${templateCache[templateIdOrBaseName]}`);
    return templateCache[templateIdOrBaseName];
  }
  
  // Return original if not found
  return templateIdOrBaseName;
}

// Create a new site using AI generation (preferred) or template
app.post('/api/sites/create', async (req, res) => {
  try {
    const { templateId, churchInfo, pages, useAI, collectionData } = req.body;
    
    if (!churchInfo?.churchName) {
      return res.status(400).json({ success: false, error: 'Church name is required' });
    }
    
    // Generate unique site name
    const uniqueSiteName = `${churchInfo.churchName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    
    // Check if using mock template (demo mode)
    const MOCK_TEMPLATE_IDS = ['modern-church', 'traditional-faith', 'community-focused', 'youth-ministry', 'contemporary-worship', 'ministry-hub'];
    if (!templateId || MOCK_TEMPLATE_IDS.includes(templateId)) {
      const demoSite = {
        site_name: uniqueSiteName,
        template_id: templateId || 'modern-church',
        demo_mode: true,
        preview_url: `https://${uniqueSiteName}.dudapreview.com`,
        pages: pages || ['home', 'about', 'contact']
      };
      createdSites.set(uniqueSiteName, demoSite);
      
      return res.json({ 
        success: true, 
        site: demoSite,
        previewUrl: demoSite.preview_url,
        message: 'Demo site created. Connect to DUDA API for full functionality.'
      });
    }
    
    // Resolve template_id (handles both numeric and base_site_name formats)
    const resolvedTemplateId = await resolveTemplateId(templateId);
    console.log(`Template ID: ${templateId} -> Resolved: ${resolvedTemplateId}`);
    
    // Try AI-powered site generation first (creates fully customized site)
    console.log('Attempting AI-powered site generation...');
    const pageNames = pages?.map(p => p.name || p.slug).join(', ') || 'Home, About Us, Contact';
    const aiGenData = {
      business_name: churchInfo.churchName,
      business_type: 'Church',
      business_description: churchInfo.mission || `${churchInfo.churchName} is a welcoming church community dedicated to faith, fellowship, and service.`,
      location: churchInfo.city && churchInfo.state ? `${churchInfo.city}, ${churchInfo.state}` : 'United States',
      pages: pageNames
    };
    
    const aiResult = await callDudaAPI('POST', '/sites/generate-ai', aiGenData);
    
    if (aiResult.success && aiResult.data?.id) {
      // AI generation started - poll for completion
      const taskId = aiResult.data.id;
      console.log(`AI site generation started, task ID: ${taskId}`);
      
      // Poll for up to 60 seconds
      let attempts = 0;
      const maxAttempts = 30;
      let siteName = null;
      
      while (attempts < maxAttempts && !siteName) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResult = await callDudaAPI('GET', `/async-tasks/${taskId}`);
        
        if (statusResult.success) {
          if (statusResult.data.status === 'COMPLETED' && statusResult.data.result?.site_name) {
            siteName = statusResult.data.result.site_name;
            console.log(`AI site generation completed: ${siteName}`);
          } else if (statusResult.data.status === 'FAILED') {
            console.log('AI generation failed, falling back to template...');
            break;
          }
        }
        attempts++;
      }
      
      if (siteName) {
        // Get preview URL for AI-generated site
        const siteDetails = await callDudaAPI('GET', `/sites/multiscreen/${siteName}`);
        const previewUrl = siteDetails.data?.preview_site_url || `https://${siteName}.dudapreview.com`;
        
        const siteInfo = {
          site_name: siteName,
          churchInfo: churchInfo,
          pages: pages,
          created: new Date().toISOString(),
          ai_generated: true
        };
        createdSites.set(siteName, siteInfo);
        
        return res.json({ 
          success: true, 
          site: { site_name: siteName },
          previewUrl: previewUrl,
          method: 'ai_generated'
        });
      }
    }
    
    // Fallback: Create from template
    console.log('Using template-based site creation...');
    const siteData = {
      template_id: resolvedTemplateId,
      default_domain_prefix: uniqueSiteName
    };
    
    const result = await callDudaAPI('POST', '/sites/multiscreen/create', siteData);
    
    if (result.success) {
      const siteName = result.data.site_name;
      console.log(`Site created: ${siteName}, now applying customizations...`);
      
      // Update site business info
      const businessInfo = {
        business_name: churchInfo.churchName,
        address: {
          street_address: churchInfo.address || '',
          city: churchInfo.city || '',
          region: churchInfo.state || '',
          postal_code: churchInfo.zip || '',
          country: 'US'
        },
        email: churchInfo.email || ''
      };
      
      const businessResult = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/site-business-info`, businessInfo);
      console.log('Business info update:', businessResult.success ? 'Success' : businessResult.error);
      
      // Update site content with church name and location data
      const contentUpdate = {
        location_data: {
          label: churchInfo.churchName,
          emails: churchInfo.email ? [{ emailAddress: churchInfo.email, label: 'Main Email' }] : [],
          address: {
            streetAddress: churchInfo.address || '',
            city: churchInfo.city || '',
            region: churchInfo.state || '',
            postalCode: churchInfo.zip || '',
            country: 'US'
          }
        },
        site_texts: {
          overview: churchInfo.mission || `Welcome to ${churchInfo.churchName}. We are a welcoming community of faith.`,
          about_us: `${churchInfo.churchName} is dedicated to serving our community and growing together in faith.`
        },
        business_data: {
          name: churchInfo.churchName
        }
      };
      
      // Add custom text blocks for page content if AI content was generated
      if (pages && pages.length > 0) {
        const customTexts = [];
        for (const page of pages) {
          if (page.content) {
            customTexts.push({
              label: `${page.name || page.slug} Content`,
              text: page.content
            });
          }
        }
        if (customTexts.length > 0) {
          contentUpdate.site_texts.custom = customTexts;
        }
      }
      
      const contentResult = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/content`, contentUpdate);
      console.log('Content update:', contentResult.success ? 'Success' : JSON.stringify(contentResult.error));
      
      // Update custom collection if provided (e.g., Replit1)
      let collectionResult = null;
      if (collectionData && collectionData.collectionName && collectionData.rows) {
        console.log(`Updating collection ${collectionData.collectionName}...`);
        const formattedRows = collectionData.rows.map(row => ({
          data: row.data || row
        }));
        collectionResult = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/collection/${collectionData.collectionName}/row`, formattedRows);
        console.log('Collection update:', collectionResult?.success ? 'Success' : JSON.stringify(collectionResult?.error));
      }
      
      const siteInfo = {
        ...result.data,
        churchInfo: churchInfo,
        pages: pages,
        created: new Date().toISOString()
      };
      createdSites.set(siteName, siteInfo);
      
      // Get preview URL and editor URL
      const previewResult = await callDudaAPI('GET', `/sites/multiscreen/${siteName}`);
      const previewUrl = previewResult.data?.preview_site_url || `https://${uniqueSiteName}.dudapreview.com`;
      const editorUrl = previewResult.data?.edit_site_url || null;
      
      res.json({ 
        success: true, 
        site: result.data,
        previewUrl: previewUrl,
        editorUrl: editorUrl,
        customizations: {
          businessInfo: businessResult.success,
          content: contentResult.success,
          collection: collectionResult?.success || null
        }
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/update pages on a site
app.post('/api/sites/:siteName/pages', async (req, res) => {
  try {
    const { siteName } = req.params;
    const { pages } = req.body;
    
    if (!pages || !Array.isArray(pages)) {
      return res.status(400).json({ success: false, error: 'Pages array required' });
    }
    
    const results = [];
    for (const page of pages) {
      const pageData = {
        page_title: page.name,
        page_path: `/${page.slug}`,
        page_seo: {
          title: page.name,
          description: page.description
        }
      };
      
      const result = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/pages`, pageData);
      results.push({ page: page.name, success: result.success, error: result.error });
    }
    
    res.json({ success: true, results: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update site content
app.post('/api/sites/:siteName/content', async (req, res) => {
  try {
    const { siteName } = req.params;
    const contentData = req.body;
    
    const result = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/content`, contentData);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get site details
app.get('/api/sites/:siteName', async (req, res) => {
  try {
    const { siteName } = req.params;
    
    // Check local store first
    if (createdSites.has(siteName)) {
      const localSite = createdSites.get(siteName);
      if (localSite.demo_mode) {
        return res.json({ success: true, site: localSite });
      }
    }
    
    const result = await callDudaAPI('GET', `/sites/multiscreen/${siteName}`);
    
    if (result.success) {
      res.json({ success: true, site: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a site
app.delete('/api/sites/:siteName', async (req, res) => {
  try {
    const { siteName } = req.params;
    
    createdSites.delete(siteName);
    
    const result = await callDudaAPI('DELETE', `/sites/multiscreen/${siteName}`);
    
    if (result.success) {
      res.json({ success: true, message: 'Site deleted successfully!' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Publish a site (only after payment confirmed)
app.post('/api/sites/:siteName/publish', async (req, res) => {
  try {
    const { siteName } = req.params;
    
    const result = await callDudaAPI('POST', `/sites/multiscreen/publish/${siteName}`);
    
    if (result.success) {
      res.json({ success: true, message: 'Site published successfully!' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// COLLECTIONS API ENDPOINTS
// ============================================

// Get all collections for a site
app.get('/api/sites/:siteName/collections', async (req, res) => {
  try {
    const { siteName } = req.params;
    const result = await callDudaAPI('GET', `/sites/multiscreen/${siteName}/collection`);
    
    if (result.success) {
      res.json({ success: true, collections: result.data || [] });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get collection details (schema and rows)
app.get('/api/sites/:siteName/collections/:collectionName', async (req, res) => {
  try {
    const { siteName, collectionName } = req.params;
    const result = await callDudaAPI('GET', `/sites/multiscreen/${siteName}/collection/${collectionName}`);
    
    if (result.success) {
      res.json({ success: true, collection: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get collection rows
app.get('/api/sites/:siteName/collections/:collectionName/rows', async (req, res) => {
  try {
    const { siteName, collectionName } = req.params;
    const result = await callDudaAPI('GET', `/sites/multiscreen/${siteName}/collection/${collectionName}/row`);
    
    if (result.success) {
      res.json({ success: true, rows: result.data || [] });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create rows in a collection
app.post('/api/sites/:siteName/collections/:collectionName/rows', async (req, res) => {
  try {
    const { siteName, collectionName } = req.params;
    const { rows } = req.body;
    
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'Rows array is required' });
    }
    
    // Format rows for DUDA API - each row needs a data object
    const formattedRows = rows.map(row => ({
      data: row.data || row
    }));
    
    const result = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/collection/${collectionName}/row`, formattedRows);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a specific row in a collection
app.put('/api/sites/:siteName/collections/:collectionName/rows/:rowId', async (req, res) => {
  try {
    const { siteName, collectionName, rowId } = req.params;
    const rowData = req.body;
    
    const result = await callDudaAPI('PUT', `/sites/multiscreen/${siteName}/collection/${collectionName}/row/${rowId}`, {
      data: rowData.data || rowData
    });
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a row from a collection
app.delete('/api/sites/:siteName/collections/:collectionName/rows/:rowId', async (req, res) => {
  try {
    const { siteName, collectionName, rowId } = req.params;
    
    const result = await callDudaAPI('DELETE', `/sites/multiscreen/${siteName}/collection/${collectionName}/row/${rowId}`);
    
    if (result.success) {
      res.json({ success: true, message: 'Row deleted successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update both Content Library AND a collection in one call
// This combines Business Info with custom collection data
app.post('/api/sites/:siteName/update-all', async (req, res) => {
  try {
    const { siteName } = req.params;
    const { contentLibrary, collection } = req.body;
    
    const results = {
      contentLibrary: null,
      collection: null
    };
    
    // Update Content Library (Business Info, Business Text, Business Images)
    if (contentLibrary) {
      results.contentLibrary = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/content`, contentLibrary);
    }
    
    // Update custom collection (like Replit1)
    if (collection && collection.name && collection.rows) {
      const formattedRows = collection.rows.map(row => ({
        data: row.data || row
      }));
      results.collection = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/collection/${collection.name}/row`, formattedRows);
    }
    
    res.json({ 
      success: true, 
      results: {
        contentLibrary: results.contentLibrary?.success || false,
        collection: results.collection?.success || false
      },
      details: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all rows in a collection and add new ones (full sync)
app.post('/api/sites/:siteName/collections/:collectionName/sync', async (req, res) => {
  try {
    const { siteName, collectionName } = req.params;
    const { rows } = req.body;
    
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'Rows array is required' });
    }
    
    // Get existing rows
    const existingResult = await callDudaAPI('GET', `/sites/multiscreen/${siteName}/collection/${collectionName}/row`);
    
    // Delete existing rows
    if (existingResult.success && existingResult.data && existingResult.data.length > 0) {
      for (const row of existingResult.data) {
        if (row.id) {
          await callDudaAPI('DELETE', `/sites/multiscreen/${siteName}/collection/${collectionName}/row/${row.id}`);
        }
      }
    }
    
    // Add new rows
    const formattedRows = rows.map(row => ({
      data: row.data || row
    }));
    
    const createResult = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/collection/${collectionName}/row`, formattedRows);
    
    if (createResult.success) {
      res.json({ success: true, data: createResult.data, synced: rows.length });
    } else {
      res.status(500).json({ success: false, error: createResult.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// WHMCS INTEGRATION ENDPOINTS
// ============================================

// Get available hosting products from WHMCS
app.get('/api/whmcs/products', async (req, res) => {
  try {
    const result = await callWHMCSAPI('GetProducts');
    
    if (result.success) {
      res.json({ success: true, products: result.data.products?.product || [] });
    } else {
      // Return default plans if WHMCS not configured
      res.json({
        success: true,
        products: [
          { id: 'starter', name: 'Starter', price: '$19/month', features: ['Professional Website', '5 GB Storage', 'Free SSL'] },
          { id: 'professional', name: 'Professional', price: '$39/month', features: ['10 Email Accounts', '20 GB Storage', 'Priority Support'], popular: true },
          { id: 'enterprise', name: 'Enterprise', price: '$79/month', features: ['Unlimited Email', 'Unlimited Storage', 'Custom Domain'] }
        ],
        source: 'default'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create client in WHMCS
app.post('/api/whmcs/client', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address, city, state, postcode, country } = req.body;
    
    if (!WHMCS_API_URL) {
      return res.json({
        success: true,
        clientId: 'demo-' + Date.now(),
        message: 'Demo client created (WHMCS not configured)',
        demo_mode: true
      });
    }
    
    // Check if client exists
    const existingClient = await callWHMCSAPI('GetClientsDetails', { email: email });
    if (existingClient.success && existingClient.data.client) {
      return res.json({ success: true, clientId: existingClient.data.client.id, existing: true });
    }
    
    // Create new client
    const result = await callWHMCSAPI('AddClient', {
      firstname: firstName || email.split('@')[0],
      lastname: lastName || 'Church',
      email: email,
      password2: password,
      phonenumber: phone || '',
      address1: address || '',
      city: city || '',
      state: state || '',
      postcode: postcode || '',
      country: country || 'US'
    });
    
    if (result.success) {
      res.json({ success: true, clientId: result.data.clientid });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create order in WHMCS
app.post('/api/whmcs/order', async (req, res) => {
  try {
    const { clientId, productId, siteName, paymentMethod } = req.body;
    
    if (!WHMCS_API_URL) {
      return res.json({
        success: true,
        orderId: 'demo-order-' + Date.now(),
        invoiceId: 'demo-invoice-' + Date.now(),
        message: 'Demo order created (WHMCS not configured)',
        demo_mode: true
      });
    }
    
    const result = await callWHMCSAPI('AddOrder', {
      clientid: clientId,
      pid: productId,
      paymentmethod: paymentMethod || 'stripe',
      customfields: JSON.stringify({ siteName: siteName })
    });
    
    if (result.success) {
      res.json({
        success: true,
        orderId: result.data.orderid,
        invoiceId: result.data.invoiceid
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check payment status (for polling)
app.get('/api/whmcs/invoice/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    if (!WHMCS_API_URL || invoiceId.startsWith('demo-')) {
      return res.json({
        success: true,
        status: 'pending',
        demo_mode: true
      });
    }
    
    const result = await callWHMCSAPI('GetInvoice', { invoiceid: invoiceId });
    
    if (result.success) {
      res.json({
        success: true,
        status: result.data.status?.toLowerCase(),
        total: result.data.total,
        paid: result.data.status === 'Paid'
      });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SIGNUP ENDPOINT (Creates account, no publish)
// ============================================

app.post('/api/signup', async (req, res) => {
  try {
    const { siteName, email, password, plan, churchName, firstName, lastName } = req.body;
    
    if (!email || !plan) {
      return res.status(400).json({ success: false, error: 'Email and plan are required' });
    }
    
    // Step 1: Create WHMCS client
    const clientResult = await callWHMCSAPI('AddClient', {
      firstname: firstName || churchName || email.split('@')[0],
      lastname: lastName || 'Church',
      email: email,
      password2: password
    });
    
    const clientId = clientResult.success ? clientResult.data?.clientid : 'pending';
    
    // Step 2: Create order in WHMCS (if configured)
    let orderResult = { success: false };
    if (clientResult.success) {
      orderResult = await callWHMCSAPI('AddOrder', {
        clientid: clientId,
        pid: getPlanProductId(plan),
        paymentmethod: 'stripe'
      });
    }
    
    // Store signup info
    if (createdSites.has(siteName)) {
      const siteInfo = createdSites.get(siteName);
      siteInfo.clientId = clientId;
      siteInfo.orderId = orderResult.data?.orderid;
      siteInfo.invoiceId = orderResult.data?.invoiceid;
      siteInfo.plan = plan;
      siteInfo.email = email;
      createdSites.set(siteName, siteInfo);
    }
    
    res.json({ 
      success: true, 
      message: 'Account created! Complete payment to publish your site.',
      clientId: clientId,
      orderId: orderResult.data?.orderid,
      invoiceId: orderResult.data?.invoiceid,
      siteName: siteName,
      plan: plan,
      // Don't auto-publish - wait for payment
      published: false
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Map plan names to WHMCS product IDs (configure these based on your WHMCS setup)
function getPlanProductId(planName) {
  const planMap = {
    'starter': process.env.WHMCS_PRODUCT_STARTER || '1',
    'professional': process.env.WHMCS_PRODUCT_PROFESSIONAL || '2',
    'enterprise': process.env.WHMCS_PRODUCT_ENTERPRISE || '3'
  };
  return planMap[planName] || '1';
}

// Check invoice payment status (for polling)
app.get('/api/invoice/:invoiceId/status', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Invoice ID required' });
    }
    
    const result = await callWHMCSAPI('GetInvoice', { invoiceid: invoiceId });
    
    if (result.success) {
      const status = result.data.status; // Paid, Unpaid, Cancelled, etc.
      res.json({ 
        success: true, 
        invoiceId: invoiceId,
        status: status,
        isPaid: status === 'Paid',
        total: result.data.total,
        paymentmethod: result.data.paymentmethod
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Publish site after payment is confirmed
app.post('/api/sites/:siteName/publish', async (req, res) => {
  try {
    const { siteName } = req.params;
    const { invoiceId } = req.body;
    
    // Verify payment if invoiceId provided
    if (invoiceId) {
      const invoiceResult = await callWHMCSAPI('GetInvoice', { invoiceid: invoiceId });
      if (!invoiceResult.success || invoiceResult.data.status !== 'Paid') {
        return res.status(400).json({ 
          success: false, 
          error: 'Payment not confirmed. Please complete payment first.' 
        });
      }
    }
    
    // Check if demo mode
    const siteInfo = createdSites.get(siteName);
    if (siteInfo?.demo_mode) {
      return res.json({ 
        success: true, 
        message: 'Demo site published (simulation)',
        published: true,
        siteUrl: `https://${siteName}.example.com`
      });
    }
    
    // Publish the site via DUDA API
    const result = await callDudaAPI('POST', `/sites/multiscreen/publish/${siteName}`);
    
    if (result.success) {
      // Update stored info
      if (siteInfo) {
        siteInfo.published = true;
        siteInfo.publishedAt = new Date().toISOString();
        createdSites.set(siteName, siteInfo);
      }
      
      res.json({ 
        success: true, 
        message: 'Site published successfully!',
        published: true,
        siteUrl: result.data?.site_default_domain || result.data?.site_url
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update site business info (used after site creation)
app.post('/api/sites/:siteName/business-info', async (req, res) => {
  try {
    const { siteName } = req.params;
    const { churchInfo } = req.body;
    
    if (!churchInfo) {
      return res.status(400).json({ success: false, error: 'Church info required' });
    }
    
    const businessInfo = {
      business_name: churchInfo.churchName,
      email: churchInfo.email || undefined,
      phone_number: churchInfo.phone || undefined,
      address: churchInfo.address ? {
        street: churchInfo.address,
        city: churchInfo.city || '',
        state: churchInfo.state || '',
        zip_code: churchInfo.zip || '',
        country: churchInfo.country || 'US'
      } : undefined
    };
    
    // Remove undefined values
    Object.keys(businessInfo).forEach(key => 
      businessInfo[key] === undefined && delete businessInfo[key]
    );
    
    const result = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/content`, {
      site_texts: {},
      business_data: businessInfo
    });
    
    if (result.success) {
      res.json({ success: true, message: 'Business info updated' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN API ENDPOINTS
// ============================================

// Admin authentication middleware
function requireAdmin(req, res, next) {
    const sessionId = req.headers['x-admin-session'] || req.query.session;
    if (sessionId && adminSessions.has(sessionId)) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized' });
    }
}

// Check admin status
app.get('/api/admin/status', (req, res) => {
    const adminConfig = loadConfig(ADMIN_CONFIG, { admin_password_hash: null });
    const sessionId = req.headers['x-admin-session'];
    
    res.json({
        needsSetup: !adminConfig.admin_password_hash,
        authenticated: sessionId && adminSessions.has(sessionId)
    });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ success: false, error: 'Password required' });
    }
    
    const adminConfig = loadConfig(ADMIN_CONFIG, { admin_password_hash: null });
    const hashedPassword = hashPassword(password);
    
    // First-time setup: set the password
    if (!adminConfig.admin_password_hash) {
        adminConfig.admin_password_hash = hashedPassword;
        saveConfig(ADMIN_CONFIG, adminConfig);
        
        const sessionId = crypto.randomBytes(32).toString('hex');
        adminSessions.set(sessionId, { created: Date.now() });
        
        res.json({ success: true, sessionId, message: 'Admin password set' });
        return;
    }
    
    // Verify password
    if (hashedPassword === adminConfig.admin_password_hash) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        adminSessions.set(sessionId, { created: Date.now() });
        
        res.json({ success: true, sessionId });
    } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    const sessionId = req.headers['x-admin-session'];
    if (sessionId) {
        adminSessions.delete(sessionId);
    }
    res.json({ success: true });
});

// Change admin password
app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Current and new passwords required' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    
    const adminConfig = loadConfig(ADMIN_CONFIG, { admin_password_hash: null });
    
    if (hashPassword(currentPassword) !== adminConfig.admin_password_hash) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    
    adminConfig.admin_password_hash = hashPassword(newPassword);
    saveConfig(ADMIN_CONFIG, adminConfig);
    
    res.json({ success: true, message: 'Password updated' });
});

// Get all templates (admin)
app.get('/api/admin/templates', (req, res) => {
    const templatesConfig = loadConfig(TEMPLATES_CONFIG, { approved_templates: [] });
    res.json({ success: true, templates: templatesConfig.approved_templates });
});

// Add template (admin)
app.post('/api/admin/templates', (req, res) => {
    const { base_site_name, name, description, custom_thumbnail, enabled } = req.body;
    
    if (!base_site_name || !name) {
        return res.status(400).json({ success: false, error: 'Template ID and name are required' });
    }
    
    const templatesConfig = loadConfig(TEMPLATES_CONFIG, { approved_templates: [] });
    
    // Check if template already exists
    const exists = templatesConfig.approved_templates.some(t => t.base_site_name === base_site_name);
    if (exists) {
        return res.status(400).json({ success: false, error: 'Template with this ID already exists' });
    }
    
    templatesConfig.approved_templates.push({
        base_site_name,
        name,
        description: description || '',
        custom_thumbnail: custom_thumbnail || null,
        enabled: enabled !== false
    });
    
    saveConfig(TEMPLATES_CONFIG, templatesConfig);
    res.json({ success: true, message: 'Template added' });
});

// Update template (admin)
app.put('/api/admin/templates/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const { base_site_name, name, description, custom_thumbnail, enabled } = req.body;
    
    const templatesConfig = loadConfig(TEMPLATES_CONFIG, { approved_templates: [] });
    
    if (index < 0 || index >= templatesConfig.approved_templates.length) {
        return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    templatesConfig.approved_templates[index] = {
        base_site_name: base_site_name || templatesConfig.approved_templates[index].base_site_name,
        name: name || templatesConfig.approved_templates[index].name,
        description: description !== undefined ? description : templatesConfig.approved_templates[index].description,
        custom_thumbnail: custom_thumbnail !== undefined ? custom_thumbnail : templatesConfig.approved_templates[index].custom_thumbnail,
        enabled: enabled !== undefined ? enabled : templatesConfig.approved_templates[index].enabled
    };
    
    saveConfig(TEMPLATES_CONFIG, templatesConfig);
    res.json({ success: true, message: 'Template updated' });
});

// Delete template (admin)
app.delete('/api/admin/templates/:index', (req, res) => {
    const index = parseInt(req.params.index);
    
    const templatesConfig = loadConfig(TEMPLATES_CONFIG, { approved_templates: [] });
    
    if (index < 0 || index >= templatesConfig.approved_templates.length) {
        return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    templatesConfig.approved_templates.splice(index, 1);
    saveConfig(TEMPLATES_CONFIG, templatesConfig);
    
    res.json({ success: true, message: 'Template deleted' });
});

// ============================================
// SERVE HTML PAGES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-new.html'));
});

app.get('/old', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/funnel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'funnel.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Church Web Global server running on port ${PORT}`);
  console.log(`📍 Access at: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ DUDA API configured: ${!!DUDA_API_USER}`);
  console.log(`🤖 DUDA MCP AI: ${!!DUDA_MCP_TOKEN}`);
  console.log(`💳 WHMCS API: ${!!WHMCS_API_URL}`);
});
