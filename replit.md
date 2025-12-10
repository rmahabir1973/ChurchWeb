# Church Web Global

## Overview
Church Web Global is a SaaS platform for church website hosting, built with Node.js/Express and integrating with the DUDA website builder API. The platform allows churches to select templates, customize their sites, and sign up for hosting plans.

## Project Structure
```
church-web-global/
├── server.js          # Express backend with DUDA API integration
├── package.json       # Project dependencies
├── public/
│   ├── index.html     # Homepage with features, pricing, about sections
│   ├── funnel.html    # Multi-step website builder funnel
│   ├── styles.css     # Complete styling for both pages
│   └── app.js         # Frontend JavaScript for funnel functionality
└── README.md          # Project documentation
```

## Running the Project
- The server runs on port 5000 (required for Replit webview)
- Command: `node church-web-global/server.js`

## API Endpoints
- `GET /api/test` - Health check
- `GET /api/templates` - Fetch available templates from DUDA
- `GET /api/templates/:templateId` - Get specific template details
- `POST /api/sites/create` - Create a new site from template
- `POST /api/sites/:siteName/update` - Update site content
- `POST /api/sites/:siteName/publish` - Publish a site
- `GET /api/sites/:siteName` - Get site details
- `DELETE /api/sites/:siteName` - Delete a site
- `POST /api/signup` - Handle user signup

## Environment Variables (Secrets)
- `DUDA_API_USER` - DUDA API username
- `DUDA_API_PASSWORD` - DUDA API password
- `DUDA_API_ENDPOINT` - DUDA API base URL (https://api.duda.co/api)

## Features
1. **Homepage** - Professional landing page with features, pricing, about, and contact sections
2. **Website Builder Funnel** - 5-step process:
   - Step 1: Choose Template (custom church templates only)
   - Step 2: Church Info (collect church details)
   - Step 3: Select Pages (AI-powered suggestions)
   - Step 4: Preview (view unpublished site)
   - Step 5: Sign Up (create account, select plan - no auto-publish)
3. **DUDA Integration** - Creates and manages church websites via DUDA API
4. **DUDA MCP AI** - AI-powered page and content suggestions
5. **WHMCS Integration** - Client and order management (API polling for payment status)
6. **Fallback Templates** - Mock templates display when DUDA API is unavailable

## Recent Changes
- December 10, 2024: Initial setup with full project structure
- Configured server to bind to 0.0.0.0:5000 for Replit compatibility
- Added cache control headers to prevent caching issues
- Set up environment secrets for DUDA API credentials
- Added demo mode support for mock templates when DUDA API is unavailable
- Added input validation for site creation and signup endpoints
- Fixed DUDA API endpoint normalization (auto-appends /api if not present)
- Updated frontend to display real DUDA template thumbnail images

## Notes
- The DUDA_API_ENDPOINT secret should be set to the value from your DUDA dashboard (e.g., https://api.duda.co) - the system will automatically append /api if needed
- Demo mode allows full funnel testing with mock templates if DUDA API is unavailable
- Payment integration (Stripe/PayPal) needs to be added for production use
