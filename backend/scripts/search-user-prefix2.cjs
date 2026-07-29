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

const patterns = [
  { name: 'startsWith user_', re: /startsWith\(['"]user_/ },
  { name: 'user_ in query', re: /user_.*find|find.*user_/ },
  { name: 'user_ in where', re: /where.*user_|user_.*where/ },
  { name: 'user_ in Prisma', re: /prisma.*user_|user_.*prisma/ },
  { name: 'user_ in payment', re: /payment.*user_|user_.*payment/ },
  { name: 'user_ in employer', re: /employer.*user_|user_.*employer/ },
  { name: 'user_ in worker', re: /worker.*user_|user_.*worker/ },
  { name: 'user_ in ID', re: /id.*user_|user_.*id/ },
  { name: 'user_ in ID field', re: /employerId.*user_|workerId.*user_/ },
];

for (const pattern of patterns) {
  const files = searchFiles(projectRoot, pattern.re);
  if (files.length > 0) {
    console.log('=== ' + pattern.name + ' ===');
    files.forEach(f => console.log('  ', f));
    console.log();
  }
}