const fs = require('fs');
const files = [
  'backend/src/routes/workers.js',
  'backend/src/routes/employer.js',
  'backend/src/routes/admin.js',
  'backend/src/routes/support.js',
  'backend/src/index.js',
  'backend/src/controllers/authController.js',
  'backend/src/services/verificationService.js',
  'backend/src/services/emailService.js',
  'backend/src/routes/oauth.js',
  'backend/cleanup.js'
];
for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    const lines = c.split('\n');
    const cleaned = lines.filter(line => {
      const t = line.trim();
      // Remove lines that are XML artifact tags (start with < and end with >)
      return !(t.startsWith('<') && t.endsWith('>'));
    });
    c = cleaned.join('\n');
    fs.writeFileSync(f, c);
    console.log('Cleaned:', f);
  }
}
console.log('Done.');