// server.js - Main Express Server for Church Web Global
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

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
    
    console.log(`DUDA API Request: ${method} ${endpoint}`);
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
    
    console.log(`WHMCS API Request: ${action}`);
    const response = await axios.post(WHMCS_API_URL, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (response.data.result === 'success') {
      return { success: true, data: response.data };
    } else {
      return { success: false, error: response.data.message || 'WHMCS error' };
    }
  } catch (error) {
    console.error('WHMCS API Error:', error.message);
    return { success: false, error: error.message };
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

// Get only CUSTOM templates (filtered)
app.get('/api/templates/custom', async (req, res) => {
  try {
    const result = await callDudaAPI('GET', '/sites/multiscreen/templates');
    
    if (result.success && Array.isArray(result.data)) {
      // Filter to only show custom templates (not DUDA default templates)
      // Custom templates have account_name matching the API user or specific naming patterns
      const customTemplates = result.data.filter(template => {
        // Check if it's a custom template by looking at properties
        // DUDA custom templates typically have template_id > 1000000 or specific naming
        const isCustom = template.template_type === 'CUSTOM' || 
                        template.account_name === DUDA_API_USER ||
                        (template.template_name && (
                          template.template_name.toUpperCase().includes('CHURCH') ||
                          template.template_name.toUpperCase().includes('MINISTRY') ||
                          template.template_name.toUpperCase().includes('FAITH')
                        ));
        return isCustom;
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

// Create a new site from template (unpublished)
app.post('/api/sites/create', async (req, res) => {
  try {
    const { templateId, churchInfo, pages } = req.body;
    
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
    
    // Create real DUDA site
    const siteData = {
      template_id: templateId,
      default_domain_prefix: uniqueSiteName,
      site_data: {
        site_business_info: {
          business_name: churchInfo.churchName,
          email: churchInfo.email || '',
          phone: churchInfo.phone || '',
          address: churchInfo.address ? { street: churchInfo.address } : undefined
        }
      }
    };
    
    const result = await callDudaAPI('POST', '/sites/multiscreen/create', siteData);
    
    if (result.success) {
      const siteInfo = {
        ...result.data,
        churchInfo: churchInfo,
        pages: pages,
        created: new Date().toISOString()
      };
      createdSites.set(result.data.site_name, siteInfo);
      
      // Get preview URL
      const previewResult = await callDudaAPI('GET', `/sites/multiscreen/${result.data.site_name}`);
      const previewUrl = previewResult.data?.preview_site_url || `https://${uniqueSiteName}.dudapreview.com`;
      
      res.json({ 
        success: true, 
        site: result.data,
        previewUrl: previewUrl
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

// ============================================
// SERVE HTML PAGES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/funnel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'funnel.html'));
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
