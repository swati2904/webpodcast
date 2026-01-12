# 🚀 WebPodcast Deployment Guide

Quick guide to deploy your landing page and privacy policy.

## Option 1: GitHub Pages (Free, Easy)

### Steps:
1. **Create `gh-pages` branch** (or use `docs/` folder):
   ```bash
   git checkout -b gh-pages
   ```

2. **Copy website files**:
   - Copy `website/` folder contents to root of `gh-pages` branch
   - Or create `docs/` folder in main branch and copy there

3. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add landing page"
   git push origin gh-pages
   ```

4. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: `gh-pages` branch (or `docs/` folder)
   - Save

5. **Your site will be live at**:
   - `https://yourusername.github.io/webpodcast/`

### Update Privacy Policy Date:
- Edit `website/privacy-policy.html`
- Update `[Insert Date]` to actual date
- Update GitHub link if needed

---

## Option 2: Netlify (Recommended - Free, Auto-Deploy)

### Steps:
1. **Sign up**: https://netlify.com (free tier)

2. **Connect GitHub**:
   - Click "Add new site" → "Import an existing project"
   - Authorize Netlify to access GitHub
   - Select your `webpodcast` repository

3. **Build settings**:
   - Build command: Leave empty (static site)
   - Publish directory: `website`
   - Click "Deploy site"

4. **Custom Domain** (optional):
   - Site Settings → Domain Management
   - Add custom domain if you have one

5. **Auto-deploy**:
   - Every push to main branch automatically deploys!

**Your site**: `https://your-site-name.netlify.app`

---

## Option 3: Vercel (Free, Modern)

### Steps:
1. **Sign up**: https://vercel.com

2. **Import Project**:
   - Click "New Project"
   - Import from GitHub
   - Select `webpodcast` repository

3. **Configure**:
   - Framework Preset: Other
   - Root Directory: `website`
   - Build Command: Leave empty
   - Output Directory: Leave empty (or `.`)
   - Click "Deploy"

4. **Auto-deploy**:
   - Every push auto-deploys!

**Your site**: `https://your-site-name.vercel.app`

---

## Option 4: Surge.sh (Free, Command-Line)

### Steps:
1. **Install Surge**:
   ```bash
   npm install -g surge
   ```

2. **Deploy**:
   ```bash
   cd website
   surge
   ```
   - Follow prompts
   - Choose domain (e.g., `webpodcast.surge.sh`)

3. **Update**:
   ```bash
   cd website
   surge
   ```

---

## 📝 Pre-Deployment Checklist

Before deploying, update these in `website/index.html`:

- [ ] Replace `your-extension-id` with actual Chrome Web Store extension ID (after publishing)
- [ ] Replace `yourusername` with your GitHub username in all links
- [ ] Replace `yourdomain.com` with your actual domain (if using custom domain)
- [ ] Update privacy policy date in `website/privacy-policy.html`
- [ ] Add actual demo GIF/screenshot (replace `demo-gif.gif`)
- [ ] Test all links work
- [ ] Test responsive design on mobile

### Privacy Policy Updates:
- [ ] Update date: `[Insert Date]` → Actual date
- [ ] Update GitHub link: `yourusername` → Your username
- [ ] Update email if you add one

---

## 🔗 After Deploying

1. **Get your URL** (from whichever service you used)

2. **Update Privacy Policy Link**:
   - Use this URL for Chrome Web Store submission
   - Format: `https://your-site.com/privacy-policy.html`

3. **Update Chrome Store Listing**:
   - Add website URL
   - Add privacy policy URL
   - Add support URL (GitHub issues)

4. **Update README.md**:
   - Add badges with website link
   - Add Chrome Web Store link (after publishing)

---

## 🎨 Adding Demo GIF/Screenshot

### Option 1: Record Screen
- Use tools: **LICEcap** (free), **ScreenToGif** (free), **QuickTime** (Mac)
- Record: Extension in action
- Save as: `demo-gif.gif`
- Place in: `website/` folder

### Option 2: Create Composite
- Take 2-3 screenshots
- Use Figma/Canva to create side-by-side
- Export as PNG
- Use in `<img src="demo.png">`

### Recommended Demo Content:
1. Show extension popup
2. Show widget on a webpage
3. Show conversion in progress
4. Show playback interface

---

## 📊 Analytics (Optional)

### Google Analytics:
1. Sign up: https://analytics.google.com
2. Get tracking ID (e.g., `UA-XXXXX-X` or `G-XXXXXX`)
3. Add to `website/index.html` before `</head>`:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXX');
   </script>
   ```

### Privacy Note:
- Since your extension is privacy-first, consider NOT adding analytics
- Or mention it's optional in privacy policy if you do add it

---

## ✅ Final Checklist

Before going live:

- [ ] All links updated (GitHub, Chrome Store placeholder)
- [ ] Privacy policy date updated
- [ ] Demo GIF/screenshot added
- [ ] Tested on mobile devices
- [ ] All images load correctly
- [ ] Contact/support links work
- [ ] Privacy policy link works
- [ ] No broken links

---

## 🚀 Quick Deploy Commands

### GitHub Pages:
```bash
git checkout -b gh-pages
# Copy website files to root
git add .
git commit -m "Add landing page"
git push origin gh-pages
# Enable Pages in GitHub settings
```

### Netlify (via CLI):
```bash
npm install -g netlify-cli
cd website
netlify deploy
netlify deploy --prod
```

### Vercel (via CLI):
```bash
npm install -g vercel
cd website
vercel
vercel --prod
```

---

**Choose the option that works best for you. GitHub Pages is simplest if you're already using GitHub!** 🎉
