import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSocialCrawler,
  normalizeLang,
  renderJobPreviewHtml,
  SOCIAL_TEXTS,
} from '../backend/src/utils/jobSocialPreview.js';

test('isSocialCrawler detects major social bots and ignores regular browsers', () => {
  assert.equal(isSocialCrawler('facebookexternalhit/1.1'), true);
  assert.equal(isSocialCrawler('WhatsApp/2.21.12.21 A'), true);
  assert.equal(isSocialCrawler('Twitterbot/1.0'), true);
  assert.equal(isSocialCrawler('LinkedInBot/1.0'), true);
  assert.equal(isSocialCrawler('TelegramBot (like TwitterBot)'), true);
  assert.equal(isSocialCrawler('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'), false);
  assert.equal(isSocialCrawler(''), false);
  assert.equal(isSocialCrawler(null), false);
});

test('normalizeLang validates supported languages and defaults to ar', () => {
  assert.equal(normalizeLang('ar'), 'ar');
  assert.equal(normalizeLang('en'), 'en');
  assert.equal(normalizeLang('fr'), 'fr');
  assert.equal(normalizeLang('de'), 'de');
  assert.equal(normalizeLang('ru'), 'ru');
  assert.equal(normalizeLang('tr'), 'tr');
  assert.equal(normalizeLang('es'), 'ar');
  assert.equal(normalizeLang(''), 'ar');
  assert.equal(normalizeLang(null), 'ar');
});

test('renderJobPreviewHtml produces valid Open Graph HTML for each language', () => {
  const languages = ['ar', 'en', 'fr', 'de', 'ru', 'tr'];
  const job = { id: '6a786f0bec18be438d912b42', jobTitle: 'Senior Nanny' };
  const employer = { displayName: 'Rania Ahmed' };

  for (const lang of languages) {
    const html = renderJobPreviewHtml({ job, employer, lang });
    assert.match(html, /<meta property="og:title" content="Senior Nanny - Rania Ahmed \| HomelyServ"/);
    assert.match(html, new RegExp(`https://www.homelyserv.com/social/job-share-${lang}.png`));
    assert.match(html, /<meta property="og:image:width" content="1200"/);
    assert.match(html, /<meta property="og:image:height" content="630"/);
    assert.match(html, new RegExp(`https://www.homelyserv.com/job/6a786f0bec18be438d912b42\\?lang=${lang}`));
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
    assert.match(html, new RegExp(`<html lang="${lang}" dir="${SOCIAL_TEXTS[lang].dir}">`));
  }
});

test('renderJobPreviewHtml handles unavailable jobs gracefully', () => {
  const html = renderJobPreviewHtml({ job: null, employer: null, lang: 'ar' });
  assert.match(html, /الوظيفة غير متوفرة \| HomelyServ/);
  assert.match(html, /https:\/\/www.homelyserv.com\/social\/job-share-ar.png/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
});
