const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const cardConfigs = [
  {
    lang: 'ar',
    dir: 'rtl',
    font: 'Cairo',
    tag: 'وظيفة شاغرة • تقديم مباشر',
    message: 'تقدّم إلى الوظيفة مجانًا الآن — بدون رسوم',
    sub: 'منصة الخدمات المنزلية والتوظيف الموثوقة'
  },
  {
    lang: 'en',
    dir: 'ltr',
    font: 'Inter',
    tag: 'Job Opening • Direct Application',
    message: 'Apply to this job for free now — No fees',
    sub: 'Trusted Home Services & Job Opportunities'
  },
  {
    lang: 'fr',
    dir: 'ltr',
    font: 'Inter',
    tag: 'Offre d\'emploi • Candidature directe',
    message: 'Postulez à cette offre gratuitement dès maintenant — Sans frais',
    sub: 'Services à domicile et opportunités d\'emploi fiables'
  },
  {
    lang: 'de',
    dir: 'ltr',
    font: 'Inter',
    tag: 'Stellenangebot • Direktbewerbung',
    message: 'Jetzt kostenlos auf diesen Job bewerben — Keine Gebühren',
    sub: 'Vertrauenswürdige Haushaltsdienste & Stellenangebote'
  },
  {
    lang: 'ru',
    dir: 'ltr',
    font: 'Inter',
    tag: 'Вакансия • Прямой отклик',
    message: 'Откликнитесь на вакансию бесплатно прямо сейчас — Без комиссий',
    sub: 'Надёжные бытовые услуги и возможности трудоустройства'
  },
  {
    lang: 'tr',
    dir: 'ltr',
    font: 'Inter',
    tag: 'İş İlanı • Doğrudan Başvuru',
    message: 'Bu işe hemen ücretsiz başvurun — Hiçbir ücret yok',
    sub: 'Güvenilir Ev Hizmetleri ve İş Fırsatları'
  }
];

const markBase64 = fs.readFileSync('frontend/src/assets/branding/homelyserv-mark-dark.png').toString('base64');
const markDataUri = 'data:image/png;base64,' + markBase64;

for (const config of cardConfigs) {
  const html = `<!DOCTYPE html>
<html lang="${config.lang}" dir="${config.dir}">
<head>
<meta charset="utf-8">
<style>
  @import url("https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Inter:wght@600;700;800&display=swap");
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: linear-gradient(135deg, #0b1120 0%, #172554 45%, #0f172a 100%);
    color: #ffffff;
    font-family: "${config.font}", sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px 80px;
    position: relative;
    overflow: hidden;
  }
  .bg-glow-red {
    position: absolute;
    top: -120px;
    ${config.dir === 'rtl' ? 'left: -80px;' : 'right: -80px;'}
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(220, 38, 38, 0.28) 0%, rgba(220, 38, 38, 0) 70%);
    border-radius: 50%;
  }
  .bg-glow-teal {
    position: absolute;
    bottom: -140px;
    ${config.dir === 'rtl' ? 'right: -60px;' : 'left: -60px;'}
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(13, 148, 136, 0.22) 0%, rgba(13, 148, 136, 0) 70%);
    border-radius: 50%;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }
  .brand-group {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .logo-img {
    width: 68px;
    height: 68px;
    border-radius: 16px;
    box-shadow: 0 10px 25px -4px rgba(220, 38, 38, 0.5);
  }
  .brand-name {
    font-family: "Inter", sans-serif;
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
  }
  .brand-domain {
    font-family: "Inter", sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #f87171;
    margin-top: 2px;
  }
  .badge-tag {
    background: rgba(220, 38, 38, 0.18);
    border: 1.5px solid rgba(220, 38, 38, 0.5);
    padding: 10px 22px;
    border-radius: 999px;
    color: #fca5a5;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  .content {
    z-index: 10;
    margin: auto 0;
  }
  .headline {
    font-size: 52px;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
    text-shadow: 0 4px 20px rgba(0,0,0,0.45);
    max-width: 1040px;
  }
  .subhead {
    margin-top: 18px;
    font-size: 22px;
    color: #94a3b8;
    font-weight: 600;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.14);
    padding-top: 22px;
    z-index: 10;
  }
  .domain-url {
    font-family: "Inter", sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #38bdf8;
  }
  .action-call {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #dc2626;
    color: #ffffff;
    padding: 10px 24px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 700;
    box-shadow: 0 8px 20px -3px rgba(220, 38, 38, 0.5);
  }
</style>
</head>
<body>
  <div class="bg-glow-red"></div>
  <div class="bg-glow-teal"></div>
  <div class="header">
    <div class="brand-group">
      <img class="logo-img" src="${markDataUri}" alt="Logo" />
      <div>
        <div class="brand-name">HomelyServ</div>
        <div class="brand-domain">www.homelyserv.com</div>
      </div>
    </div>
    <div class="badge-tag">${config.tag}</div>
  </div>
  <div class="content">
    <h1 class="headline">${config.message}</h1>
    <p class="subhead">${config.sub}</p>
  </div>
  <div class="footer">
    <div class="domain-url">homelyserv.com</div>
    <div class="action-call">
      <span>HomelyServ</span>
    </div>
  </div>
</body>
</html>`;

  const tmpHtmlPath = path.resolve(`temp_card_${config.lang}.html`);
  const outPngPath = path.resolve(`frontend/public/social/job-share-${config.lang}.png`);
  fs.writeFileSync(tmpHtmlPath, html, 'utf8');

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=C:\\Users\\User\\AppData\\Local\\Temp\\chrome_snap_card_${config.lang}_${Date.now()}`,
    `--screenshot=${outPngPath}`,
    '--window-size=1200,630',
    `file:///${tmpHtmlPath.replace(/\\/g, '/')}`
  ];

  try {
    execFileSync(chromePath, args);
    console.log(`Generated ${outPngPath}, size: ${fs.statSync(outPngPath).size} bytes`);
  } catch (err) {
    console.error(`Failed ${config.lang}:`, err.message);
  } finally {
    if (fs.existsSync(tmpHtmlPath)) fs.unlinkSync(tmpHtmlPath);
  }
}
console.log('Finished card generation.');
