# Church Web Global - Replit Setup Guide

## Step-by-Step Instructions for Replit

### STEP 1: Create New Replit Project

1. Go to https://replit.com
2. Click "Create Repl"
3. Select "Node.js" as the template
4. Name it: "church-web-global"
5. Click "Create Repl"

### STEP 2: Set Up Project Files

Once your Repl is created, you'll need to create the following file structure. Use the "Add file" or "Add folder" buttons in Replit:

```
church-web-global/
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── funnel.html
└── .env
```

### STEP 3: Configure Environment Variables (IMPORTANT - DO THIS FIRST!)

1. In Replit, look for the "Secrets" tool (lock icon) in the left sidebar
2. Click on "Secrets" (or "Environment Variables")
3. Add the following secrets:

**Secret 1:**
- Key: `DUDA_API_USER`
- Value: `f7ba1c1754`

**Secret 2:**
- Key: `DUDA_API_PASSWORD`
- Value: `3DQy4QJ92TNw`

**Secret 3:**
- Key: `DUDA_API_ENDPOINT`
- Value: `https://api.duda.co/api`

⚠️ **NEVER put API credentials directly in code files - always use Secrets/Environment Variables!**

### STEP 4: Create package.json

In Replit, click on `package.json` and paste this content:

```json
{
  "name": "church-web-global",
  "version": "1.0.0",
  "description": "Church Website Hosting SaaS Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  }
}
```

### STEP 5: Create server.js

Create `server.js` in the root directory with the provided code (see server.js file).

### STEP 6: Create Public Folder and Files

1. Create a folder called `public`
2. Inside `public`, create these files:
   - `index.html` (homepage)
   - `funnel.html` (DUDA site builder funnel)
   - `styles.css` (styling)
   - `app.js` (frontend JavaScript)

### STEP 7: Install Dependencies

In Replit:
1. The dependencies should install automatically when you run the project
2. If not, open the Shell tab and run: `npm install`

### STEP 8: Run the Project

1. Click the green "Run" button at the top
2. Replit will start your server
3. You'll see a preview window with your website
4. The URL will be something like: `https://church-web-global.yourusername.repl.co`

### STEP 9: Test the Funnel

1. Click "Get Started For Free" on the homepage
2. You should be taken to the funnel page
3. Follow the steps:
   - View and select a template
   - Choose pages to include
   - Customize basic settings
   - Preview the site
   - Sign up (this will be integrated with your payment system later)

### STEP 10: Customize and Deploy

**Customization Options:**
- Edit `public/index.html` to change homepage content
- Edit `public/styles.css` to adjust colors, fonts, and styling
- Edit `server.js` to add more API endpoints or features
- Add your logo by placing an image file in `public/` folder

**Making it Production Ready:**

1. **Custom Domain:**
   - In Replit, go to your project settings
   - Look for "Custom Domain" option
   - Follow instructions to connect your domain (e.g., churchwebglobal.com)

2. **Always On:**
   - Replit free tier may sleep after inactivity
   - Consider upgrading to Replit's paid plan for "Always On" feature
   - Or migrate to Vercel/Netlify for production

3. **Payment Integration:**
   - Add Stripe or PayPal integration in the signup step
   - This requires additional code (can be provided separately)

## Troubleshooting

### Problem: Server won't start
**Solution:** Check that all files are created and package.json is valid. Run `npm install` in Shell.

### Problem: API calls failing
**Solution:** Verify your Secrets are set correctly. Check DUDA API credentials are active.

### Problem: Templates not loading
**Solution:** Check browser console for errors. Verify DUDA API endpoint is correct.

### Problem: CORS errors
**Solution:** Server.js includes CORS middleware. Make sure server is running properly.

## Next Steps After Basic Setup

1. **Add Authentication:** Implement user accounts so customers can manage their sites
2. **Payment Integration:** Add Stripe/PayPal for plan selection
3. **Dashboard:** Create a customer dashboard to manage their church website
4. **Email Integration:** Connect SmarterMail API for email hosting management
5. **Site Management:** Allow customers to edit their sites after creation

## Support Resources

- DUDA API Documentation: https://developer.duda.co/reference
- Replit Documentation: https://docs.replit.com
- Express.js Documentation: https://expressjs.com

## Security Notes

✅ API credentials are stored in Secrets (environment variables)
✅ CORS is configured for security
✅ Never commit .env file to public repositories
⚠️ Before production, add rate limiting and authentication
⚠️ Consider adding input validation and sanitization
⚠️ Set up proper error logging

---

**Ready to start?** Follow the steps above and you'll have your Church Web Global SaaS platform running in about 30 minutes!
