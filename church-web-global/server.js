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
app.use(express.static('public'));

// DUDA API Configuration
const DUDA_API_USER = process.env.DUDA_API_USER;
const DUDA_API_PASSWORD = process.env.DUDA_API_PASSWORD;
const DUDA_API_ENDPOINT = process.env.DUDA_API_ENDPOINT || 'https://api.duda.co/api';

// Create base64 encoded auth string
const authString = Buffer.from(`${DUDA_API_USER}:${DUDA_API_PASSWORD}`).toString('base64');

// DUDA API Headers
const dudaHeaders = {
  'Authorization': `Basic ${authString}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
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
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('DUDA API Error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || { message: error.message }
    };
  }
}

// ============================================
// API ROUTES
// ============================================

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Church Web Global API is running!',
    timestamp: new Date().toISOString()
  });
});

// Get available templates
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

// Create a new site from template
app.post('/api/sites/create', async (req, res) => {
  try {
    const { templateId, siteName, pages, customization } = req.body;
    
    // Generate a unique site name (you may want to add more logic here)
    const uniqueSiteName = `${siteName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    
    const siteData = {
      template_id: templateId,
      site_name: uniqueSiteName,
      site_domain: `${uniqueSiteName}.churchwebglobal.com`,
      site_data: {
        site_business_info: {
          business_name: siteName,
          email: customization?.email || '',
          phone: customization?.phone || ''
        }
      }
    };
    
    const result = await callDudaAPI('POST', '/sites/multiscreen/create', siteData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        site: result.data,
        previewUrl: `https://${uniqueSiteName}.churchwebglobal.com`
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update site content
app.post('/api/sites/:siteName/update', async (req, res) => {
  try {
    const { siteName } = req.params;
    const updateData = req.body;
    
    const result = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/content`, updateData);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Publish a site
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

// Get site details
app.get('/api/sites/:siteName', async (req, res) => {
  try {
    const { siteName } = req.params;
    
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

// Delete a site (for cleanup of abandoned preview sites)
app.delete('/api/sites/:siteName', async (req, res) => {
  try {
    const { siteName } = req.params;
    
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

// Handle signup (placeholder - you'll integrate payment here)
app.post('/api/signup', async (req, res) => {
  try {
    const { siteName, email, plan, churchName } = req.body;
    
    // TODO: Add payment processing (Stripe/PayPal)
    // TODO: Add user account creation
    // TODO: Add email confirmation
    
    // For now, just publish the site
    const publishResult = await callDudaAPI('POST', `/sites/multiscreen/publish/${siteName}`);
    
    if (publishResult.success) {
      res.json({ 
        success: true, 
        message: 'Account created successfully!',
        site: siteName
      });
    } else {
      res.status(500).json({ success: false, error: publishResult.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

app.listen(PORT, () => {
  console.log(`🚀 Church Web Global server running on port ${PORT}`);
  console.log(`📍 Access at: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ DUDA API configured`);
});
