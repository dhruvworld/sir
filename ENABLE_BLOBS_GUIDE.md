# How to Enable Netlify Blobs - Detailed Step-by-Step Guide

## Why Enable Blobs?
Netlify Blobs is required to store and retrieve search logs. Without it, the logs page will show "Unable to load logs" error.

---

## Step-by-Step Instructions

### Step 1: Access Netlify Dashboard
1. Open your web browser
2. Go to: **https://app.netlify.com**
3. Sign in with your Netlify account (the one connected to your GitHub)

### Step 2: Navigate to Your Site
1. Once logged in, you'll see your sites list
2. Find and click on **"sircheck-kalol"** (or your site name)
3. This will open your site's dashboard

### Step 3: Open Site Settings
1. Look at the top navigation bar in your site dashboard
2. Click on **"Site settings"** (usually in the top right or in a settings/gear icon)
3. This opens the site configuration page

### Step 4: Navigate to Build & Deploy Settings
1. In the left sidebar of Site settings, you'll see several sections:
   - General
   - Build & deploy ← **Click this**
   - Environment
   - Functions
   - etc.
2. Click on **"Build & deploy"**

### Step 5: Find Environment Variables Section
1. In the Build & deploy page, scroll down
2. Look for a section called **"Environment variables"** or **"Environment"**
3. You might also see tabs like:
   - Build settings
   - Environment variables
   - Deploy contexts
   - etc.

### Step 6: Enable Netlify Blobs
**Option A: If you see a "Blobs" section:**
1. Look for a toggle or checkbox labeled **"Enable Blobs"** or **"Netlify Blobs"**
2. Toggle it ON (should turn blue/green)
3. Click **"Save"** or **"Update"** if there's a save button

**Option B: If you don't see Blobs option:**
1. Go to the main Netlify dashboard (not site settings)
2. Click on your profile/account icon (top right)
3. Look for **"Team settings"** or **"Account settings"**
4. Check if Blobs needs to be enabled at the account/team level first

**Option C: Alternative Method - Via Netlify CLI:**
If the UI option isn't available, you can enable it via command line:
```bash
netlify blobs:enable
```

### Step 7: Verify Blobs is Enabled
1. Go back to your site's **Site settings**
2. Navigate to **"Functions"** in the left sidebar
3. Check if you see any Blobs-related configuration
4. Or check the **"Environment"** section for Blobs settings

### Step 8: Redeploy Your Site
After enabling Blobs, you need to trigger a new deployment:

**Method 1: Via Dashboard**
1. Go to your site's main dashboard
2. Click on **"Deploys"** tab
3. Click **"Trigger deploy"** → **"Deploy site"**
4. Wait for the deployment to complete (usually 1-3 minutes)

**Method 2: Via Git Push**
1. Make a small change to any file (or just add a space)
2. Commit and push:
   ```bash
   git commit --allow-empty -m "Trigger redeploy for Blobs"
   git push
   ```
3. Netlify will automatically deploy

**Method 3: Via Netlify CLI**
```bash
netlify deploy --prod
```

### Step 9: Test the Logs Page
1. Wait for deployment to complete (check the Deploys tab)
2. Go to: **https://sircheck-kalol.netlify.app/logs**
3. Enter password: **0613**
4. Click **"Unlock"**
5. If Blobs is properly configured, you should see the logs table

---

## Troubleshooting

### If you can't find the Blobs option:
1. **Check your Netlify plan**: Blobs might require a paid plan
   - Free plan: May have limited Blobs access
   - Pro plan: Full Blobs access
   - Check: https://www.netlify.com/pricing/

2. **Try enabling via Netlify CLI:**
   ```bash
   # Install Netlify CLI if not installed
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Link to your site
   netlify link
   
   # Enable Blobs
   netlify blobs:enable
   ```

3. **Check Netlify documentation:**
   - Visit: https://docs.netlify.com/blobs/overview/
   - Look for latest instructions

### If Blobs is enabled but still not working:
1. **Check function logs:**
   - Go to Site settings → Functions
   - Click on `get-logs` function
   - Check the logs for errors

2. **Verify function code:**
   - Make sure `get-logs.ts` is properly deployed
   - Check that it's using `@netlify/blobs` correctly

3. **Test Blobs manually:**
   ```bash
   # In your project directory
   netlify blobs:list --store=search-logs
   ```

### Alternative: Use Netlify KV instead of Blobs
If Blobs isn't available, we can switch to Netlify KV (Key-Value store):
1. KV is available on all plans
2. Requires code changes to use KV instead of Blobs
3. Let me know if you want to switch to KV

---

## Quick Reference

**Dashboard URL:** https://app.netlify.com/projects/sircheck-kalol  
**Site URL:** https://sircheck-kalol.netlify.app  
**Logs Page:** https://sircheck-kalol.netlify.app/logs  
**Password:** 0613

**Navigation Path:**
```
Netlify Dashboard → 
  Your Site (sircheck-kalol) → 
    Site settings → 
      Build & deploy → 
        Environment → 
          Enable Blobs
```

---

## Need Help?

If you're still having issues:
1. Check Netlify's status page: https://www.netlifystatus.com/
2. Review Netlify Blobs docs: https://docs.netlify.com/blobs/overview/
3. Contact Netlify support if you have a paid plan
4. Consider switching to Netlify KV as an alternative

