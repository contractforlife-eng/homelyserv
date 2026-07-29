const fs = require('fs');
const content = fs.readFileSync('C:/Users/User/Documents/GitHub/homelyserv/frontend/src/pages/PaymentOptions.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('employerId') || line.includes('workerId') || line.includes('user_') || line.includes('commission')) {
    console.log((i+1) + ': ' + line.trim());
  }
});