const fs = require('fs');
const path = require('path');

// Arabic terms to search for
const arabicTerms = [
  'خدمة', 'تكوين', 'أسعار', 'أنواع', 'حساب', 
  'بدء', 'عملية', 'التحقق', 'معالجة', 'الحصول', 
  'فحص', 'دوال', 'مساعدة'
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

// Search for Arabic terms in each file
const matchingFiles = files.filter(file => searchInFile(file, arabicTerms));

// Display results (limit to 10 as in original command)
const results = matchingFiles.slice(0, 10);

if (results.length > 0) {
  console.log('Files containing Arabic terms:');
  results.forEach(file => console.log(file));
} else {
  console.log('No files found containing the specified Arabic terms.');
}

console.log(`\nSearched ${files.length} files total.`);