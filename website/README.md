# WebPodify Website

Static landing page for WebPodify Chrome Extension.

## Local Development

```bash
npm run dev
```

Opens at http://localhost:3000

## Deploy to Vercel

### Option 1: Using npm command (from project root)
```bash
npm run website:deploy
```

### Option 2: Using Vercel CLI (from website folder)
```bash
cd website
vercel --prod
```

### Option 3: Using Vercel Dashboard
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Set Root Directory to `website`
5. Framework Preset: Other
6. Build Command: `npm run build` (or leave empty)
7. Output Directory: `.` (current directory)
8. Click Deploy

## First Time Setup

If you haven't installed Vercel CLI:
```bash
npm install -g vercel
```

Then login:
```bash
vercel login
```
