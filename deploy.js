const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment build process...');

try {
  // Build the project
  console.log('🔨 Building project for production...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

  // Create deployment package
  console.log('📦 Preparing deployment package...');
  
  const deployDir = path.join(__dirname, 'deploy-package');
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployDir, { recursive: true });
  
  // Copy dist contents to deployment package
  if (fs.existsSync('dist')) {
    execSync(`cp -r dist/* ${deployDir}/`, { stdio: 'inherit' });
    console.log('✅ Files copied to deploy-package directory');
  } else {
    throw new Error('Build directory (dist) not found');
  }

  // Create deployment instructions
  const instructions = `
# 🚀 Deployment Instructions

Your project has been built successfully! The files in the 'deploy-package' directory are ready for deployment.

## Manual Deployment Options:

### 1. GitHub Pages (Recommended)
1. Create a new repository on GitHub
2. Upload all files from the 'deploy-package' directory to your repository
3. Go to repository Settings > Pages
4. Select "Deploy from a branch" and choose "main" branch
5. Your site will be available at: https://[username].github.io/[repository-name]/

### 2. Netlify
1. Go to https://netlify.com
2. Drag and drop the 'deploy-package' folder to deploy
3. Your site will be live instantly with a custom URL

### 3. Vercel
1. Go to https://vercel.com
2. Import your project or upload the 'deploy-package' folder
3. Deploy with one click

### 4. Other Static Hosting
Upload the contents of 'deploy-package' to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront
- Cloudflare Pages

## Files Ready for Deployment:
${fs.readdirSync(deployDir).map(file => `- ${file}`).join('\n')}

## Environment Variables
Don't forget to set up your environment variables in your hosting platform:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
`;

  fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.txt'), instructions);
  
  console.log('🎉 Deployment package created successfully!');
  console.log('📁 Check the "deploy-package" directory for your built files');
  console.log('📝 Read DEPLOYMENT_INSTRUCTIONS.txt for deployment options');
  console.log('');
  console.log('💡 Recommended: Upload the deploy-package contents to GitHub and enable Pages');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}