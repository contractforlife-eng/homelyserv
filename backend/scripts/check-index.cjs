const fs = require('fs');
const content = fs.readFileSync('C:/Users/User/Documents/GitHub/homelyserv/backend/src/index.js', 'utf8');
const lines = content.split('\n');
let count = 0;
lines.forEach((line, i) => {
  if ((line.includes('user_') || line.includes('legacy') || line.includes('timestamp') || line.includes('Date.now') || line.includes('employerId') || line.includes('workerId')) && count < 30) {
    console.log((i+1) + ': ' + line.trim());
    count++;
  }
});