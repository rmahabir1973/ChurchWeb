# Church Web Global

## Overview
Church Web Global is a SaaS platform for church website hosting, built with Node.js/Express and integrating with the DUDA website builder API. The platform allows churches to select templates, customize their sites, and sign up for hosting plans.

## Project Structure
```
church-web-global/
├── server.js           # Express backend with DUDA API integration
├── package.json        # Project dependencies
├── public/
│   ├── index-new.html  # NEW: Modern SaaS landing page (main homepage)
│   ├── index.html      # OLD: Original homepage (accessible at /old)
│   ├── funnel.html     # Multi-step website builder funnel
│   ├── styles-new.css  # NEW: Complete design system for landing page
│   ├── styles.css      # Original styling for funnel page
│   ├── landing.js      # NEW: JavaScript for landing page interactions
│   └── app.js          # Frontend JavaScript for funnel functionality
└── README.md           # Project documentation
```

## Running the Project
- The server runs on port 5000 (required for Replit webview)
- Command: `node church-web-global/server.js`

## API Endpoints

### Templates
- `GET /api/templates` - Fetch available templates from DUDA
- `GET /api/templates/:templateId` - Get specific template details

### Site Management
- `POST /api/sites/create` - Create a new site from template (supports both numeric template_id and base_site_name)
- `GET /api/sites/:siteName` - Get site details
- `DELETE /api/sites/:siteName` - Delete a site
- `POST /api/sites/:siteName/content` - Update site Content Library
- `POST /api/sites/:siteName/publish` - Publish a site

### Collections API (NEW)
- `GET /api/sites/:siteName/collections` - List all collections for a site
- `GET /api/sites/:siteName/collections/:collectionName` - Get collection schema and data
- `GET /api/sites/:siteName/collections/:collectionName/rows` - Get all rows in a collection
- `POST /api/sites/:siteName/collections/:collectionName/rows` - Create new rows in a collection
- `PUT /api/sites/:siteName/collections/:collectionName/rows/:rowId` - Update a specific row
- `DELETE /api/sites/:siteName/collections/:collectionName/rows/:rowId` - Delete a row
- `POST /api/sites/:siteName/collections/:collectionName/sync` - Clear and replace all rows
- `POST /api/sites/:siteName/update-all` - Update both Content Library AND collection in one call

### Cloudflare DNS Management (Admin)
- `GET /api/admin/cloudflare/zones` - List all Cloudflare zones (auto-fetches 200+ domains)
- `GET /api/admin/cloudflare/zones/:zoneId/dns` - Get DNS records for a zone
- `POST /api/admin/cloudflare/zones/:zoneId/dns` - Create a DNS record
- `PUT /api/admin/cloudflare/zones/:zoneId/dns/:recordId` - Update a DNS record
- `DELETE /api/admin/cloudflare/zones/:zoneId/dns/:recordId` - Delete a DNS record
- `POST /api/admin/cloudflare/zones/:zoneId/quick-setup/duda` - Quick action: Point domain to DUDA

### SmarterMail Management (Admin)
- `GET /api/admin/smartermail/domains` - List all mail domains
- `GET /api/admin/smartermail/domains/:domain` - Get domain details
- `GET /api/admin/smartermail/domains/:domain/users` - List all users for a domain
- `POST /api/admin/smartermail/domains/:domain/users` - Create a new mail user
- `PUT /api/admin/smartermail/domains/:domain/users/:username` - Update a mail user
- `DELETE /api/admin/smartermail/domains/:domain/users/:username` - Delete a mail user
- `GET /api/admin/smartermail/stats` - Get mail server statistics

### DUDA MCP Template Creation (Admin)
- `GET /api/admin/mcp/test` - Test DUDA Partner API and MCP connection
- `GET /api/admin/mcp/template-designs` - List 6 available church design styles
- `GET /api/admin/mcp/collection-schema` - Get ChurchData collection schema
- `GET /api/admin/mcp/duda-templates` - List all DUDA templates in account
- `GET /api/admin/mcp/sites` - List all sites in DUDA account
- `GET /api/admin/mcp/sites/:siteName` - Get site details
- `POST /api/admin/mcp/sites/create` - Create new site from template with design theme
- `POST /api/admin/mcp/sites/:siteName/create-collection` - Add ChurchData collection to site
- `POST /api/admin/mcp/generate-template` - Generate template using AI description
- `POST /api/admin/mcp/create-master-templates` - Batch create all 6 master templates

### Other
- `GET /api/test` - Health check
- `POST /api/signup` - Handle user signup

## Environment Variables (Secrets)
- `DUDA_API_USER` - DUDA API username
- `DUDA_API_PASSWORD` - DUDA API password
- `DUDA_API_ENDPOINT` - DUDA API base URL (https://api.duda.co/api)
- `WHMCS_API_URL` - WHMCS API URL
- `WHMCS_API_IDENTIFIER` - WHMCS API identifier
- `WHMCS_API_SECRET` - WHMCS API secret
- `WHMCS_PRODUCT_STARTER` - WHMCS product ID for Starter plan
- `WHMCS_PRODUCT_PROFESSIONAL` - WHMCS product ID for Professional plan
- `WHMCS_PRODUCT_ENTERPRISE` - WHMCS product ID for Enterprise plan
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token (get from https://dash.cloudflare.com/profile/api-tokens)
- `SMARTERMAIL_URL` - SmarterMail server URL (e.g., https://mail.churchwebsupport.com)
- `SMARTERMAIL_ADMIN_USER` - SmarterMail system admin email
- `SMARTERMAIL_ADMIN_PASSWORD` - SmarterMail system admin password

## Features
1. **Modern SaaS Landing Page** (NEW)
   - Hero section with gradient text and browser mockup
   - Social proof banner with animated counters
   - 6-card features grid
   - 4-step demo builder preview
   - 3-tier pricing with monthly/annual toggle
   - Full footer with links
   - Scroll animations and smooth scrolling
   
2. **Website Builder Funnel** - 4-step process:
   - Step 1: Choose Template (custom church templates only)
   - Step 2: Church Info (collect church details)
   - Step 3: Preview (view unpublished site with Content Library populated)
   - Step 4: Sign Up (create account, select plan - no auto-publish)

3. **DUDA Integration** - Creates and manages church websites via DUDA API
4. **DUDA MCP AI** - AI-powered page and content suggestions
5. **WHMCS Integration** - Client and order management (API polling for payment status)
6. **AI Content Generation** - OpenAI-powered content writing for each page
7. **Fallback Templates** - Mock templates display when DUDA API is unavailable
8. **Cloudflare DNS Management** - Manage 200+ domains from admin panel
   - Auto-fetch all zones with single API token
   - View, add, edit, delete DNS records (A, CNAME, MX, TXT, etc.)
   - Quick-action "Point to DUDA" button for one-click domain setup
   - Search/filter domains
9. **SmarterMail Integration** - Manage mail server domains and users
   - List all mail domains
   - Add/edit/delete mail users per domain
   - Set mailbox sizes and reset passwords
   - JWT authentication with automatic token refresh

## Design System (styles-new.css)
```css
/* Primary Colors */
--color-primary: #6B46C1 (Deep Purple)
--color-accent: #D946A6 (Vibrant Magenta)
--color-navy-dark: #1E1B4B (Headers, footer)

/* Typography */
--font-primary: 'Inter' (body text)
--font-accent: 'Outfit' (headings)

/* Gradients */
--gradient-hero: linear-gradient(135deg, #6B46C1 0%, #D946A6 100%)
```

## Recent Changes
- December 23, 2024: Added DUDA MCP Template Creation Integration
  - New "MCP" tab in admin panel for AI-powered template management
  - Integrated @dudadev/partner-api for direct DUDA API access
  - 6 pre-defined church design themes: Modern Minimalist, Traditional Classic, Warm Community, Bold & Dynamic, Pastoral Calm, Urban Contemporary
  - ChurchData collection schema with 14 fields for standardized church data
  - Batch template creation: Create all 6 master templates from a base template
  - Admin UI shows connection status, design previews, and site management
  - Endpoints for listing DUDA templates/sites, creating sites, applying themes

- December 23, 2024: Added SmarterMail Integration to Admin Panel
  - New "Mail" tab in admin panel navigation for mail server management
  - JWT authentication with 60-second token caching and automatic 401 retry
  - 7 backend API endpoints: list domains, get domain, list/create/update/delete users, stats
  - Modal-based mail user editor with mailbox size settings (100MB-5GB)
  - Search/filter mail domains by name
  - Response sanitization for security (only returns needed fields)
  - API status indicator for SmarterMail in Settings

- December 23, 2024: Added Cloudflare DNS Management to Admin Panel
  - New "DNS" tab in admin panel navigation
  - Auto-fetches all zones (200+ domains) with single API token
  - Full DNS record management: view, add, edit, delete records
  - Supports A, AAAA, CNAME, MX, TXT, NS, SRV record types
  - "Point to DUDA" quick-action button for one-click domain setup
  - Search/filter domains by name
  - Modal-based DNS record editor with proxy toggle
  - API status indicator for Cloudflare in Settings

- December 12, 2024: Added Thumbnail Upload to Admin Templates
  - File upload for template thumbnails (JPEG, PNG, GIF, WebP up to 5MB)
  - Preview with remove button in template modal
  - Multer configured for file handling
  - Uploads stored in /public/uploads/

- December 12, 2024: Added 14-Day Free Trial Banner to Funnel
  - Prominent trial offer banner on Step 4 (Choose Your Plan)
  - Updated button text to "Start My Free Trial"
  - Clearer messaging about no payment required to start

- December 12, 2024: Fixed DUDA Client Import (Full Pagination)
  - Added proper pagination with offset/limit loop to fetch ALL sites (not just first 50)
  - Now fetches preview URLs (preview_site_url, site_domain, or canonical_url)
  - Better church name extraction from site_business_info.business_name
  - Better error messages showing actual API errors
  - Detailed server logging during import

- December 12, 2024: Integrated Postmark Email Service
  - Added Postmark SDK for sending transactional emails
  - Magic-link portal authentication emails now sent via Postmark
  - Sender addresses: support@, billing@, info@, admin@churchwebglobal.com
  - Test email functionality in admin panel

- December 12, 2024: Expanded Admin Panel
  - Full client management with search, filter, pagination
  - Site management with status tracking
  - Trial management with extend/upgrade actions
  - Dashboard with real-time stats (clients, sites, trials, paid accounts)
  - Email testing section
  - API status monitoring
  - Import DUDA clients button with progress feedback
  - New admin endpoints: /api/admin/stats, /api/admin/sites, /api/admin/trials, etc.

- December 12, 2024: Migrated to PostgreSQL Database
  - Created clients, sites, and trials tables in PostgreSQL
  - Trial data now stored in database instead of JSON files
  - Added client portal at /portal for existing users to login and edit sites
  - Added admin endpoint POST /api/admin/import-duda-clients to import 150+ existing clients
  - Added GET /api/admin/clients to list all clients with pagination
  - Added POST /api/client/request-access and /api/client/verify-token for secure portal auth

- December 12, 2024: Added 14-Day Free Trial with DUDA SSO
  - Users get 14-day free trial with EDIT access (no PUBLISH)
  - SSO integration - users edit directly in white-labeled DUDA editor
  - Trial tracking stored in config/trials.json
  - Upgrade flow grants PUBLISH permission after payment
  - New API endpoints: /api/trial/start, /api/trial/editor-link, /api/trial/status, /api/trial/upgrade

- December 12, 2024: Simplified funnel from 5 steps to 4 steps
  - Removed Step 3 (Select Pages) as it was non-functional
  - Template pages can't be modified via API without complex Page API calls
  - Funnel now: Template → Church Info → Preview → Sign Up
  - Content still populates via Content Library and Replit1 collection

- December 12, 2024: Added Admin Panel
  - Backend admin panel at `/admin` with password protection
  - Template management: add/edit/delete templates with custom thumbnails
  - No more editing code to manage templates
  - Config stored in `church-web-global/config/templates.json`
  - First login sets the admin password

- December 12, 2024: Integrated funnel with DUDA Collections
  - Added tagline and story fields to Step 2 form
  - Site creation now populates both Content Library AND Replit1 collection
  - Replit1 fields mapped: Welcome_Message, tagline, About_short_blurb, About_Story
  - Template resolver supports both base_site_name and numeric template_id
  
- December 12, 2024: Complete landing page redesign
  - Created new modern SaaS-style landing page (index-new.html)
  - Built comprehensive CSS design system (styles-new.css)
  - Added landing.js with all JavaScript interactions
  - Hero section with gradient text, browser mockup, floating cards
  - Social proof banner with animated counters (200+, 50000+, 99.9%, Since 2010)
  - Features grid with 6 church-specific feature cards
  - "How It Works" section with 4-step visual
  - Pricing section with monthly/annual toggle
  - Full footer with navigation links
  - Fixed static middleware to use custom route for homepage
  - Old homepage still accessible at /old route
  
- December 10, 2024: Initial setup with full project structure
- December 10, 2024: Enhanced WHMCS integration
- December 10, 2024: Enhanced site customization

## Notes
- The new landing page is served at `/` (index-new.html)
- The old landing page is accessible at `/old` (index.html)
- Funnel remains at `/funnel.html` or `/funnel`
- The DUDA_API_ENDPOINT secret should be set to the value from your DUDA dashboard
- Demo mode allows full funnel testing with mock templates if DUDA API is unavailable
