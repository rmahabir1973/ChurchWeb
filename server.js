// server.js - Main Express Server for Church Web Global
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const OpenAI = require('openai');
const { Pool } = require('pg');
const postmark = require('postmark');
const multer = require('multer');
const { Duda } = require('@dudadev/partner-api');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'thumb-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Postmark email client
const postmarkClient = process.env.POSTMARK_API_TOKEN 
    ? new postmark.ServerClient(process.env.POSTMARK_API_TOKEN)
    : null;

// Config file paths
const CONFIG_DIR = path.join(__dirname, 'config');
const TEMPLATES_CONFIG = path.join(CONFIG_DIR, 'templates.json');
const ADMIN_CONFIG = path.join(CONFIG_DIR, 'admin.json');
const TRIALS_CONFIG = path.join(CONFIG_DIR, 'trials.json');

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

// PostgreSQL Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Database helper functions
async function dbQuery(text, params = []) {
    try {
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Initialize database tables (runs on startup)
async function initializeDatabase() {
    try {
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS clients (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                church_name VARCHAR(255),
                phone VARCHAR(50),
                whmcs_client_id INTEGER,
                duda_account_created BOOLEAN DEFAULT FALSE,
                is_legacy BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS sites (
                id SERIAL PRIMARY KEY,
                site_name VARCHAR(255) UNIQUE NOT NULL,
                client_id INTEGER REFERENCES clients(id),
                template_id VARCHAR(100),
                church_name VARCHAR(255),
                preview_url TEXT,
                is_published BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS trials (
                id SERIAL PRIMARY KEY,
                client_id INTEGER REFERENCES clients(id),
                site_id INTEGER REFERENCES sites(id),
                email VARCHAR(255) NOT NULL,
                site_name VARCHAR(255) NOT NULL,
                trial_start TIMESTAMP WITH TIME ZONE NOT NULL,
                trial_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
                has_paid BOOLEAN DEFAULT FALSE,
                has_publish_access BOOLEAN DEFAULT FALSE,
                upgraded_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(email, site_name)
      )
    `);
    // Master templates table for MCP template tracking
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS master_templates (
        id SERIAL PRIMARY KEY,
        template_id VARCHAR(100) UNIQUE NOT NULL,
        design_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        site_name VARCHAR(255),
        duda_template_id VARCHAR(100),
        thumbnail_url TEXT,
        colors JSONB,
        fonts JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        church_data_collection_created BOOLEAN DEFAULT FALSE,
        content_library_configured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_master_templates_design_id ON master_templates(design_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_master_templates_active ON master_templates(is_active)`);
    console.log('Database tables initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Client DB operations
async function getOrCreateClient(email, data = {}) {
    const existing = await dbQuery('SELECT * FROM clients WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }
    const result = await dbQuery(
        `INSERT INTO clients (email, first_name, last_name, church_name, phone, duda_account_created)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [email.toLowerCase(), data.firstName || null, data.lastName || null, 
         data.churchName || null, data.phone || null, data.dudaAccountCreated || false]
    );
    return result.rows[0];
}

async function updateClient(email, data) {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (data.dudaAccountCreated !== undefined) {
        updates.push(`duda_account_created = $${paramIndex++}`);
        values.push(data.dudaAccountCreated);
    }
    if (data.whmcsClientId !== undefined) {
        updates.push(`whmcs_client_id = $${paramIndex++}`);
        values.push(data.whmcsClientId);
    }
    if (data.isLegacy !== undefined) {
        updates.push(`is_legacy = $${paramIndex++}`);
        values.push(data.isLegacy);
    }
    
    if (updates.length === 0) return null;
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(email.toLowerCase());
    
    const result = await dbQuery(
        `UPDATE clients SET ${updates.join(', ')} WHERE email = $${paramIndex} RETURNING *`,
        values
    );
    return result.rows[0];
}

// Site DB operations
async function getOrCreateSite(siteName, clientId, data = {}) {
    const existing = await dbQuery('SELECT * FROM sites WHERE site_name = $1', [siteName]);
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }
    const result = await dbQuery(
        `INSERT INTO sites (site_name, client_id, template_id, church_name, preview_url)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [siteName, clientId, data.templateId || null, data.churchName || null, data.previewUrl || null]
    );
    return result.rows[0];
}

// Trial DB operations (replaces JSON file storage)
async function getTrialFromDB(email, siteName = null) {
    if (siteName) {
        const result = await dbQuery(
            'SELECT * FROM trials WHERE LOWER(email) = $1 AND site_name = $2',
            [email.toLowerCase(), siteName]
        );
        return result.rows[0] || null;
    }
    // Return most recent trial for email
    const result = await dbQuery(
        'SELECT * FROM trials WHERE LOWER(email) = $1 ORDER BY trial_start DESC LIMIT 1',
        [email.toLowerCase()]
    );
    return result.rows[0] || null;
}

async function saveTrialToDB(trialData) {
    const existing = await getTrialFromDB(trialData.email, trialData.siteName);
    
    if (existing) {
        const result = await dbQuery(
            `UPDATE trials SET 
             has_paid = $1, has_publish_access = $2, 
             upgraded_at = $3, updated_at = CURRENT_TIMESTAMP
             WHERE LOWER(email) = $4 AND site_name = $5 RETURNING *`,
            [trialData.hasPaid || false, trialData.hasPublishAccess || false,
             trialData.hasPaid ? new Date() : null, trialData.email.toLowerCase(), trialData.siteName]
        );
        return result.rows[0];
    }
    
    const result = await dbQuery(
        `INSERT INTO trials (email, site_name, trial_start, trial_expiry, has_paid, has_publish_access, client_id, site_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [trialData.email.toLowerCase(), trialData.siteName, 
         trialData.trialStart, trialData.trialExpiry,
         trialData.hasPaid || false, trialData.hasPublishAccess || false,
         trialData.clientId || null, trialData.siteId || null]
    );
    return result.rows[0];
}

async function getAllClientsFromDB() {
    const result = await dbQuery('SELECT * FROM clients ORDER BY created_at DESC');
    return result.rows;
}

async function getClientSitesFromDB(email) {
    const result = await dbQuery(`
        SELECT s.*, t.trial_start, t.trial_expiry, t.has_paid, t.has_publish_access
        FROM sites s
        LEFT JOIN trials t ON s.site_name = t.site_name
        WHERE s.client_id = (SELECT id FROM clients WHERE LOWER(email) = $1)
        ORDER BY s.created_at DESC
    `, [email.toLowerCase()]);
    return result.rows;
}

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

// DUDA Partner API Client (for direct API access)
let dudaClient = null;
if (DUDA_API_USER && DUDA_API_PASSWORD) {
    dudaClient = new Duda({
        user: DUDA_API_USER,
        pass: DUDA_API_PASSWORD,
        env: Duda.Envs.direct
    });
    console.log('DUDA Partner API client initialized');
}

// WHMCS API Configuration
const WHMCS_API_URL = process.env.WHMCS_API_URL;
const WHMCS_API_IDENTIFIER = process.env.WHMCS_API_IDENTIFIER;
const WHMCS_API_SECRET = process.env.WHMCS_API_SECRET;
console.log(`WHMCS API configured: ${WHMCS_API_URL ? 'Yes' : 'No'}`);

// Cloudflare API Configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
console.log(`Cloudflare API configured: ${CLOUDFLARE_API_TOKEN ? 'Yes' : 'No'}`);

// SmarterMail API Configuration
const SMARTERMAIL_URL = process.env.SMARTERMAIL_URL;
const SMARTERMAIL_ADMIN_USER = process.env.SMARTERMAIL_ADMIN_USER;
const SMARTERMAIL_ADMIN_PASSWORD = process.env.SMARTERMAIL_ADMIN_PASSWORD;
console.log(`SmarterMail API configured: ${SMARTERMAIL_URL ? 'Yes' : 'No'}`);

// SmarterMail token cache (tokens expire every 15 minutes)
let smarterMailTokenCache = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null
};

// Helper function for SmarterMail authentication
async function getSmarterMailToken() {
    if (!SMARTERMAIL_URL || !SMARTERMAIL_ADMIN_USER || !SMARTERMAIL_ADMIN_PASSWORD) {
        return { success: false, error: 'SmarterMail not configured' };
    }
    
    // Check if we have a valid cached token (with 1 minute buffer)
    if (smarterMailTokenCache.accessToken && smarterMailTokenCache.expiresAt > Date.now() + 60000) {
        return { success: true, token: smarterMailTokenCache.accessToken };
    }
    
    // Try to refresh if we have a refresh token
    if (smarterMailTokenCache.refreshToken) {
        try {
            const refreshResponse = await axios.post(`${SMARTERMAIL_URL}/api/v1/auth/refresh-token`, {
                token: smarterMailTokenCache.refreshToken
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            if (refreshResponse.data.accessToken) {
                smarterMailTokenCache.accessToken = refreshResponse.data.accessToken;
                smarterMailTokenCache.refreshToken = refreshResponse.data.refreshToken;
                smarterMailTokenCache.expiresAt = Date.now() + (14 * 60 * 1000); // 14 minutes
                return { success: true, token: smarterMailTokenCache.accessToken };
            }
        } catch (refreshError) {
            console.log('SmarterMail token refresh failed, re-authenticating...');
        }
    }
    
    // Authenticate with username/password
    try {
        const authResponse = await axios.post(`${SMARTERMAIL_URL}/api/v1/auth/authenticate-user`, {
            username: SMARTERMAIL_ADMIN_USER,
            password: SMARTERMAIL_ADMIN_PASSWORD
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        if (authResponse.data.accessToken) {
            smarterMailTokenCache.accessToken = authResponse.data.accessToken;
            smarterMailTokenCache.refreshToken = authResponse.data.refreshToken;
            smarterMailTokenCache.expiresAt = Date.now() + (14 * 60 * 1000); // 14 minutes
            return { success: true, token: smarterMailTokenCache.accessToken };
        } else {
            return { success: false, error: 'Authentication failed - no token received' };
        }
    } catch (error) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data || { message: error.message };
        console.error(`SmarterMail Auth Error [${statusCode}]:`, errorData);
        return { success: false, error: errorData.message || 'Authentication failed', statusCode };
    }
}

// Helper function for SmarterMail API calls
async function callSmarterMailAPI(method, endpoint, data = null) {
    const tokenResult = await getSmarterMailToken();
    if (!tokenResult.success) {
        return tokenResult;
    }
    
    try {
        const config = {
            method: method,
            url: `${SMARTERMAIL_URL}/api/v1${endpoint}`,
            headers: {
                'Authorization': `Bearer ${tokenResult.token}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        };
        
        if (data) {
            config.data = data;
        }
        
        console.log(`SmarterMail API Request: ${method} ${endpoint}`);
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data || { message: error.message };
        console.error(`SmarterMail API Error [${statusCode}]:`, errorData);
        
        // If unauthorized, clear token cache and retry once
        if (statusCode === 401) {
            smarterMailTokenCache = { accessToken: null, refreshToken: null, expiresAt: null };
            const retryToken = await getSmarterMailToken();
            if (retryToken.success) {
                try {
                    const retryConfig = {
                        method: method,
                        url: `${SMARTERMAIL_URL}/api/v1${endpoint}`,
                        headers: {
                            'Authorization': `Bearer ${retryToken.token}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    };
                    if (data) retryConfig.data = data;
                    const retryResponse = await axios(retryConfig);
                    return { success: true, data: retryResponse.data };
                } catch (retryError) {
                    return { success: false, error: retryError.response?.data || retryError.message, statusCode: retryError.response?.status };
                }
            }
        }
        
        return { success: false, error: errorData, statusCode };
    }
}

// Helper function for Cloudflare API calls
async function callCloudflareAPI(method, endpoint, data = null) {
    if (!CLOUDFLARE_API_TOKEN) {
        return { success: false, error: 'Cloudflare API not configured' };
    }
    
    try {
        const config = {
            method: method,
            url: `https://api.cloudflare.com/client/v4${endpoint}`,
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: data
        };
        
        console.log(`Cloudflare API Request: ${method} ${endpoint}`);
        const response = await axios(config);
        
        if (response.data.success) {
            return { success: true, data: response.data.result, result_info: response.data.result_info };
        } else {
            return { success: false, error: response.data.errors };
        }
    } catch (error) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data || { message: error.message };
        console.error(`Cloudflare API Error [${statusCode}]:`, errorData);
        return { success: false, error: errorData, statusCode };
    }
}

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

// Change admin password - protected
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
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

// Get all templates (admin) - protected
app.get('/api/admin/templates', requireAdmin, (req, res) => {
    const templatesConfig = loadConfig(TEMPLATES_CONFIG, { approved_templates: [] });
    res.json({ success: true, templates: templatesConfig.approved_templates });
});

// Add template (admin) - protected
app.post('/api/admin/templates', requireAdmin, (req, res) => {
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

// Update template (admin) - protected
app.put('/api/admin/templates/:index', requireAdmin, (req, res) => {
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

// Delete template (admin) - protected
app.delete('/api/admin/templates/:index', requireAdmin, (req, res) => {
    const index = parseInt(req.params.index);
    
    const templatesConfig = loadConfig(TEMPLATES_CONFIG, { approved_templates: [] });
    
    if (index < 0 || index >= templatesConfig.approved_templates.length) {
        return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    templatesConfig.approved_templates.splice(index, 1);
    saveConfig(TEMPLATES_CONFIG, templatesConfig);
    
    res.json({ success: true, message: 'Template deleted' });
});

// Upload thumbnail image (admin) - protected
app.post('/api/admin/upload-thumbnail', requireAdmin, upload.single('thumbnail'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ 
            success: true, 
            url: fileUrl,
            filename: req.file.filename,
            message: 'Thumbnail uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: error.message || 'Upload failed' });
    }
});

// ============================================
// DUDA SSO & FREE TRIAL MANAGEMENT
// ============================================

const TRIAL_DAYS = 14;

// Helper: Check if trial is expired (works with both JSON and DB formats)
function isTrialExpired(trial) {
    if (!trial) return true;
    const expiry = trial.trialExpiry || trial.trial_expiry;
    if (!expiry) return true;
    return new Date() > new Date(expiry);
}

// Helper: Calculate days remaining (works with both JSON and DB formats)
function getTrialDaysRemaining(trial) {
    if (!trial) return 0;
    const expiry = trial.trialExpiry || trial.trial_expiry;
    if (!expiry) return 0;
    const now = new Date();
    const expiryDate = new Date(expiry);
    const diff = expiryDate - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Create DUDA account and grant trial permissions
app.post('/api/trial/start', async (req, res) => {
    try {
        const { email, siteName, churchName } = req.body;
        
        if (!email || !siteName) {
            return res.status(400).json({ success: false, error: 'Email and site name are required' });
        }
        
        // Check if trial already exists for this email + site combination (use DB)
        let trial = await getTrialFromDB(email, siteName);
        
        if (trial) {
            // Return existing trial info
            const daysRemaining = getTrialDaysRemaining(trial);
            return res.json({
                success: true,
                trial: {
                    email: trial.email,
                    siteName: trial.site_name,
                    daysRemaining,
                    isExpired: isTrialExpired(trial),
                    hasPaid: trial.has_paid,
                    hasPublishAccess: trial.has_publish_access
                },
                message: 'Trial already active'
            });
        }
        
        // Create or get client record
        const client = await getOrCreateClient(email, { churchName });
        
        // Create DUDA account for the user
        console.log(`Creating DUDA account for: ${email}`);
        const accountResult = await callDudaAPI('POST', '/accounts/create', {
            account_name: email
        });
        
        // Account might already exist (which is fine)
        if (!accountResult.success && !accountResult.error?.message?.includes('already exists')) {
            console.log('DUDA account creation result:', accountResult);
        } else {
            await updateClient(email, { dudaAccountCreated: true });
        }
        
        // Grant EDIT-only permissions (no PUBLISH during trial)
        console.log(`Granting trial permissions for site: ${siteName}`);
        const permissionsResult = await callDudaAPI('POST', `/accounts/${encodeURIComponent(email)}/sites/${siteName}/permissions`, {
            permissions: ['EDIT', 'DEV_MODE', 'STATS_TAB', 'SEO', 'BLOG']
            // Note: PUBLISH is NOT included - they can only publish after paying
        });
        
        if (!permissionsResult.success) {
            console.error('Permission grant failed:', permissionsResult.error);
        }
        
        // Create site record
        const site = await getOrCreateSite(siteName, client.id, { churchName });
        
        // Save trial info to database
        const trialStart = new Date();
        const trialExpiry = new Date(trialStart);
        trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DAYS);
        
        trial = await saveTrialToDB({
            email: email.toLowerCase(),
            siteName,
            trialStart: trialStart.toISOString(),
            trialExpiry: trialExpiry.toISOString(),
            hasPaid: false,
            hasPublishAccess: false,
            clientId: client.id,
            siteId: site.id
        });
        
        res.json({
            success: true,
            trial: {
                email: trial.email,
                siteName: trial.site_name,
                daysRemaining: TRIAL_DAYS,
                isExpired: false,
                hasPaid: false,
                hasPublishAccess: false
            },
            message: `${TRIAL_DAYS}-day free trial started! You can edit your site but publishing requires a paid plan.`
        });
        
    } catch (error) {
        console.error('Trial start error:', error);
        res.status(500).json({ success: false, error: 'Failed to start trial' });
    }
});

// Generate SSO link for editor access
app.post('/api/trial/editor-link', async (req, res) => {
    try {
        const { email, siteName } = req.body;
        
        if (!email || !siteName) {
            return res.status(400).json({ success: false, error: 'Email and site name are required' });
        }
        
        // Check trial status from database
        const trial = await getTrialFromDB(email, siteName);
        if (!trial) {
            return res.status(404).json({ success: false, error: 'No trial found. Please start a trial first.' });
        }
        
        if (isTrialExpired(trial) && !trial.has_paid) {
            return res.status(403).json({ 
                success: false, 
                error: 'Trial expired. Please upgrade to continue editing.',
                trialExpired: true
            });
        }
        
        // Ensure permissions are set (in case returning user)
        console.log(`Ensuring permissions for: ${email} -> ${siteName}`);
        await callDudaAPI('POST', `/accounts/${encodeURIComponent(email)}/sites/${siteName}/permissions`, {
            permissions: trial.has_paid 
                ? ['EDIT', 'PUBLISH', 'DEV_MODE', 'STATS_TAB', 'SEO', 'BLOG', 'CUSTOM_DOMAIN', 'BACKUPS']
                : ['EDIT', 'DEV_MODE', 'STATS_TAB', 'SEO', 'BLOG']
        });
        
        // Generate SSO link to the editor
        console.log(`Generating SSO link for: ${email} -> ${siteName}`);
        const ssoResult = await callDudaAPI('GET', `/accounts/sso/${encodeURIComponent(email)}/link?site_name=${siteName}&target=EDITOR`);
        
        if (!ssoResult.success || !ssoResult.data?.url) {
            console.error('SSO link generation failed:', ssoResult.error);
            return res.status(500).json({ success: false, error: 'Failed to generate editor link' });
        }
        
        res.json({
            success: true,
            editorUrl: ssoResult.data.url,
            daysRemaining: getTrialDaysRemaining(trial),
            hasPaid: trial.has_paid,
            canPublish: trial.has_publish_access
        });
        
    } catch (error) {
        console.error('Editor link error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate editor link' });
    }
});

// Get trial status
app.get('/api/trial/status/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const siteName = req.query.siteName || null;
        const trial = await getTrialFromDB(email, siteName);
        
        if (!trial) {
            return res.json({ success: true, hasTrial: false });
        }
        
        res.json({
            success: true,
            hasTrial: true,
            trial: {
                email: trial.email,
                siteName: trial.site_name,
                daysRemaining: getTrialDaysRemaining(trial),
                isExpired: isTrialExpired(trial),
                hasPaid: trial.has_paid,
                hasPublishAccess: trial.has_publish_access
            }
        });
        
    } catch (error) {
        console.error('Trial status error:', error);
        res.status(500).json({ success: false, error: 'Failed to get trial status' });
    }
});

// Upgrade trial - grant PUBLISH permission after payment
app.post('/api/trial/upgrade', async (req, res) => {
    try {
        const { email, siteName, invoiceId } = req.body;
        
        if (!email || !siteName) {
            return res.status(400).json({ success: false, error: 'Email and site name are required' });
        }
        
        // Verify payment if invoice ID provided
        if (invoiceId && WHMCS_API_URL) {
            const invoiceStatus = await checkWHMCSInvoice(invoiceId);
            if (!invoiceStatus.isPaid) {
                return res.status(402).json({ success: false, error: 'Payment not confirmed yet' });
            }
        }
        
        // Grant PUBLISH permission
        console.log(`Upgrading permissions for: ${email} -> ${siteName}`);
        const permissionsResult = await callDudaAPI('POST', `/accounts/${encodeURIComponent(email)}/sites/${siteName}/permissions`, {
            permissions: ['EDIT', 'PUBLISH', 'DEV_MODE', 'STATS_TAB', 'SEO', 'BLOG', 'CUSTOM_DOMAIN', 'BACKUPS']
        });
        
        if (!permissionsResult.success) {
            console.error('Permission upgrade failed:', permissionsResult.error);
            // Continue anyway - they paid, we should update our records
        }
        
        // Update trial record in database
        await saveTrialToDB({
            email: email.toLowerCase(),
            siteName,
            hasPaid: true,
            hasPublishAccess: true
        });
        
        res.json({
            success: true,
            message: 'Account upgraded! You can now publish your website.',
            hasPublishAccess: true
        });
        
    } catch (error) {
        console.error('Trial upgrade error:', error);
        res.status(500).json({ success: false, error: 'Failed to upgrade trial' });
    }
});

// ============================================
// CLIENT PORTAL - For existing DUDA clients
// ============================================

// Portal session tokens (in production, use Redis or database)
const portalSessions = new Map();

// Generate a secure token for magic link
function generatePortalToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Send magic link email via Postmark
async function sendMagicLinkEmail(toEmail, accessUrl, churchName) {
    if (!postmarkClient) {
        console.log('Postmark not configured, skipping email send');
        return false;
    }
    
    const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';
    
    const fullAccessUrl = `${baseUrl}${accessUrl}`;
    
    try {
        await postmarkClient.sendEmail({
            From: 'support@churchwebglobal.com',
            To: toEmail,
            Subject: 'Your Church Web Global Portal Access Link',
            HtmlBody: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6B46C1; margin-bottom: 10px;">Church Web Global</h1>
    </div>
    
    <div style="background: linear-gradient(135deg, #6B46C1 0%, #D946A6 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
        <h2 style="color: white; margin: 0 0 15px 0;">Access Your Website Portal</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 0;">Click the button below to securely access your church website dashboard.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${fullAccessUrl}" style="display: inline-block; background: #6B46C1; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Access My Portal</a>
    </div>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #666;"><strong>Security Notice:</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #666;">
            <li>This link expires in 30 minutes</li>
            <li>Can only be used once</li>
            <li>If you didn't request this, please ignore this email</li>
        </ul>
    </div>
    
    <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 4px; font-size: 12px;">${fullAccessUrl}</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <div style="text-align: center; color: #999; font-size: 12px;">
        <p>Church Web Global - Professional Websites for Churches</p>
        <p>Questions? Contact us at support@churchwebglobal.com</p>
    </div>
</body>
</html>
            `,
            TextBody: `
Church Web Global - Portal Access

Click the link below to access your church website portal:
${fullAccessUrl}

This link expires in 30 minutes and can only be used once.

If you didn't request this access link, please ignore this email.

Questions? Contact us at support@churchwebglobal.com
            `,
            MessageStream: 'outbound'
        });
        
        console.log(`Magic link email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('Failed to send magic link email:', error);
        return false;
    }
}

// Request magic link (sends email via Postmark)
app.post('/api/client/request-access', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        // Check if client exists
        const clientResult = await dbQuery('SELECT * FROM clients WHERE LOWER(email) = $1', [email.toLowerCase()]);
        
        if (clientResult.rows.length === 0) {
            // Don't reveal if email exists or not for security
            return res.json({ 
                success: true, 
                message: 'If this email is registered, you will receive an access link via email.' 
            });
        }
        
        const client = clientResult.rows[0];
        
        // Generate access token
        const token = generatePortalToken();
        const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
        
        portalSessions.set(token, {
            email: email.toLowerCase(),
            expiresAt,
            clientId: client.id
        });
        
        const accessUrl = `/portal?token=${token}`;
        
        console.log(`Portal access link generated for ${email}: ${accessUrl}`);
        
        // Send email via Postmark
        const emailSent = await sendMagicLinkEmail(email, accessUrl, client.church_name);
        
        // In development mode, also return the token for testing
        const isDev = process.env.NODE_ENV !== 'production';
        
        res.json({ 
            success: true, 
            message: emailSent 
                ? 'Access link sent to your email. Please check your inbox.' 
                : 'Access link generated. Check your email.',
            emailSent,
            // Only include in development mode for testing
            ...(isDev && { 
                devAccessUrl: accessUrl,
                devToken: token 
            })
        });
        
    } catch (error) {
        console.error('Request access error:', error);
        res.status(500).json({ success: false, error: 'Failed to process request' });
    }
});

// Verify portal token and create session
app.post('/api/client/verify-token', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ success: false, error: 'Token is required' });
        }
        
        const session = portalSessions.get(token);
        
        if (!session) {
            return res.status(401).json({ success: false, error: 'Invalid or expired access link' });
        }
        
        if (Date.now() > session.expiresAt) {
            portalSessions.delete(token);
            return res.status(401).json({ success: false, error: 'Access link has expired. Please request a new one.' });
        }
        
        // Generate a session token for subsequent requests
        const sessionToken = generatePortalToken();
        const sessionExpiry = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
        
        portalSessions.set(sessionToken, {
            email: session.email,
            clientId: session.clientId,
            expiresAt: sessionExpiry,
            isSession: true
        });
        
        // Delete the one-time access token
        portalSessions.delete(token);
        
        res.json({
            success: true,
            sessionToken,
            email: session.email
        });
        
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify token' });
    }
});

// Middleware to verify portal session
function requirePortalSession(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const session = portalSessions.get(token);
    
    if (!session || !session.isSession) {
        return res.status(401).json({ success: false, error: 'Invalid session' });
    }
    
    if (Date.now() > session.expiresAt) {
        portalSessions.delete(token);
        return res.status(401).json({ success: false, error: 'Session expired. Please login again.' });
    }
    
    req.portalUser = {
        email: session.email,
        clientId: session.clientId
    };
    
    next();
}

// Get client's sites (for portal) - now requires authentication
app.get('/api/client/sites/:email', requirePortalSession, async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        
        // Check if client exists in our database
        const clientResult = await dbQuery('SELECT * FROM clients WHERE LOWER(email) = $1', [email.toLowerCase()]);
        
        if (clientResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        
        const sites = await getClientSitesFromDB(email);
        
        res.json({
            success: true,
            client: clientResult.rows[0],
            sites: sites.map(s => ({
                siteName: s.site_name,
                churchName: s.church_name,
                previewUrl: s.preview_url,
                isPublished: s.is_published,
                hasPaid: s.has_paid,
                hasPublishAccess: s.has_publish_access,
                trialExpiry: s.trial_expiry,
                daysRemaining: s.trial_expiry ? getTrialDaysRemaining({ trial_expiry: s.trial_expiry }) : null
            }))
        });
        
    } catch (error) {
        console.error('Client sites error:', error);
        res.status(500).json({ success: false, error: 'Failed to get client sites' });
    }
});

// Client get sites - requires portal session
app.post('/api/client/get-sites', requirePortalSession, async (req, res) => {
    try {
        const email = req.portalUser.email;
        
        // Get client's sites
        const sites = await getClientSitesFromDB(email);
        
        res.json({
            success: true,
            email,
            sites: sites.map(s => ({
                siteName: s.site_name,
                churchName: s.church_name,
                previewUrl: s.preview_url,
                hasPaid: s.has_paid,
                hasPublishAccess: s.has_publish_access,
                trialExpiry: s.trial_expiry,
                daysRemaining: s.trial_expiry ? getTrialDaysRemaining({ trial_expiry: s.trial_expiry }) : null
            }))
        });
        
    } catch (error) {
        console.error('Get sites error:', error);
        res.status(500).json({ success: false, error: 'Failed to get sites' });
    }
});

// Client open editor - requires portal session
app.post('/api/client/open-editor', requirePortalSession, async (req, res) => {
    try {
        const email = req.portalUser.email;
        const { siteName } = req.body;
        
        if (!siteName) {
            return res.status(400).json({ success: false, error: 'Site name is required' });
        }
        
        // Verify this site belongs to this client
        const sites = await getClientSitesFromDB(email);
        const site = sites.find(s => s.site_name === siteName);
        
        if (!site) {
            return res.status(404).json({ success: false, error: 'Site not found or access denied' });
        }
        
        // Ensure DUDA account exists
        await callDudaAPI('POST', '/accounts/create', { account_name: email });
        
        // Grant permissions
        const hasPaid = site.has_paid || false;
        await callDudaAPI('POST', `/accounts/${encodeURIComponent(email)}/sites/${siteName}/permissions`, {
            permissions: hasPaid 
                ? ['EDIT', 'PUBLISH', 'DEV_MODE', 'STATS_TAB', 'SEO', 'BLOG', 'CUSTOM_DOMAIN', 'BACKUPS']
                : ['EDIT', 'DEV_MODE', 'STATS_TAB', 'SEO', 'BLOG']
        });
        
        // Generate SSO link
        const ssoResult = await callDudaAPI('GET', `/accounts/sso/${encodeURIComponent(email)}/link?site_name=${siteName}&target=EDITOR`);
        
        if (!ssoResult.success || !ssoResult.data?.url) {
            return res.status(500).json({ success: false, error: 'Failed to generate editor link' });
        }
        
        res.json({
            success: true,
            editorUrl: ssoResult.data.url,
            site: {
                siteName: site.site_name,
                churchName: site.church_name,
                hasPaid: site.has_paid,
                canPublish: site.has_publish_access
            }
        });
        
    } catch (error) {
        console.error('Open editor error:', error);
        res.status(500).json({ success: false, error: 'Failed to open editor' });
    }
});

// ============================================
// ADMIN: IMPORT EXISTING DUDA CLIENTS
// ============================================

// Import all existing sites from DUDA (and create clients from site owners)
app.post('/api/admin/import-duda-clients', requireAdmin, async (req, res) => {
    try {
        console.log('Starting DUDA site/client import with pagination...');
        
        // Fetch all sites from DUDA with pagination
        let allSites = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;
        
        while (hasMore) {
            console.log(`Fetching DUDA sites: offset=${offset}, limit=${limit}`);
            const sitesResult = await callDudaAPI('GET', `/sites/multiscreen?offset=${offset}&limit=${limit}`);
            
            if (!sitesResult.success) {
                console.error('DUDA API error details:', sitesResult.error);
                if (allSites.length === 0) {
                    return res.status(500).json({ 
                        success: false, 
                        error: `Failed to fetch DUDA sites: ${sitesResult.error || 'Unknown error'}` 
                    });
                }
                // If we have some sites, continue with what we have
                hasMore = false;
                continue;
            }
            
            // Handle different response formats
            let sites = [];
            if (Array.isArray(sitesResult.data)) {
                sites = sitesResult.data;
            } else if (sitesResult.data?.results) {
                sites = sitesResult.data.results;
            } else if (sitesResult.data?.sites) {
                sites = sitesResult.data.sites;
            } else if (typeof sitesResult.data === 'object') {
                sites = Object.values(sitesResult.data).filter(s => s && s.site_name);
            }
            
            console.log(`Fetched ${sites.length} sites in this batch`);
            allSites = allSites.concat(sites);
            
            // Check if we should fetch more
            if (sites.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
        }
        
        const sites = allSites;
        console.log(`DUDA sites fetch complete: Got ${sites.length} total sites`);
        
        if (sites.length === 0) {
            return res.json({ success: true, message: 'No DUDA sites found to import', imported: 0, skipped: 0 });
        }
        
        let sitesImported = 0;
        let sitesSkipped = 0;
        let clientsCreated = 0;
        let errors = [];
        
        for (const site of sites) {
            try {
                const siteName = site.site_name;
                if (!siteName) continue;
                
                // Check if site already exists
                const existingSite = await dbQuery('SELECT id FROM sites WHERE site_name = $1', [siteName]);
                
                if (existingSite.rows.length > 0) {
                    sitesSkipped++;
                    continue;
                }
                
                // Get detailed site info including owner and preview URL
                const siteDetails = await callDudaAPI('GET', `/sites/multiscreen/${siteName}`);
                const ownerEmail = siteDetails.data?.account_name || null;
                
                // Get site domain (the actual live website domain)
                const siteDomain = siteDetails.data?.site_domain || null;
                
                // Get church name - prioritize business_name, then use domain if available, then fall back to site_name
                let businessName = siteDetails.data?.site_business_info?.business_name;
                if (!businessName || businessName === siteName) {
                    // Use the domain name as the church name (more readable than site ID)
                    if (siteDomain) {
                        // Format domain nicely - remove www. and .com/.org/.ca etc for display
                        businessName = siteDomain;
                    } else {
                        businessName = siteName;
                    }
                }
                
                // Get preview URL - PRIORITIZE site_domain (live URL) over preview_site_url (dev URL)
                let previewUrl = null;
                if (siteDomain) {
                    previewUrl = `https://${siteDomain}`;
                } else if (siteDetails.data?.canonical_url) {
                    previewUrl = siteDetails.data.canonical_url;
                } else if (siteDetails.data?.preview_site_url) {
                    // Only use dev preview URL as last resort
                    previewUrl = siteDetails.data.preview_site_url;
                }
                
                let clientId = null;
                
                // If there's an owner email, create or find the client
                if (ownerEmail) {
                    const existingClient = await dbQuery('SELECT id FROM clients WHERE LOWER(email) = $1', [ownerEmail.toLowerCase()]);
                    
                    if (existingClient.rows.length > 0) {
                        clientId = existingClient.rows[0].id;
                    } else {
                        // Create new client
                        const newClient = await dbQuery(
                            `INSERT INTO clients (email, church_name, duda_account_created, is_legacy)
                             VALUES ($1, $2, true, true) RETURNING id`,
                            [ownerEmail.toLowerCase(), businessName]
                        );
                        clientId = newClient.rows[0]?.id;
                        clientsCreated++;
                    }
                }
                
                // Import the site with preview URL
                await dbQuery(
                    `INSERT INTO sites (site_name, client_id, church_name, preview_url, is_published)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [siteName, clientId, businessName, previewUrl, true]
                );
                
                sitesImported++;
            } catch (err) {
                console.error(`Error importing site ${site.site_name}:`, err.message);
                errors.push({ site: site.site_name, error: err.message });
            }
        }
        
        console.log(`DUDA import complete: ${sitesImported} sites imported, ${sitesSkipped} skipped, ${clientsCreated} clients created, ${errors.length} errors`);
        
        res.json({
            success: true,
            message: `Import complete: ${sitesImported} sites imported, ${clientsCreated} clients created, ${sitesSkipped} already existed`,
            sitesImported,
            clientsCreated,
            skipped: sitesSkipped,
            errors: errors.slice(0, 10)
        });
        
    } catch (error) {
        console.error('DUDA import error:', error);
        res.status(500).json({ success: false, error: 'Failed to import DUDA sites' });
    }
});

// Admin: Clear all sites and legacy clients
app.post('/api/admin/clear-sites', requireAdmin, async (req, res) => {
    try {
        console.log('Admin: Clearing all sites and legacy clients...');
        
        // Delete in correct order due to foreign keys
        const trialsResult = await dbQuery('DELETE FROM trials');
        const sitesResult = await dbQuery('DELETE FROM sites');
        const clientsResult = await dbQuery('DELETE FROM clients WHERE is_legacy = true');
        
        console.log(`Cleared: ${trialsResult.rowCount} trials, ${sitesResult.rowCount} sites, ${clientsResult.rowCount} legacy clients`);
        
        res.json({
            success: true,
            message: 'All sites and legacy clients cleared',
            trialsDeleted: trialsResult.rowCount,
            sitesDeleted: sitesResult.rowCount,
            clientsDeleted: clientsResult.rowCount
        });
        
    } catch (error) {
        console.error('Clear sites error:', error);
        res.status(500).json({ success: false, error: 'Failed to clear sites' });
    }
});

// Admin: Generate SSO editor link for any site
app.get('/api/admin/site-editor-link/:siteName', requireAdmin, async (req, res) => {
    try {
        const { siteName } = req.params;
        
        if (!siteName) {
            return res.status(400).json({ success: false, error: 'Site name is required' });
        }
        
        // Get site details to find the owner email
        const siteDetails = await callDudaAPI('GET', `/sites/multiscreen/${siteName}`);
        
        if (!siteDetails.success) {
            return res.status(404).json({ success: false, error: 'Site not found in DUDA' });
        }
        
        const ownerEmail = siteDetails.data?.account_name;
        
        if (!ownerEmail) {
            return res.status(400).json({ 
                success: false, 
                error: 'No account associated with this site. Cannot generate editor link.' 
            });
        }
        
        // Generate SSO link to the editor
        console.log(`Admin generating SSO link for: ${ownerEmail} -> ${siteName}`);
        const ssoResult = await callDudaAPI('GET', `/accounts/sso/${encodeURIComponent(ownerEmail)}/link?site_name=${siteName}&target=EDITOR`);
        
        if (!ssoResult.success || !ssoResult.data?.url) {
            console.error('SSO link generation failed:', ssoResult.error);
            return res.status(500).json({ success: false, error: 'Failed to generate editor link' });
        }
        
        res.json({
            success: true,
            editorUrl: ssoResult.data.url,
            siteName: siteName,
            accountEmail: ownerEmail
        });
        
    } catch (error) {
        console.error('Admin editor link error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate editor link' });
    }
});

// Get all clients (admin) with pagination and search
app.get('/api/admin/clients', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const filter = req.query.filter || 'all';
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        const params = [];
        let paramIndex = 1;
        
        if (search) {
            whereClause = `WHERE (LOWER(email) LIKE $${paramIndex} OR LOWER(church_name) LIKE $${paramIndex})`;
            params.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }
        
        if (filter === 'legacy') {
            whereClause += (whereClause ? ' AND' : 'WHERE') + ` is_legacy = true`;
        } else if (filter === 'new') {
            whereClause += (whereClause ? ' AND' : 'WHERE') + ` is_legacy = false`;
        }
        
        const countResult = await dbQuery(`SELECT COUNT(*) FROM clients ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count);
        
        params.push(limit, offset);
        const result = await dbQuery(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM sites WHERE client_id = c.id) as site_count
            FROM clients c
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, params);
        
        res.json({ success: true, clients: result.rows, total, page, limit });
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ success: false, error: 'Failed to get clients' });
    }
});

// Add new client (admin)
app.post('/api/admin/clients', requireAdmin, async (req, res) => {
    try {
        const { email, firstName, lastName, churchName, phone } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        const existing = await dbQuery('SELECT id FROM clients WHERE LOWER(email) = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Client already exists' });
        }
        
        await dbQuery(
            `INSERT INTO clients (email, first_name, last_name, church_name, phone)
             VALUES ($1, $2, $3, $4, $5)`,
            [email.toLowerCase(), firstName, lastName, churchName, phone]
        );
        
        res.json({ success: true, message: 'Client added' });
    } catch (error) {
        console.error('Add client error:', error);
        res.status(500).json({ success: false, error: 'Failed to add client' });
    }
});

// Get all sites (admin) with pagination
app.get('/api/admin/sites', requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const filter = req.query.filter || 'all';
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        const params = [];
        let paramIndex = 1;
        
        if (search) {
            whereClause = `WHERE (LOWER(s.site_name) LIKE $${paramIndex} OR LOWER(s.church_name) LIKE $${paramIndex})`;
            params.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }
        
        if (filter === 'published') {
            whereClause += (whereClause ? ' AND' : 'WHERE') + ` s.is_published = true`;
        } else if (filter === 'unpublished') {
            whereClause += (whereClause ? ' AND' : 'WHERE') + ` s.is_published = false`;
        }
        
        const countResult = await dbQuery(`SELECT COUNT(*) FROM sites s ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count);
        
        params.push(limit, offset);
        const result = await dbQuery(`
            SELECT s.*, c.email as client_email
            FROM sites s
            LEFT JOIN clients c ON s.client_id = c.id
            ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, params);
        
        res.json({ success: true, sites: result.rows, total, page, limit });
    } catch (error) {
        console.error('Get sites error:', error);
        res.status(500).json({ success: false, error: 'Failed to get sites' });
    }
});

// Get all trials (admin) with filter
app.get('/api/admin/trials', requireAdmin, async (req, res) => {
    try {
        const filter = req.query.filter || 'active';
        const now = new Date().toISOString();
        
        let whereClause = '';
        if (filter === 'active') {
            whereClause = `WHERE has_paid = false AND trial_expiry > '${now}'`;
        } else if (filter === 'expiring') {
            const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            whereClause = `WHERE has_paid = false AND trial_expiry > '${now}' AND trial_expiry <= '${threeDays}'`;
        } else if (filter === 'expired') {
            whereClause = `WHERE has_paid = false AND trial_expiry <= '${now}'`;
        } else if (filter === 'upgraded') {
            whereClause = `WHERE has_paid = true`;
        }
        
        const result = await dbQuery(`
            SELECT * FROM trials 
            ${whereClause}
            ORDER BY trial_expiry ASC
        `);
        
        res.json({ success: true, trials: result.rows });
    } catch (error) {
        console.error('Get trials error:', error);
        res.status(500).json({ success: false, error: 'Failed to get trials' });
    }
});

// Extend trial (admin)
app.post('/api/admin/extend-trial', requireAdmin, async (req, res) => {
    try {
        const { email, siteName, days } = req.body;
        
        if (!email || !siteName || !days) {
            return res.status(400).json({ success: false, error: 'Email, site name, and days are required' });
        }
        
        const result = await dbQuery(
            `UPDATE trials 
             SET trial_expiry = trial_expiry + INTERVAL '1 day' * $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE LOWER(email) = $2 AND site_name = $3
             RETURNING *`,
            [days, email.toLowerCase(), siteName]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Trial not found' });
        }
        
        res.json({ success: true, trial: result.rows[0] });
    } catch (error) {
        console.error('Extend trial error:', error);
        res.status(500).json({ success: false, error: 'Failed to extend trial' });
    }
});

// Upgrade trial to paid (admin)
app.post('/api/admin/upgrade-trial', requireAdmin, async (req, res) => {
    try {
        const { email, siteName } = req.body;
        
        if (!email || !siteName) {
            return res.status(400).json({ success: false, error: 'Email and site name are required' });
        }
        
        // Update trial record
        await dbQuery(
            `UPDATE trials 
             SET has_paid = true, has_publish_access = true, upgraded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE LOWER(email) = $1 AND site_name = $2`,
            [email.toLowerCase(), siteName]
        );
        
        // Grant PUBLISH permission in DUDA
        await callDudaAPI('POST', `/accounts/${encodeURIComponent(email)}/sites/${siteName}/permissions`, {
            permissions: ['EDIT', 'PUBLISH', 'DEV_MODE', 'STATS_TAB', 'SEO', 'BLOG', 'CUSTOM_DOMAIN', 'BACKUPS']
        });
        
        res.json({ success: true, message: 'Trial upgraded to paid' });
    } catch (error) {
        console.error('Upgrade trial error:', error);
        res.status(500).json({ success: false, error: 'Failed to upgrade trial' });
    }
});

// Get dashboard stats (admin)
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const now = new Date().toISOString();
        
        const [clientsRes, sitesRes, trialsRes, paidRes, legacyRes, recentRes] = await Promise.all([
            dbQuery('SELECT COUNT(*) FROM clients'),
            dbQuery('SELECT COUNT(*) FROM sites'),
            dbQuery(`SELECT COUNT(*) FROM trials WHERE has_paid = false AND trial_expiry > '${now}'`),
            dbQuery('SELECT COUNT(*) FROM trials WHERE has_paid = true'),
            dbQuery('SELECT COUNT(*) FROM clients WHERE is_legacy = true'),
            dbQuery('SELECT * FROM clients ORDER BY created_at DESC LIMIT 5')
        ]);
        
        res.json({
            success: true,
            totalClients: parseInt(clientsRes.rows[0].count),
            totalSites: parseInt(sitesRes.rows[0].count),
            activeTrials: parseInt(trialsRes.rows[0].count),
            paidAccounts: parseInt(paidRes.rows[0].count),
            legacyClients: parseInt(legacyRes.rows[0].count),
            recentClients: recentRes.rows
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
});

// API status check (admin)
app.get('/api/admin/api-status', requireAdmin, async (req, res) => {
    try {
        const duda = !!DUDA_API_USER && !!DUDA_API_PASSWORD;
        const whmcs = !!WHMCS_API_URL;
        const postmark = !!process.env.POSTMARK_API_TOKEN;
        const database = !!process.env.DATABASE_URL;
        const cloudflare = !!CLOUDFLARE_API_TOKEN;
        const smartermail = !!SMARTERMAIL_URL && !!SMARTERMAIL_ADMIN_USER && !!SMARTERMAIL_ADMIN_PASSWORD;
        
        res.json({ success: true, duda, whmcs, postmark, database, cloudflare, smartermail });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to check status' });
    }
});

// Send test email (admin)
app.post('/api/admin/send-test-email', requireAdmin, async (req, res) => {
    try {
        const { from, to, subject, body } = req.body;
        
        if (!postmarkClient) {
            return res.status(400).json({ success: false, error: 'Postmark not configured' });
        }
        
        await postmarkClient.sendEmail({
            From: from || 'support@churchwebglobal.com',
            To: to,
            Subject: subject || 'Test Email from Church Web Global',
            TextBody: body || 'This is a test email from Church Web Global admin panel.',
            HtmlBody: `<p>${body || 'This is a test email from Church Web Global admin panel.'}</p>`,
            MessageStream: 'outbound'
        });
        
        res.json({ success: true, message: 'Email sent' });
    } catch (error) {
        console.error('Send test email error:', error);
        res.status(500).json({ success: false, error: 'Failed to send email: ' + error.message });
    }
});

// Send portal access link (admin)
app.post('/api/admin/send-access-link', requireAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        const clientResult = await dbQuery('SELECT * FROM clients WHERE LOWER(email) = $1', [email.toLowerCase()]);
        
        if (clientResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        
        const client = clientResult.rows[0];
        const token = generatePortalToken();
        const expiresAt = Date.now() + (30 * 60 * 1000);
        
        portalSessions.set(token, {
            email: email.toLowerCase(),
            expiresAt,
            clientId: client.id
        });
        
        const accessUrl = `/portal?token=${token}`;
        const emailSent = await sendMagicLinkEmail(email, accessUrl, client.church_name);
        
        res.json({ success: true, emailSent, accessUrl });
    } catch (error) {
        console.error('Send access link error:', error);
        res.status(500).json({ success: false, error: 'Failed to send access link' });
    }
});

// Helper function to check WHMCS invoice status
async function checkWHMCSInvoice(invoiceId) {
    if (!WHMCS_API_URL) {
        return { isPaid: false, error: 'WHMCS not configured' };
    }
    
    try {
        const params = new URLSearchParams({
            action: 'GetInvoice',
            invoiceid: invoiceId,
            identifier: WHMCS_API_IDENTIFIER,
            secret: WHMCS_API_SECRET,
            responsetype: 'json'
        });
        
        const response = await axios.post(WHMCS_API_URL, params);
        const status = response.data?.status?.toLowerCase();
        
        return {
            isPaid: status === 'paid',
            status: status
        };
    } catch (error) {
        console.error('WHMCS invoice check error:', error);
        return { isPaid: false, error: error.message };
    }
}

// ============================================
// CLOUDFLARE DNS MANAGEMENT ENDPOINTS
// ============================================

// Get all Cloudflare zones (domains) with pagination
app.get('/api/admin/cloudflare/zones', requireAdmin, async (req, res) => {
    try {
        if (!CLOUDFLARE_API_TOKEN) {
            return res.status(400).json({ success: false, error: 'Cloudflare API not configured. Add CLOUDFLARE_API_TOKEN to secrets.' });
        }
        
        const allZones = [];
        let page = 1;
        const perPage = 50;
        let totalPages = 1;
        
        // Fetch all pages of zones
        while (page <= totalPages) {
            const result = await callCloudflareAPI('GET', `/zones?page=${page}&per_page=${perPage}&order=name&direction=asc`);
            
            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error });
            }
            
            allZones.push(...result.data);
            
            if (result.result_info) {
                totalPages = result.result_info.total_pages;
            }
            page++;
        }
        
        // Return simplified zone data
        const zones = allZones.map(zone => ({
            id: zone.id,
            name: zone.name,
            status: zone.status,
            paused: zone.paused,
            type: zone.type,
            name_servers: zone.name_servers,
            created_on: zone.created_on
        }));
        
        res.json({ success: true, zones, total: zones.length });
    } catch (error) {
        console.error('Get Cloudflare zones error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch zones' });
    }
});

// Get DNS records for a specific zone
app.get('/api/admin/cloudflare/zones/:zoneId/dns', requireAdmin, async (req, res) => {
    try {
        const { zoneId } = req.params;
        const { type, name } = req.query;
        
        let endpoint = `/zones/${zoneId}/dns_records?per_page=100`;
        if (type) endpoint += `&type=${type}`;
        if (name) endpoint += `&name=${encodeURIComponent(name)}`;
        
        const allRecords = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
            const result = await callCloudflareAPI('GET', `${endpoint}&page=${page}`);
            
            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error });
            }
            
            allRecords.push(...result.data);
            
            if (result.result_info && result.result_info.page < result.result_info.total_pages) {
                page++;
            } else {
                hasMore = false;
            }
        }
        
        // Return simplified record data
        const records = allRecords.map(record => ({
            id: record.id,
            type: record.type,
            name: record.name,
            content: record.content,
            proxied: record.proxied,
            ttl: record.ttl,
            priority: record.priority,
            created_on: record.created_on,
            modified_on: record.modified_on
        }));
        
        res.json({ success: true, records });
    } catch (error) {
        console.error('Get DNS records error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch DNS records' });
    }
});

// Create a new DNS record
app.post('/api/admin/cloudflare/zones/:zoneId/dns', requireAdmin, async (req, res) => {
    try {
        const { zoneId } = req.params;
        const { type, name, content, ttl, proxied, priority } = req.body;
        
        if (!type || !name || !content) {
            return res.status(400).json({ success: false, error: 'Type, name, and content are required' });
        }
        
        const recordData = {
            type: type.toUpperCase(),
            name,
            content,
            ttl: ttl || 1, // 1 = auto
            proxied: proxied !== undefined ? proxied : (type.toUpperCase() === 'A' || type.toUpperCase() === 'CNAME')
        };
        
        if (type.toUpperCase() === 'MX' && priority !== undefined) {
            recordData.priority = priority;
        }
        
        const result = await callCloudflareAPI('POST', `/zones/${zoneId}/dns_records`, recordData);
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        res.json({ success: true, record: result.data });
    } catch (error) {
        console.error('Create DNS record error:', error);
        res.status(500).json({ success: false, error: 'Failed to create DNS record' });
    }
});

// Update a DNS record
app.put('/api/admin/cloudflare/zones/:zoneId/dns/:recordId', requireAdmin, async (req, res) => {
    try {
        const { zoneId, recordId } = req.params;
        const { type, name, content, ttl, proxied, priority } = req.body;
        
        if (!type || !name || !content) {
            return res.status(400).json({ success: false, error: 'Type, name, and content are required' });
        }
        
        const recordData = {
            type: type.toUpperCase(),
            name,
            content,
            ttl: ttl || 1,
            proxied: proxied !== undefined ? proxied : false
        };
        
        if (type.toUpperCase() === 'MX' && priority !== undefined) {
            recordData.priority = priority;
        }
        
        const result = await callCloudflareAPI('PUT', `/zones/${zoneId}/dns_records/${recordId}`, recordData);
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        res.json({ success: true, record: result.data });
    } catch (error) {
        console.error('Update DNS record error:', error);
        res.status(500).json({ success: false, error: 'Failed to update DNS record' });
    }
});

// Delete a DNS record
app.delete('/api/admin/cloudflare/zones/:zoneId/dns/:recordId', requireAdmin, async (req, res) => {
    try {
        const { zoneId, recordId } = req.params;
        
        const result = await callCloudflareAPI('DELETE', `/zones/${zoneId}/dns_records/${recordId}`);
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        res.json({ success: true, message: 'DNS record deleted' });
    } catch (error) {
        console.error('Delete DNS record error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete DNS record' });
    }
});

// Quick action: Point domain to DUDA (creates/updates A and CNAME records)
app.post('/api/admin/cloudflare/zones/:zoneId/quick-setup/duda', requireAdmin, async (req, res) => {
    try {
        const { zoneId } = req.params;
        const { dudaIp, dudaCname } = req.body;
        
        // Default DUDA configuration
        const targetIp = dudaIp || '34.102.136.180'; // DUDA's default IP
        const targetCname = dudaCname || 'cname.dudaone.com';
        
        // First get zone details to know the domain name
        const zoneResult = await callCloudflareAPI('GET', `/zones/${zoneId}`);
        if (!zoneResult.success) {
            return res.status(500).json({ success: false, error: 'Failed to get zone details' });
        }
        
        const domainName = zoneResult.data.name;
        const results = [];
        
        // Check for existing root A record
        const existingA = await callCloudflareAPI('GET', `/zones/${zoneId}/dns_records?type=A&name=${domainName}`);
        
        if (existingA.success && existingA.data.length > 0) {
            // Update existing A record
            const updateResult = await callCloudflareAPI('PUT', `/zones/${zoneId}/dns_records/${existingA.data[0].id}`, {
                type: 'A',
                name: '@',
                content: targetIp,
                ttl: 1,
                proxied: true
            });
            results.push({ type: 'A', action: 'updated', success: updateResult.success });
        } else {
            // Create new A record
            const createResult = await callCloudflareAPI('POST', `/zones/${zoneId}/dns_records`, {
                type: 'A',
                name: '@',
                content: targetIp,
                ttl: 1,
                proxied: true
            });
            results.push({ type: 'A', action: 'created', success: createResult.success });
        }
        
        // Check for existing www CNAME
        const existingCname = await callCloudflareAPI('GET', `/zones/${zoneId}/dns_records?type=CNAME&name=www.${domainName}`);
        
        if (existingCname.success && existingCname.data.length > 0) {
            // Update existing CNAME record
            const updateResult = await callCloudflareAPI('PUT', `/zones/${zoneId}/dns_records/${existingCname.data[0].id}`, {
                type: 'CNAME',
                name: 'www',
                content: targetCname,
                ttl: 1,
                proxied: true
            });
            results.push({ type: 'CNAME (www)', action: 'updated', success: updateResult.success });
        } else {
            // Create new CNAME record
            const createResult = await callCloudflareAPI('POST', `/zones/${zoneId}/dns_records`, {
                type: 'CNAME',
                name: 'www',
                content: targetCname,
                ttl: 1,
                proxied: true
            });
            results.push({ type: 'CNAME (www)', action: 'created', success: createResult.success });
        }
        
        res.json({ 
            success: true, 
            message: `Domain ${domainName} configured for DUDA`, 
            results 
        });
    } catch (error) {
        console.error('DUDA quick setup error:', error);
        res.status(500).json({ success: false, error: 'Failed to configure domain for DUDA' });
    }
});

// ============================================
// SMARTERMAIL API ENDPOINTS
// ============================================

// Get all SmarterMail domains
app.get('/api/admin/smartermail/domains', requireAdmin, async (req, res) => {
    try {
        if (!SMARTERMAIL_URL || !SMARTERMAIL_ADMIN_USER || !SMARTERMAIL_ADMIN_PASSWORD) {
            return res.status(400).json({ success: false, error: 'SmarterMail not configured. Add SMARTERMAIL_URL, SMARTERMAIL_ADMIN_USER, and SMARTERMAIL_ADMIN_PASSWORD to secrets.' });
        }
        
        // Correct endpoint: POST /settings/sysadmin/domain-list-search
        const result = await callSmarterMailAPI('POST', '/settings/sysadmin/domain-list-search', {
            skip: 0,
            take: 500,
            search: null,
            sortField: 'domainName',
            sortDescending: false
        });
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        // Transform and normalize domain list for UI (sanitize raw SmarterMail data)
        // The response structure is { results: [...] } or { domains: [...] }
        const rawDomains = result.data.results || result.data.domains || result.data.domainList || [];
        const domains = rawDomains.map(d => ({
            name: typeof d === 'string' ? d : (d.name || d.domainName || 'Unknown'),
            userCount: d.userCount || null,
            path: d.path || null
        }));
        res.json({ success: true, domains });
    } catch (error) {
        console.error('Get SmarterMail domains error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch domains' });
    }
});

// Get single domain details
app.get('/api/admin/smartermail/domains/:domain', requireAdmin, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await callSmarterMailAPI('GET', `/settings/domain/${domain}`);
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        // Sanitize domain response - only return needed fields
        const rawDomain = result.data || {};
        const domainInfo = {
            name: rawDomain.domainName || domain,
            userCount: rawDomain.userCount || null,
            maxUsers: rawDomain.maxUsers || null,
            maxDiskSpace: rawDomain.maxDiskSpace || null,
            isEnabled: rawDomain.isEnabled !== false
        };
        
        res.json({ success: true, domain: domainInfo });
    } catch (error) {
        console.error('Get SmarterMail domain error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch domain details' });
    }
});

// Get users for a domain
app.get('/api/admin/smartermail/domains/:domain/users', requireAdmin, async (req, res) => {
    try {
        const { domain } = req.params;
        
        // Use AccountSearchQuick to get all users for a domain
        // API endpoint: POST /settings/domain/account-search-quick
        const result = await callSmarterMailAPI('POST', '/settings/domain/account-search-quick', {
            search: '',
            domainName: domain,
            sortField: 'userName',
            sortDescending: false,
            skip: 0,
            take: 1000
        });
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        // Normalize and sanitize user data for UI
        // Response may be { results: [...] } or { accounts: [...] } or { users: [...] }
        const rawUsers = result.data.results || result.data.accounts || result.data.users || [];
        const users = rawUsers.map(u => ({
            emailAddress: u.emailAddress || u.userName || u.email || 'Unknown',
            displayName: u.displayName || u.fullName || u.name || null,
            mailboxSizeUsed: u.mailboxSizeUsed || u.size || 0,
            mailboxSizeLimit: u.mailboxSizeLimit || u.maxSize || 0,
            isEnabled: u.isEnabled !== false
        }));
        const totalUsers = result.data.total || result.data.totalResults || users.length;
        
        res.json({ success: true, users, total: totalUsers });
    } catch (error) {
        console.error('Get SmarterMail users error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
});

// Create a new user
app.post('/api/admin/smartermail/domains/:domain/users', requireAdmin, async (req, res) => {
    try {
        const { domain } = req.params;
        const { username, password, fullName, mailboxSizeMB } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password are required' });
        }
        
        // Use AddUser endpoint: POST /settings/domain/add-user
        const result = await callSmarterMailAPI('POST', '/settings/domain/add-user', {
            userName: username,
            password: password,
            displayName: fullName || username,
            maxSize: mailboxSizeMB ? mailboxSizeMB * 1024 * 1024 : 500 * 1024 * 1024 // Default 500MB in bytes
        });
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        res.json({ success: true, message: `User ${username}@${domain} created successfully` });
    } catch (error) {
        console.error('Create SmarterMail user error:', error);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
});

// Delete a user
app.delete('/api/admin/smartermail/domains/:domain/users/:username', requireAdmin, async (req, res) => {
    try {
        const { domain, username } = req.params;
        
        // Use DeleteUser endpoint: POST /settings/domain/delete-user
        const result = await callSmarterMailAPI('POST', '/settings/domain/delete-user', {
            email: `${username}@${domain}`
        });
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        res.json({ success: true, message: `User ${username}@${domain} deleted successfully` });
    } catch (error) {
        console.error('Delete SmarterMail user error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

// Update user (change password, mailbox size, etc.)
app.put('/api/admin/smartermail/domains/:domain/users/:username', requireAdmin, async (req, res) => {
    try {
        const { domain, username } = req.params;
        const { password, fullName, mailboxSizeMB, isEnabled } = req.body;
        
        const userData = {
            userName: username,
            domainName: domain
        };
        
        if (password) userData.password = password;
        if (fullName) userData.fullName = fullName;
        if (mailboxSizeMB !== undefined) {
            userData.userMailSettings = {
                maxSize: mailboxSizeMB * 1024 * 1024
            };
        }
        if (isEnabled !== undefined) {
            userData.isEnabled = isEnabled;
        }
        
        const result = await callSmarterMailAPI('POST', '/settings/domain/user-put', {
            userData: userData
        });
        
        if (!result.success) {
            return res.status(500).json({ success: false, error: result.error });
        }
        
        res.json({ success: true, message: `User ${username}@${domain} updated successfully` });
    } catch (error) {
        console.error('Update SmarterMail user error:', error);
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
});

// Get domain statistics/summary
app.get('/api/admin/smartermail/stats', requireAdmin, async (req, res) => {
    try {
        if (!SMARTERMAIL_URL || !SMARTERMAIL_ADMIN_USER || !SMARTERMAIL_ADMIN_PASSWORD) {
            return res.status(400).json({ success: false, error: 'SmarterMail not configured' });
        }
        
        // Get domain list to count
        // Correct endpoint: POST /settings/sysadmin/domain-list-search
        const domainsResult = await callSmarterMailAPI('POST', '/settings/sysadmin/domain-list-search', {
            skip: 0,
            take: 500,
            search: null,
            sortField: 'domainName',
            sortDescending: false
        });
        
        if (!domainsResult.success) {
            return res.status(500).json({ success: false, error: domainsResult.error });
        }
        
        const domains = domainsResult.data.domainList || [];
        
        res.json({ 
            success: true, 
            stats: {
                totalDomains: domains.length,
                domains: domains.map(d => ({
                    name: d.name || d.domainName || d,
                    path: d.path,
                    userCount: d.userCount
                }))
            }
        });
    } catch (error) {
        console.error('Get SmarterMail stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// ============================================
// DUDA MCP TEMPLATE CREATION ENDPOINTS
// ============================================

// Church template design configurations
const CHURCH_TEMPLATE_DESIGNS = {
    'modern-minimalist': {
        name: 'Modern Minimalist',
        description: 'Clean whites, lots of whitespace, contemporary feel',
        style: 'contemporary',
        colors: {
            primary: '#2C3E50',
            secondary: '#3498DB',
            accent: '#E74C3C',
            background: '#FFFFFF',
            text: '#333333'
        },
        fonts: {
            heading: 'Montserrat',
            body: 'Open Sans'
        }
    },
    'traditional-classic': {
        name: 'Traditional Classic',
        description: 'Rich colors, ornate details, established denominations',
        style: 'traditional',
        colors: {
            primary: '#1A237E',
            secondary: '#B71C1C',
            accent: '#FFC107',
            background: '#F5F5F5',
            text: '#212121'
        },
        fonts: {
            heading: 'Playfair Display',
            body: 'Lora'
        }
    },
    'warm-community': {
        name: 'Warm Community',
        description: 'Earth tones, welcoming feel, family-focused',
        style: 'warm',
        colors: {
            primary: '#5D4037',
            secondary: '#FF8F00',
            accent: '#4CAF50',
            background: '#FFF8E1',
            text: '#3E2723'
        },
        fonts: {
            heading: 'Merriweather',
            body: 'Source Sans Pro'
        }
    },
    'bold-dynamic': {
        name: 'Bold & Dynamic',
        description: 'Dark backgrounds, vibrant accents, youth-oriented',
        style: 'bold',
        colors: {
            primary: '#1A1A2E',
            secondary: '#E94560',
            accent: '#0F3460',
            background: '#16213E',
            text: '#EAEAEA'
        },
        fonts: {
            heading: 'Poppins',
            body: 'Roboto'
        }
    },
    'pastoral-calm': {
        name: 'Pastoral Calm',
        description: 'Soft blues/greens, nature imagery, peaceful',
        style: 'pastoral',
        colors: {
            primary: '#2E7D32',
            secondary: '#1976D2',
            accent: '#7B1FA2',
            background: '#E8F5E9',
            text: '#1B5E20'
        },
        fonts: {
            heading: 'Crimson Text',
            body: 'Nunito'
        }
    },
    'urban-contemporary': {
        name: 'Urban Contemporary',
        description: 'Industrial touches, bold typography, city churches',
        style: 'urban',
        colors: {
            primary: '#263238',
            secondary: '#FF5722',
            accent: '#00BCD4',
            background: '#ECEFF1',
            text: '#37474F'
        },
        fonts: {
            heading: 'Oswald',
            body: 'Lato'
        }
    }
};

// ChurchData collection schema
const CHURCH_DATA_COLLECTION_SCHEMA = {
    name: 'ChurchData',
    fields: [
        { name: 'Welcome_Message', type: 'text' },
        { name: 'tagline', type: 'text' },
        { name: 'About_short_blurb', type: 'text' },
        { name: 'About_Story', type: 'text' },
        { name: 'Service_Times', type: 'text' },
        { name: 'Pastor_Name', type: 'text' },
        { name: 'Pastor_Title', type: 'text' },
        { name: 'Denomination', type: 'text' },
        { name: 'Contact_Email', type: 'text' },
        { name: 'Contact_Phone', type: 'text' },
        { name: 'Contact_Address', type: 'text' },
        { name: 'Social_Facebook', type: 'text' },
        { name: 'Social_Instagram', type: 'text' },
        { name: 'Social_YouTube', type: 'text' }
    ]
};

// List available template designs
app.get('/api/admin/mcp/template-designs', requireAdmin, (req, res) => {
    res.json({ 
        success: true, 
        designs: Object.entries(CHURCH_TEMPLATE_DESIGNS).map(([id, design]) => ({
            id,
            ...design
        }))
    });
});

// Get collection schema
app.get('/api/admin/mcp/collection-schema', requireAdmin, (req, res) => {
    res.json({ 
        success: true, 
        schema: CHURCH_DATA_COLLECTION_SCHEMA 
    });
});

// List all DUDA templates available in the account
app.get('/api/admin/mcp/duda-templates', requireAdmin, async (req, res) => {
    console.log('[MCP] Templates endpoint called');
    try {
        if (!dudaClient) {
            console.log('[MCP] DUDA Partner API not configured');
            return res.status(400).json({ success: false, error: 'DUDA Partner API not configured' });
        }
        
        // Try to get templates from DUDA API with timeout
        try {
            console.log('[MCP] Trying templates API...');
            const result = await Promise.race([
                callDudaAPI('GET', '/sites/multiscreen/templates'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 10s')), 10000))
            ]);
            
            console.log('[MCP] Templates API result:', result.success, result.data ? 'has data' : 'no data');
            
            if (result.success && result.data) {
                const templates = result.data.results || (Array.isArray(result.data) ? result.data : []);
                console.log('[MCP] Templates from API:', templates.length);
                if (templates.length > 0) {
                    return res.json({ success: true, templates });
                }
            }
        } catch (apiError) {
            console.log('[MCP] Templates API unavailable:', apiError.message);
        }
        
        // Fallback: Get unique template IDs from existing sites
        console.log('[MCP] Falling back to extracting templates from sites...');
        const sitesResult = await callDudaAPI('GET', '/sites/multiscreen?limit=100');
        console.log('[MCP] Sites fallback result:', sitesResult.success, sitesResult.data ? 'has data' : 'no data');
        
        if (sitesResult.success && sitesResult.data) {
            const sites = sitesResult.data.results || (Array.isArray(sitesResult.data) ? sitesResult.data : []);
            console.log('[MCP] Sites count for fallback:', sites.length);
            
            // Extract unique template_ids from sites
            const templateIds = [...new Set(sites.map(s => s.template_id).filter(Boolean))];
            const templates = templateIds.map(id => ({
                template_id: id,
                template_name: `Template ${id}`,
                base_site_name: String(id)
            }));
            
            console.log(`[MCP] Found ${templates.length} unique templates from sites`);
            return res.json({ success: true, templates, source: 'sites' });
        }
        
        console.log('[MCP] All fallbacks failed');
        res.status(500).json({ success: false, error: 'Could not load templates' });
    } catch (error) {
        console.error('[MCP] Error listing DUDA templates:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to list templates' });
    }
});

// List all sites in the account with full pagination
app.get('/api/admin/mcp/sites', requireAdmin, async (req, res) => {
    try {
        if (!dudaClient) {
            return res.status(400).json({ success: false, error: 'DUDA Partner API not configured' });
        }
        
        // Fetch all sites with pagination
        const allSites = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        
        console.log('Starting to fetch all DUDA sites with pagination...');
        
        while (hasMore) {
            const result = await callDudaAPI('GET', `/sites/multiscreen?offset=${offset}&limit=${limit}`);
            console.log(`Fetched offset ${offset}, result success: ${result.success}`);
            
            if (result.success && result.data) {
                // Response format can be { results: [...] } or direct array
                const sites = result.data.results || (Array.isArray(result.data) ? result.data : []);
                
                if (sites.length > 0) {
                    allSites.push(...sites);
                    console.log(`Added ${sites.length} sites, total now: ${allSites.length}`);
                    offset += limit;
                    
                    // If we got fewer than the limit, we've reached the end
                    if (sites.length < limit) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            } else {
                console.log('API call failed or no data, stopping pagination');
                hasMore = false;
            }
            
            // Safety limit to prevent infinite loops
            if (offset > 2000) {
                console.log('Safety limit reached at offset:', offset);
                hasMore = false;
            }
        }
        
        console.log(`Fetched ${allSites.length} total sites`);
        res.json({ success: true, sites: allSites });
    } catch (error) {
        console.error('Error listing sites:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to list sites' });
    }
});

// Get site details
app.get('/api/admin/mcp/sites/:siteName', requireAdmin, async (req, res) => {
    try {
        if (!dudaClient) {
            return res.status(400).json({ success: false, error: 'DUDA Partner API not configured' });
        }
        
        const { siteName } = req.params;
        const site = await dudaClient.sites.get({ site_name: siteName });
        res.json({ success: true, site });
    } catch (error) {
        console.error('Error getting site:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to get site' });
    }
});

// Create a new site from template
app.post('/api/admin/mcp/sites/create', requireAdmin, async (req, res) => {
    try {
        if (!dudaClient) {
            return res.status(400).json({ success: false, error: 'DUDA Partner API not configured' });
        }
        
        const { templateId, siteName, designId, churchInfo } = req.body;
        
        // Input validation
        if (!templateId || typeof templateId !== 'string') {
            return res.status(400).json({ success: false, error: 'Valid template ID is required' });
        }
        
        // Sanitize templateId - only allow alphanumeric, hyphens, underscores
        const sanitizedTemplateId = templateId.replace(/[^a-zA-Z0-9_-]/g, '');
        if (sanitizedTemplateId !== templateId) {
            return res.status(400).json({ success: false, error: 'Template ID contains invalid characters' });
        }
        
        // Validate designId if provided
        if (designId && !CHURCH_TEMPLATE_DESIGNS[designId]) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid design ID',
                validDesigns: Object.keys(CHURCH_TEMPLATE_DESIGNS)
            });
        }
        
        // Create site from template
        const createOptions = {
            template_id: sanitizedTemplateId
        };
        
        // Sanitize siteName - only allow alphanumeric and hyphens
        if (siteName) {
            const sanitizedSiteName = String(siteName).replace(/[^a-zA-Z0-9-]/g, '').substring(0, 50);
            if (sanitizedSiteName) {
                createOptions.default_domain_prefix = sanitizedSiteName;
            }
        }
        
        const site = await dudaClient.sites.create(createOptions);
        console.log('Site created:', site.site_name);
        
        // Apply design theme if specified
        if (designId && CHURCH_TEMPLATE_DESIGNS[designId]) {
            const design = CHURCH_TEMPLATE_DESIGNS[designId];
            try {
                await dudaClient.sites.theme.update({
                    site_name: site.site_name,
                    colors: design.colors
                });
                console.log('Theme applied:', designId);
            } catch (themeError) {
                console.error('Error applying theme:', themeError.message);
            }
        }
        
        // Update content library with church info if provided
        if (churchInfo) {
            try {
                await dudaClient.content.update({
                    site_name: site.site_name,
                    site_business_info: {
                        business_name: churchInfo.name,
                        phone_number: churchInfo.phone,
                        email: churchInfo.email,
                        address: churchInfo.address ? {
                            streetAddress: churchInfo.address
                        } : undefined
                    }
                });
                console.log('Content library updated');
            } catch (contentError) {
                console.error('Error updating content:', contentError.message);
            }
        }
        
        res.json({ 
            success: true, 
            site: site,
            message: `Site ${site.site_name} created successfully`
        });
    } catch (error) {
        console.error('Error creating site:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create site' });
    }
});

// Create ChurchData collection on a site
app.post('/api/admin/mcp/sites/:siteName/create-collection', requireAdmin, async (req, res) => {
    try {
        if (!dudaClient) {
            return res.status(400).json({ success: false, error: 'DUDA Partner API not configured' });
        }
        
        const { siteName } = req.params;
        
        // Create the ChurchData collection using the API
        const collectionPayload = {
            name: CHURCH_DATA_COLLECTION_SCHEMA.name,
            fields: CHURCH_DATA_COLLECTION_SCHEMA.fields.map(f => ({
                name: f.name,
                type: f.type === 'text' ? 'plain_text' : f.type
            }))
        };
        
        const result = await callDudaAPI('POST', `/sites/multiscreen/${siteName}/collection`, collectionPayload);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: `ChurchData collection created on ${siteName}`,
                collection: result.data
            });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create collection' });
    }
});

// Generate a complete church template site with AI description
app.post('/api/admin/mcp/generate-template', requireAdmin, async (req, res) => {
    try {
        if (!dudaClient) {
            return res.status(400).json({ success: false, error: 'DUDA Partner API not configured' });
        }
        
        const { designId, templateName, description } = req.body;
        
        if (!designId || !CHURCH_TEMPLATE_DESIGNS[designId]) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid design ID is required',
                availableDesigns: Object.keys(CHURCH_TEMPLATE_DESIGNS)
            });
        }
        
        const design = CHURCH_TEMPLATE_DESIGNS[designId];
        
        // Use DUDA's site generation API if available
        // This creates a complete site from a description
        const generateDescription = description || `
            Create a professional church website with the following style: ${design.description}.
            
            Required pages:
            - Home: Hero section with welcome message, service times, quick links to key pages
            - About: Church story, pastor bio section, mission statement
            - Services: Service schedule, what to expect, livestream section
            - Contact: Contact form, address with map, phone and email
            
            Design requirements:
            - Mobile responsive
            - Hero section with gradient overlay
            - Clear CTA buttons for "Plan Your Visit" and "Watch Online"
            - Footer with contact info and social links
            - Sticky header navigation
            
            Style: ${design.style}
            Primary color: ${design.colors.primary}
            Font style: ${design.fonts.heading} for headings, ${design.fonts.body} for body
        `;
        
        // Try to generate site using DUDA's generate endpoint
        try {
            const generateResult = await callDudaAPI('POST', '/sites/multiscreen/generate', {
                prompt: generateDescription,
                lang: 'en'
            });
            
            if (generateResult.success && generateResult.data.site_name) {
                const siteName = generateResult.data.site_name;
                
                // Apply theme colors
                try {
                    await dudaClient.sites.theme.update({
                        site_name: siteName,
                        colors: design.colors
                    });
                } catch (themeError) {
                    console.log('Theme update note:', themeError.message);
                }
                
                // Create ChurchData collection
                try {
                    await callDudaAPI('POST', `/sites/multiscreen/${siteName}/collection`, {
                        name: CHURCH_DATA_COLLECTION_SCHEMA.name,
                        fields: CHURCH_DATA_COLLECTION_SCHEMA.fields.map(f => ({
                            name: f.name,
                            type: f.type === 'text' ? 'plain_text' : f.type
                        }))
                    });
                } catch (collectionError) {
                    console.log('Collection creation note:', collectionError.message);
                }
                
                // Save to local templates config
                const templatesConfig = loadConfig(TEMPLATES_CONFIG, { templates: [], lastUpdated: null });
                const newTemplate = {
                    id: `mcp-${designId}-${Date.now()}`,
                    template_id: siteName,
                    base_site_name: siteName,
                    name: templateName || design.name,
                    description: design.description,
                    thumbnail: null,
                    designId: designId,
                    createdAt: new Date().toISOString(),
                    createdBy: 'MCP'
                };
                templatesConfig.templates.push(newTemplate);
                templatesConfig.lastUpdated = new Date().toISOString();
                saveConfig(TEMPLATES_CONFIG, templatesConfig);
                
                res.json({
                    success: true,
                    message: `Template "${templateName || design.name}" generated successfully`,
                    site: generateResult.data,
                    template: newTemplate
                });
                return;
            }
        } catch (generateError) {
            console.log('Site generation not available, falling back to template-based creation');
        }
        
        // Fallback: Create from existing template
        res.status(400).json({ 
            success: false, 
            error: 'Site generation requires a base template. Use /api/admin/mcp/sites/create with an existing template_id instead.',
            suggestion: 'List available templates with GET /api/admin/mcp/duda-templates first'
        });
        
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate template' });
    }
});

// Batch create all 6 master templates from a base template
app.post('/api/admin/mcp/create-master-templates', requireAdmin, async (req, res) => {
    try {
        if (!dudaClient) {
            return res.status(400).json({ success: false, error: 'DUDA Partner API not configured' });
        }
        
        const { baseTemplateId } = req.body;
        
        // Input validation
        if (!baseTemplateId || typeof baseTemplateId !== 'string') {
            return res.status(400).json({ 
                success: false, 
                error: 'Base template ID is required. Get available templates from GET /api/admin/mcp/duda-templates'
            });
        }
        
        // Sanitize baseTemplateId - only allow alphanumeric, hyphens, underscores
        const sanitizedBaseTemplateId = baseTemplateId.replace(/[^a-zA-Z0-9_-]/g, '');
        if (sanitizedBaseTemplateId !== baseTemplateId) {
            return res.status(400).json({ success: false, error: 'Base template ID contains invalid characters' });
        }
        
        const results = [];
        const errors = [];
        
        for (const [designId, design] of Object.entries(CHURCH_TEMPLATE_DESIGNS)) {
            try {
                console.log(`Creating template: ${design.name}...`);
                
                // Determine if this is a numeric template_id or a site_name to duplicate
                const isNumericTemplate = /^\d+$/.test(sanitizedBaseTemplateId);
                
                let site;
                if (isNumericTemplate) {
                    // Create from DUDA template ID
                    console.log(`Using template_id: ${sanitizedBaseTemplateId}`);
                    site = await dudaClient.sites.create({
                        template_id: sanitizedBaseTemplateId,
                        default_domain_prefix: `church-${designId}-master`
                    });
                } else {
                    // Duplicate existing site using SDK
                    console.log(`Duplicating site: ${sanitizedBaseTemplateId}`);
                    site = await dudaClient.sites.duplicate({
                        site_name: sanitizedBaseTemplateId,
                        new_default_domain_prefix: `church-${designId}-master`
                    });
                }
                
                console.log(`Site created: ${site.site_name}`);
                
                // Apply theme colors
                try {
                    await dudaClient.sites.theme.update({
                        site_name: site.site_name,
                        colors: design.colors
                    });
                    console.log(`Theme applied to ${site.site_name}`);
                } catch (themeError) {
                    console.log(`Theme note for ${site.site_name}:`, themeError?.message || 'Theme API not available');
                }
                
                // Create ChurchData collection
                try {
                    await callDudaAPI('POST', `/sites/multiscreen/${site.site_name}/collection/ChurchData`, {
                        name: CHURCH_DATA_COLLECTION_SCHEMA.name,
                        fields: CHURCH_DATA_COLLECTION_SCHEMA.fields.map(f => ({
                            name: f.name,
                            type: f.type === 'text' ? 'plain_text' : f.type
                        }))
                    });
                    console.log(`Collection created on ${site.site_name}`);
                } catch (collectionError) {
                    console.log(`Collection note for ${site.site_name}:`, collectionError.message);
                }
                
                // Save to local templates config
                const templatesConfig = loadConfig(TEMPLATES_CONFIG, { templates: [], lastUpdated: null });
                
                // Ensure templates array exists
                if (!Array.isArray(templatesConfig.templates)) {
                    templatesConfig.templates = [];
                }
                
                const newTemplate = {
                    id: `master-${designId}`,
                    template_id: site.site_name,
                    base_site_name: site.site_name,
                    name: `${design.name} (Master)`,
                    description: design.description,
                    thumbnail: null,
                    designId: designId,
                    isMasterTemplate: true,
                    createdAt: new Date().toISOString(),
                    createdBy: 'MCP'
                };
                
                // Remove existing master template with same designId if exists
                templatesConfig.templates = templatesConfig.templates.filter(t => t.id !== `master-${designId}`);
                templatesConfig.templates.push(newTemplate);
                templatesConfig.lastUpdated = new Date().toISOString();
                saveConfig(TEMPLATES_CONFIG, templatesConfig);
                
                results.push({
                    designId,
                    name: design.name,
                    siteName: site.site_name,
                    success: true
                });
                
                // Small delay between creations to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                const errorMsg = error?.message || error?.error || (typeof error === 'string' ? error : JSON.stringify(error));
                console.error(`Error creating ${design.name}:`, errorMsg, error);
                errors.push({
                    designId,
                    name: design.name,
                    error: errorMsg || 'Unknown error'
                });
            }
        }
        
        res.json({
            success: errors.length === 0,
            message: `Created ${results.length} of 6 master templates`,
            created: results,
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (error) {
        console.error('Error creating master templates:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create master templates' });
    }
});

// Test DUDA Partner API connection
app.get('/api/admin/mcp/test', requireAdmin, async (req, res) => {
    try {
        const results = {
            partnerApi: false,
            mcpToken: !!DUDA_MCP_TOKEN,
            mcpUrl: !!DUDA_MCP_URL
        };
        
        if (dudaClient) {
            try {
                // Use direct API to get total count with pagination
                let totalCount = 0;
                let offset = 0;
                const limit = 100;
                let hasMore = true;
                
                while (hasMore) {
                    const result = await callDudaAPI('GET', `/sites/multiscreen?offset=${offset}&limit=${limit}`);
                    if (result.success && result.data) {
                        const sites = result.data.results || (Array.isArray(result.data) ? result.data : []);
                        totalCount += sites.length;
                        offset += limit;
                        if (sites.length < limit) hasMore = false;
                    } else {
                        hasMore = false;
                    }
                    if (offset > 2000) hasMore = false; // Safety limit
                }
                
                results.partnerApi = true;
                results.siteCount = totalCount;
            } catch (apiError) {
                results.partnerApiError = apiError.message;
            }
        }
        
        res.json({ 
            success: true, 
            message: 'DUDA MCP connection test',
            results 
        });
    } catch (error) {
        console.error('MCP test error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
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

app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    // Initialize database tables
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Church Web Global server running on port ${PORT}`);
      console.log(`📍 Access at: http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ DUDA API configured: ${!!DUDA_API_USER}`);
      console.log(`🤖 DUDA MCP AI: ${!!DUDA_MCP_TOKEN}`);
      console.log(`💳 WHMCS API: ${!!WHMCS_API_URL}`);
      console.log(`🗄️ Database: PostgreSQL connected`);
    });
}

startServer().catch(console.error);


// Counter endpoint for master templates
app.get('/api/admin/mcp/master-templates/count', requireAdmin, async (req, res) => {
  try {
    const result = await dbQuery('SELECT COUNT(*) as count FROM master_templates WHERE is_active = TRUE');
    const count = parseInt(result.rows[0]?.count || 0);
    const totalDesigns = 6; // Number of template designs
    res.json({
      success: true,
      count: count,
      total: totalDesigns,
      display: `${count}/${totalDesigns}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

