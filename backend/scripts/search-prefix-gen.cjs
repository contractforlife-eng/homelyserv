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

// Search for any code that generates prefixed IDs
const patterns = [
  { name: 'Date.now with string prefix', re: /['"`].*['"`]\s*\+\s*Date\.now|Date\.now\s*\+\s*['"`]/ },
  { name: 'user_ template literal', re: /`user_/ },
  { name: 'user_ string concat', re: /['"]user_['"]\s*\+/ },
  { name: 'prefix + Date.now', re: /prefix.*\+.*Date|Date.*\+.*prefix/ },
  { name: 'userId + string', re: /userId\s*\+\s*['"]/ },
  { name: 'string + userId', re: /['"]\s*\+\s*userId/ },
  { name: 'id + timestamp', re: /id\s*\+\s*Date|Date\s*\+\s*id/ },
  { name: 'any _ + Date.now', re: /_.*\+.*Date\.now|Date\.now.*\+.*_/ },
  { name: 'generateUserId or makeUserId', re: /generate.*[Uu]ser|make.*[Uu]ser|create.*[Uu]ser/ },
  { name: 'legacy or old ID', re: /legacy.*id|old.*id|previous.*id/ },
];

for (const { name, re } of patterns) {
  const files = searchFiles(projectRoot, re);
  if (files.length > 0) {
    console.log('=== ' + name + ' ===');
    files.forEach(f => console.log('  ', f));
    console.log();
  }
}