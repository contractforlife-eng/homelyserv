const fs = require('fs');
const path = require('path');

function searchFiles(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.git' && file.name !== 'dist' && file.name !== 'build') {
        results.push(...searchFiles(fullPath, pattern));
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(file.name)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (pattern.test(content)) {
          results.push(fullPath);
        }
      } catch (e) {}
    }
  }
  return results;
}

const projectRoot = 'C:/Users/User/Documents/GitHub/homelyserv';

// Search for any code that generates user_ prefixed IDs
const patterns = [
  { name: 'user_ prefix in any form', re: /user_/ },
  { name: 'Date.now with prefix', re: /Date\.now.*user_|user_.*Date\.now/ },
  { name: 'template with user_', re: /`user_/ },
  { name: 'string concat with user_', re: /['"]user_['"]\s*\+/ },
  { name: 'userId with prefix', re: /user_Id|userId.*prefix|prefix.*userId/ },
];

for (const { name, re } of patterns) {
  const files = searchFiles(projectRoot, re);
  if (files.length > 0) {
    console.log(`=== ${name} ===`);
    files.forEach(f => console.log('  ', f));
    console.log();
  }
}

// Also check if there's any code that converts IDs to user_ format
console.log('=== Checking paymentService.js for ID conversion ===');
const paymentService = fs.readFileSync('C:/Users/User/Documents/GitHub/homelyserv/frontend/src/services/paymentService.js', 'utf8');
const psLines = paymentService.split('\n');
psLines.forEach((line, i) => {
  if (line.includes('user_') || line.includes('employerId') || line.includes('workerId') || line.includes('userId') || line.includes('Date.now') || line.includes('id') && line.includes('+')) {
    console.log((i+1) + ': ' + line.trim());
  }
});