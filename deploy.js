const fs = require('fs');
const path = require('path');

// Create deployment package without git
async function createDeploymentPackage() {
  console.log('🚀 Creating deployment package...');
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    console.error('❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  // Create deploy-package directory
  const deployDir = 'deploy-package';
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployDir, { recursive: true });
  
  // Copy dist contents to deploy-package
  copyDirectory('dist', deployDir);
  
  // Create deployment instructions
  const instructions = `
# 🚀 QuantumSafe Deployment Instructions

Your project has been built and packaged for deployment!

## Files Ready for Deployment
All files in the 'deploy-package' directory are ready to upload to any static hosting service.

## Quick Deployment Options:

### 1. Netlify (Easiest)
1. Go to https://netlify.com
2. Drag and drop the 'deploy-package' folder onto the deployment area
3. Your site goes live instantly!

### 2. Vercel
1. Go to https://vercel.com
2. Create new project
3. Upload the deploy-package contents
4. Deploy with one click

### 3. GitHub Pages
1. Create a new repository on GitHub
2. Upload all files from 'deploy-package' to your repository
3. Go to Settings > Pages
4. Select "Deploy from a branch" and choose "main"

### 4. Other Options
Upload 'deploy-package' contents to:
- Firebase Hosting
- AWS S3 + CloudFront
- Cloudflare Pages
- Surge.sh

## Environment Variables
Don't forget to set these on your hosting platform:
- VITE_SUPABASE_URL=your_supabase_url
- VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

## Next Steps
1. Choose a hosting platform above
2. Upload the deploy-package contents
3. Set environment variables
4. Your QuantumSafe app will be live!

Generated on: ${new Date().toISOString()}
`;
  
  fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.txt'), instructions);
  
  console.log('✅ Deployment package created successfully!');
  console.log('📁 Files are ready in the "deploy-package" directory');
  console.log('📖 Check DEPLOYMENT_INSTRUCTIONS.txt for next steps');
}

function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run the deployment package creation
createDeploymentPackage().catch(console.error);