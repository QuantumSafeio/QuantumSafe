const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting GitHub deployment process...');

try {
  // Check if we're in a git repository
  try {
    execSync('git status', { stdio: 'ignore' });
    console.log('✅ Git repository detected');
  } catch (error) {
    console.log('📦 Initializing Git repository...');
    execSync('git init', { stdio: 'inherit' });
    console.log('✅ Git repository initialized');
  }

  // Add all files
  console.log('📁 Adding files to Git...');
  execSync('git add .', { stdio: 'inherit' });

  // Commit changes
  console.log('💾 Committing changes...');
  try {
    execSync('git commit -m "Deploy QuantumSafe to GitHub Pages"', { stdio: 'inherit' });
    console.log('✅ Changes committed successfully');
  } catch (error) {
    console.log('ℹ️  No changes to commit or already committed');
  }

  // Build the project
  console.log('🔨 Building project for production...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');

  // Create gh-pages branch and deploy
  console.log('🌐 Deploying to GitHub Pages...');
  
  // Copy dist contents to a temporary location
  const tempDir = path.join(__dirname, 'temp-deploy');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Copy dist contents
  execSync(`cp -r dist/* ${tempDir}/`, { stdio: 'inherit' });
  
  // Switch to gh-pages branch
  try {
    execSync('git checkout gh-pages', { stdio: 'ignore' });
  } catch (error) {
    execSync('git checkout -b gh-pages', { stdio: 'inherit' });
  }
  
  // Clear current contents (except .git)
  const files = fs.readdirSync('.');
  files.forEach(file => {
    if (file !== '.git' && file !== 'temp-deploy') {
      fs.rmSync(file, { recursive: true, force: true });
    }
  });
  
  // Copy built files
  execSync(`cp -r ${tempDir}/* .`, { stdio: 'inherit' });
  
  // Add and commit
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages"', { stdio: 'inherit' });
  
  // Push to GitHub
  execSync('git push origin gh-pages --force', { stdio: 'inherit' });
  
  // Switch back to main branch
  execSync('git checkout main', { stdio: 'inherit' });
  
  // Clean up
  fs.rmSync(tempDir, { recursive: true, force: true });
  
  console.log('🎉 Deployment completed successfully!');
  console.log('🌐 Your site will be available at: https://[username].github.io/QuantumSafe/');
  console.log('📝 Make sure to enable GitHub Pages in your repository settings');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}