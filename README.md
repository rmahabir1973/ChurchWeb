# Church Web Global - Complete Replit Setup Package

![Church Web Global](https://img.shields.io/badge/Status-Ready%20to%20Deploy-success)
![Platform](https://img.shields.io/badge/Platform-Replit-orange)
![DUDA](https://img.shields.io/badge/API-DUDA-blue)

## 📋 What's Included

This is a complete, ready-to-deploy Church Website Hosting SaaS platform that integrates with the DUDA API. When deployed, it provides:

1. **Professional Homepage** - Beautiful landing page for Church Web Global
2. **Interactive Funnel** - 4-step site creation wizard
3. **DUDA Integration** - Full API integration for site creation
4. **Email Hosting Info** - Promotes SmarterMail as MS365 alternative

## 🚀 Quick Start (30 Minutes)

### Step 1: Create Replit Project (2 min)

1. Go to [Replit.com](https://replit.com)
2. Sign up or log in
3. Click "Create Repl"
4. Select **"Node.js"** template
5. Name it: `church-web-global`
6. Click "Create Repl"

### Step 2: Upload Files (5 min)

**Option A: Use the Files Panel**
1. In Replit, look for the Files panel on the left
2. Click the three dots (...) menu
3. Select "Upload file" or "Upload folder"
4. Upload all files maintaining this structure:

```
church-web-global/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── funnel.html
│   ├── styles.css
│   └── app.js
└── .env.example (for reference only)
```

**Option B: Manual Creation**
1. Create each file using the "Add file" button
2. Copy and paste the contents from this package
3. Make sure folders are created correctly

### Step 3: Configure API Credentials (3 min) ⚠️ CRITICAL

1. In Replit, find the **"Secrets"** tool (lock icon 🔒) in the left sidebar
   - Sometimes called "Environment Variables"
   - May also be under "Tools" menu

2. Add these three secrets:

   **Secret 1:**
   - Key: `DUDA_API_USER`
   - Value: `f7ba1c1754`

   **Secret 2:**
   - Key: `DUDA_API_PASSWORD`
   - Value: `3DQy4QJ92TNw`

   **Secret 3:**
   - Key: `DUDA_API_ENDPOINT`
   - Value: `https://api.duda.co/api`

3. Click "Add secret" or "Save" for each one

⚠️ **NEVER put credentials directly in code files!**

### Step 4: Install Dependencies (1 min)

Replit usually installs dependencies automatically. If not:

1. Click the "Shell" tab at the bottom
2. Type: `npm install`
3. Press Enter
4. Wait for packages to install

### Step 5: Run the Application (1 min)

1. Click the big green **"Run"** button at the top
2. Wait for server to start (you'll see: "🚀 Church Web Global server running...")
3. A preview window will open showing your website!

### Step 6: Test the Funnel (5 min)

1. Click **"Get Started For Free"** on the homepage
2. Go through the 4-step funnel:
   - **Step 1:** Select a template (click any template card)
   - **Step 2:** Choose pages (checkboxes are pre-selected)
   - **Step 3:** Fill in church information
   - **Step 4:** Preview site and choose a plan

3. If everything works, you'll see the site preview!

## 📁 File Structure Explained

```
church-web-global/
│
├── server.js                 # Backend Express server with DUDA API integration
├── package.json             # Node.js dependencies
│
└── public/                  # Frontend files (served to users)
    ├── index.html           # Homepage with features, pricing, about
    ├── funnel.html          # 4-step site creation funnel
    ├── styles.css           # All styling (homepage + funnel)
    └── app.js               # Frontend JavaScript for funnel logic
```

## 🔧 Customization Guide

### Change Colors

Edit `public/styles.css` - look for the `:root` section:

```css
:root {
    --primary-color: #2563eb;     /* Change to your brand color */
    --primary-dark: #1e40af;
    --secondary-color: #64748b;
    /* ... */
}
```

### Update Company Information

Edit `public/index.html`:
- Company name: Search for "Church Web Global"
- Tagline: Search for "Trusted Since 2010"
- Pricing: Update the pricing cards section
- Contact info: Update the contact section

### Add Your Logo

1. Upload your logo image to the `public` folder
2. Edit `public/index.html` in the header section:
   ```html
   <div class="logo">
       <img src="your-logo.png" alt="Church Web Global">
       <p class="tagline">Trusted Since 2010</p>
   </div>
   ```

### Modify Templates

Templates are currently loaded as placeholders. To add real DUDA templates:

1. Get template IDs from DUDA API
2. Edit `public/app.js` - find `displayMockTemplates()`
3. Replace with actual template IDs from DUDA

## 🌐 Make It Live

### Get a Custom URL

**Option 1: Replit Custom Domain (Easiest)**
1. Go to your Repl settings
2. Find "Custom Domain" section
3. Connect your domain (e.g., churchwebglobal.com)
4. Follow Replit's DNS instructions

**Option 2: Always On (Recommended for Production)**
- Free Repls "sleep" after inactivity
- Upgrade to Replit's paid plan for "Always On"
- Or migrate to production hosting (see below)

### Migrate to Production Hosting

For serious production use, consider migrating to:

**Recommended Platforms:**
- **Vercel** - Best for Next.js/React (can adapt this code)
- **Railway** - Simple deployment, good pricing
- **DigitalOcean App Platform** - More control, scalable
- **Render** - Good free tier, easy deployment

**Why migrate?**
- Better performance
- More reliable uptime
- Custom SSL certificates
- Better for business use

## 🔒 Security Checklist

Before going live:

- ✅ API credentials stored in Secrets (not in code)
- ✅ HTTPS enabled (automatic on Replit)
- ⚠️ Add rate limiting (for production)
- ⚠️ Add user authentication (for production)
- ⚠️ Add input validation (for production)
- ⚠️ Add proper error logging
- ⚠️ Set up backups

## 💳 Next Steps for Full Production

This is a working MVP. To make it production-ready:

### 1. Payment Integration (Required)
Add Stripe or PayPal for plan selection:
```javascript
// In server.js, add payment processing
app.post('/api/create-checkout', async (req, res) => {
    // Stripe integration here
});
```

### 2. User Authentication
Add user accounts so customers can:
- Log in and manage their sites
- Update billing information
- Access their dashboard

Recommended: Use **Auth0**, **Firebase Auth**, or **Passport.js**

### 3. Customer Dashboard
Create a dashboard where customers can:
- Edit their website
- View analytics
- Manage email accounts
- Update billing

### 4. Email Integration
Connect SmarterMail API to manage email accounts:
- Create email accounts
- Set up forwarding
- Manage quotas

### 5. Database
Add a database to store:
- User accounts
- Site information
- Billing details
- Analytics

Recommended: **PostgreSQL** (on Railway/Render) or **MongoDB Atlas**

## 🐛 Troubleshooting

### Problem: Server won't start

**Solution:**
```bash
# In Shell, run:
npm install
node server.js
```

Check for error messages in the Console tab.

### Problem: "Cannot find module 'express'"

**Solution:**
```bash
npm install express axios dotenv cors
```

### Problem: API calls return 401 Unauthorized

**Solution:**
- Verify Secrets are set correctly
- Check DUDA API credentials are active
- Make sure you used the Secrets panel (not .env file)

### Problem: Templates not loading

**Solution:**
- Check browser console (F12) for errors
- Verify DUDA API endpoint is correct
- Check if DUDA API is accessible from your location

### Problem: CORS errors

**Solution:**
- CORS is already configured in server.js
- If still getting errors, check browser console
- May need to whitelist your domain in DUDA settings

## 📞 Support Resources

- **DUDA API Docs:** https://developer.duda.co/reference
- **Replit Docs:** https://docs.replit.com
- **Express.js Docs:** https://expressjs.com
- **Node.js Docs:** https://nodejs.org/docs

## 📊 API Endpoints Reference

Your server provides these endpoints:

### Template Endpoints
- `GET /api/templates` - Get all available templates
- `GET /api/templates/:id` - Get specific template details

### Site Management
- `POST /api/sites/create` - Create new site from template
- `GET /api/sites/:siteName` - Get site details
- `POST /api/sites/:siteName/update` - Update site content
- `POST /api/sites/:siteName/publish` - Publish site
- `DELETE /api/sites/:siteName` - Delete site

### User Management
- `POST /api/signup` - Complete signup and publish site

### Health Check
- `GET /api/test` - Check if API is running

## 🎨 Design Credits

- Font: Inter (Google Fonts)
- Color Scheme: Modern blue gradient
- Icons: Emoji (universally supported)
- Layout: CSS Grid + Flexbox
- Mobile: Fully responsive

## 📝 License

This code is provided for Church Web Global's use. Customize as needed.

## ✅ Final Checklist

Before launching to customers:

- [ ] All API credentials configured in Secrets
- [ ] Tested complete funnel flow
- [ ] Customized branding (logo, colors, text)
- [ ] Set up custom domain
- [ ] Enabled "Always On" or migrated to production
- [ ] Added payment integration
- [ ] Set up user authentication
- [ ] Created customer dashboard
- [ ] Configured email for notifications
- [ ] Set up analytics tracking
- [ ] Tested on mobile devices
- [ ] Prepared customer support resources

## 🎉 You're Done!

Your Church Web Global SaaS platform is ready! 

Test it thoroughly, customize it to your needs, and when ready, share the link with your first customers!

**Questions?** Check the troubleshooting section above or refer to the DUDA API documentation.

---

**Built with ❤️ for Church Web Global**
*Serving churches since 2010*
