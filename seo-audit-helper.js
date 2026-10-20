const axios = require('./frontend/node_modules/axios');

const URLs = [
  'https://www.homelyserv.com/robots.txt',
  'https://www.homelyserv.com/sitemap.xml',
  'https://www.homelyserv.com/',
  'https://www.homelyserv.com/about',
  'https://www.homelyserv.com/contact',
  'https://www.homelyserv.com/refund-policy',
];

async function check() {
  for (const url of URLs) {
    try {
      console.log('\n=== ' + url + ' ===');
      const res = await axios.get(url, {
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        headers: { 'User-Agent': 'SEO-Audit/1.0 (read-only)' }
      });
      console.log('Status:', res.status);
      console.log('Final URL:', res.config.url);
      console.log('Headers:');
      for (const [key, val] of Object.entries(res.headers)) {
        if (key.toLowerCase().match(/cache|content-type|location|referrer|server|x-/i)) {
          console.log('  ' + key + ':', val);
        }
      }
      if (res.data) {
        const preview = res.data.substring(0, 2000).replace(/\n/g, ' ');
        console.log('Body (first 2000 chars):', preview);
      }
    } catch (err) {
      console.log('ERROR for', url, ':', err.message);
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Headers:', JSON.stringify(err.response.headers, null, 2).substring(0, 500));
        console.log('Data:', err.response.data?.substring(0, 500));
      }
    }
  }
}

check().catch(console.error);
