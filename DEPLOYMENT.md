# 🚀 QuantumSafe Deployment Guide

## Quick Deployment (WebContainer Environment)

Since Git is not available in this environment, we use a simplified deployment process:

### Build and Package
```bash
npm run deploy
```

This will:
1. Build your project for production
2. Create a `deploy-package` directory with all necessary files
3. Generate deployment instructions

### Manual Deployment Options

#### 1. GitHub Pages (Recommended)
1. Download or copy files from the `deploy-package` directory
2. Create a new repository on GitHub
3. Upload all files to your repository
4. Go to Settings > Pages
5. Select "Deploy from a branch" and choose "main"
6. Your site will be live at: `https://[username].github.io/[repository-name]/`

#### 2. Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `deploy-package` folder
3. Your site goes live instantly with a custom URL

#### 3. Vercel
1. Go to [vercel.com](https://vercel.com)
2. Create new project
3. Upload the `deploy-package` contents
4. Deploy with one click

#### 4. Other Static Hosts
Upload `deploy-package` contents to:
- Firebase Hosting
- AWS S3 + CloudFront
- Cloudflare Pages
- Surge.sh

### Environment Variables

For any hosting platform, set these environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Project Structure

```
QuantumSafe/
├── src/                    # Source code
├── public/                 # Static assets
├── supabase/migrations/    # Database migrations
├── deploy-package/         # Built files (generated)
├── dist/                   # Build output (generated)
└── package.json
```

### Performance Features

- ✅ Optimized production build
- ✅ Asset compression
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Minification

### Troubleshooting

1. **Build fails**: Check Node.js version compatibility
2. **Missing files**: Ensure all dependencies are installed
3. **Environment errors**: Verify Supabase credentials
4. **Routing issues**: Check base path configuration

### Updates

To update your deployed site:
1. Make changes to your code
2. Run `npm run deploy` to rebuild
3. Upload new `deploy-package` contents to your hosting platform

### Live URL Examples

- GitHub Pages: `https://username.github.io/repository-name/`
- Netlify: `https://random-name-123.netlify.app/`
- Vercel: `https://project-name.vercel.app/`

### Support

If you encounter issues:
1. Check the build logs for errors
2. Verify environment variables are set
3. Ensure all required dependencies are installed
4. Test locally with `npm run dev` first