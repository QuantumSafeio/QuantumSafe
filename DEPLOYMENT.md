# 🚀 QuantumSafe Deployment Guide

## GitHub Pages Deployment

### Automatic Deployment
```bash
npm run deploy
```

### Manual Deployment Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Initialize Git (if not already done)**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Create GitHub repository**
   - Go to GitHub and create a new repository named "QuantumSafe"
   - Don't initialize with README, .gitignore, or license

4. **Add remote origin**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/QuantumSafe.git
   git branch -M main
   git push -u origin main
   ```

5. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```

6. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "gh-pages" branch
   - Click Save

### Environment Variables

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Project Structure

```
QuantumSafe/
├── src/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── lib/
├── public/
├── supabase/
│   └── migrations/
├── dist/ (generated)
└── package.json
```

### Performance Optimizations

- ✅ Source maps disabled for production
- ✅ Terser compression enabled
- ✅ Console.log removal in production
- ✅ Optimized chunk splitting
- ✅ Asset optimization

### Troubleshooting

1. **Build fails**: Check Node.js version (requires 16+)
2. **Pages not loading**: Verify base path in vite.config.js
3. **API errors**: Check environment variables
4. **Routing issues**: Ensure React Router basename matches repository name

### Live URL

After deployment, your site will be available at:
`https://YOUR_USERNAME.github.io/QuantumSafe/`

### Updates

To update the deployed site:
```bash
git add .
git commit -m "Update message"
git push origin main
npm run deploy
```