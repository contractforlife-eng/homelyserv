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
  'backend/src/routes/oauth.js'
];
for (const f of files) {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    // Strip trailing XML artifact tags
    c = c.replace(/<\/arg_value>\s*\u6211\u4eec\s*$/, '');
    c = c.replace(/<\/arg_value>\s*[\s\S]*$/, (m) => {
      // Only strip if it's at the very end after the last valid code
      return '';
    });
    // More targeted: remove lines that are just XML tags
    const lines = c.split('\n');
    const cleaned = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('</arg_value>') && !trimmed.startsWith('</tool_call>') && !trimmed.startsWith('</arg_value>');
    });
    c = cleaned.join('\n');
    fs.writeFileSync(f, c);
    console.log('Cleaned:', f);
  }
}
console.log('Done.');