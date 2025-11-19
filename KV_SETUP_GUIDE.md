# Netlify KV Setup Guide - Simple Steps

## What is Netlify KV?
Netlify KV (Key-Value store) is a simple database for storing logs. It's **FREE** and works on all Netlify plans.

---

## Quick Setup (5 minutes)

### Step 1: Go to Netlify Dashboard
1. Visit: **https://app.netlify.com**
2. Sign in
3. Click on your site: **"sircheck-kalol"**

### Step 2: Create KV Store
1. In your site dashboard, click **"Site settings"** (top right)
2. Click **"Functions"** in the left sidebar
3. Scroll down to **"KV stores"** section
4. Click **"Create store"** or **"Add store"**
5. Enter store name: **`search-logs`** (exactly this name)
6. Click **"Create"** or **"Save"**

### Step 3: That's It!
The KV store is now created. Your logs will start working automatically.

### Step 4: Test It
1. Go to: **https://sircheck-kalol.netlify.app/logs**
2. Press `Ctrl+L` (or `Cmd+L` on Mac) to access logs
3. Enter password: **0613**
4. You should see the logs page!

---

## Visual Guide

```
Netlify Dashboard
  └─ Your Site (sircheck-kalol)
      └─ Site settings
          └─ Functions
              └─ KV stores
                  └─ Create store
                      └─ Name: "search-logs"
                          └─ Create
```

---

## Troubleshooting

### "KV not configured" error
- Make sure you created the store with the exact name: **`search-logs`**
- Check that the store is listed in Site settings → Functions → KV stores

### Still not working?
1. **Redeploy your site:**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

2. **Check function logs:**
   - Go to Site settings → Functions
   - Click on `log-search` or `get-logs`
   - Check for any errors

3. **Verify store name:**
   - The store must be named exactly: **`search-logs`**
   - Case-sensitive!

---

## Alternative: Manual Setup via Netlify CLI

If you prefer command line:

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login
netlify login

# Link to your site
cd /Users/dhruvsolanki/Desktop/SIR
netlify link

# Create KV store
netlify kv:create search-logs
```

---

## Need Help?

- Netlify KV Docs: https://docs.netlify.com/kv/overview/
- Netlify Support: https://www.netlify.com/support/

---

**That's it! Once you create the KV store named "search-logs", everything will work automatically.**

