const fs = require('fs');
const path = require('path');

// English terms to search for (previously Arabic)
const searchTerms = [
  'service', 'configuration', 'prices', 'types', 'account', 
  'start', 'process', 'verification', 'processing', 'getting', 
  'scan', 'functions', 'help'
];

function searchInFile(filePath, terms) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return terms.some(term => content.includes(term));
  } catch (error) {
    return false;
  }
}

function findFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            traverse(fullPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  traverse(dir);
  return files;
}

// Find all .md and .txt files
const files = findFiles('.', ['.md', '.txt']);

// Search for English terms in each file
const matchingFiles = files.filter(file => searchInFile(file, searchTerms));

// Display results (limit to 10 as in original command)
const results = matchingFiles.slice(0, 10);

if (results.length > 0) {
  console.log('Files containing English terms:');
  results.forEach(file => console.log(file));
} else {
  console.log('No files found containing the specified English terms.');
}

console.log(`\nSearched ${files.length} files total.`);