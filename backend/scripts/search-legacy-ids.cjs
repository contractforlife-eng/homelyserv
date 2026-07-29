const fs = require('fs');
const path = require('path');

function searchFiles(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.git') {
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

const patterns = [
  { name: 'user_ string concat', re: /['"]user_['"]\s*\+/ },
  { name: 'user_ template literal', re: /`user_/ },
  { name: 'user_ prefix variable', re: /prefix.*user_|user_.*prefix/ },
  { name: 'userId plus string', re: /userId\s*\+\s*['"]/ },
  { name: 'string plus userId', re: /['"]\s*\+\s*userId/ },
  { name: 'user_ in payment context', re: /user_.*payment|payment.*user_/ },
  { name: 'legacy ID generation', re: /legacy.*id|id.*legacy/ },
  { name: 'timestamp ID', re: /user_\d{13}/ },
];

for (const { name, re } of patterns) {
  const files = searchFiles(projectRoot, re);
  if (files.length > 0) {
    console.log(`=== ${name} ===`);
    files.forEach(f => console.log('  ', f));
    console.log();
  }
}