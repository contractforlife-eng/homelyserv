import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '1241150265756292';
const FB_API_VERSION = 'v20.0';

const INITIAL_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  || process.env.FACEBOOK_ACCESS_TOKEN
  || 'EAAZAxqASfTHIBSXea1IsmeofCshZBHlRBuqsxKeHzxPyd7eVZA1kvhBDTAXRIs198ISVPah1MnZANBkGANkzHxXfEebVuL53MiHmB1j9WxsXheuvcPDmKJoHMUFpFapqZBRN5Up03IZA1gOhOrgrGc8DVmbZC1FYMWoWkjpjOHhtfAm8E9s30ErqeN15oNwayZCrakX0gSIy4kuH2tcxZCXtgaqrIM5OsMdXBqpJOsvZAhMyQb8nzWfMEXBKZBECq1HYRJjwR8MabWKUAvPHDacPvHhTkduszdbHoeMjEdHAxwoZCxpzX34et5u8jTMPZCf93ZCcZC9ezMrDxT0';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL_NAME = 'gemini-3.6-flash';

/**
 * Generates an engaging Arabic marketing post for HomelyServ using Gemini.
 */
async function generateMarketingPost() {
  if (!API_KEY) {
    throw new Error('Neither GEMINI_API_KEY nor GOOGLE_API_KEY is set in environment variables.');
  }

  console.log(`🤖 Initializing Gemini AI with model: ${MODEL_NAME}...`);
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `اكتب منشوراً تسويقياً جذاباً وقصيراً واحترافياً باللغة العربية لمنصة HomelyServ (هوملي سيرف).
المنصة تقدم خدمات صيانة المنازل، النظافة المنزلية، السباكة، الكهرباء، والتنظيف الشامل عبر عمالة موثوقة ومحترفة.
المطلوب:
- لغة عربية سليمة وجذابة مع استخدام إيموجي مناسبة.
- تسليط الضوء على راحة البال، الجودة العالية، وسهولة الطلب عبر التطبيق أو الموقع الإلكتروني (https://homelyserv.com).
- دعوة واضحة لاتخاذ إجراء (Call to Action) ورابط الموقع.
- عدد من الهاشتاجات ذات الصلة في النهاية مثل #HomelyServ #خدمات_منزلية #صيانة_منازل #نظافة.
- أخرج نص المنشور فقط بدون أي مقدمات أو تعليقات إضافية.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  const postText = response?.text?.trim();
  if (!postText) {
    throw new Error(`Received empty content from Gemini AI model "${MODEL_NAME}".`);
  }

  console.log(`✅ Successfully generated content using ${MODEL_NAME}`);
  return postText;
}

/**
 * Inspects token identity, permissions, and resolves the correct Page Access Token if a User Token was provided.
 */
async function resolveFacebookSession(token) {
  console.log('🔍 Inspecting Meta token identity and permissions...');
  let resolvedToken = token;
  let targetId = FB_PAGE_ID;
  let isPageToken = false;

  try {
    // 1. Check Identity
    const meRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/me?fields=id,name,category,tasks&access_token=${encodeURIComponent(token)}`);
    const meData = await meRes.json();

    if (meData.error) {
      console.warn(`⚠️ Token identity check notice: [${meData.error.code}] ${meData.error.message}`);
    } else {
      console.log(`👤 Token Subject: "${meData.name}" (ID: ${meData.id}) | Category: ${meData.category || 'User/Admin'}`);
      if (meData.category || meData.id === FB_PAGE_ID) {
        isPageToken = true;
      }
    }

    // 2. Check Permissions
    const permRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/me/permissions?access_token=${encodeURIComponent(token)}`);
    const permData = await permRes.json();
    if (permData?.data && Array.isArray(permData.data)) {
      const granted = permData.data.filter(p => p.status === 'granted').map(p => p.permission);
      console.log(`📋 Active Granted Permissions: [${granted.join(', ')}]`);
    }

    // 3. If User Token, attempt to discover and exchange for the Page Access Token via /me/accounts
    if (!isPageToken) {
      console.log(`🔄 Checking for managed Page tokens via /me/accounts...`);
      const accountsRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/me/accounts?fields=id,name,access_token,tasks&access_token=${encodeURIComponent(token)}`);
      const accountsData = await accountsRes.json();

      if (accountsData?.data && Array.isArray(accountsData.data) && accountsData.data.length > 0) {
        const matchingPage = accountsData.data.find(page => page.id === FB_PAGE_ID) || accountsData.data[0];
        if (matchingPage?.access_token) {
          console.log(`✨ Discovered Page Access Token for "${matchingPage.name}" (ID: ${matchingPage.id})!`);
          resolvedToken = matchingPage.access_token;
          targetId = matchingPage.id;
          isPageToken = true;
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️ Token inspection encountered a non-fatal warning: ${err.message}`);
  }

  return { token: resolvedToken, targetId, isPageToken };
}

/**
 * Attempts to post to a specified Graph API endpoint.
 */
async function postToEndpoint(endpointUrl, token, message) {
  const params = new URLSearchParams();
  params.append('message', message);
  params.append('published', 'true');
  params.append('access_token', token);

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': `Bearer ${token}`,
    },
    body: params.toString(),
  });

  const data = await response.json();
  return { ok: response.ok && !data.error, status: response.status, data };
}

/**
 * Publishes the generated text post to Facebook with automatic fallback between Page Feed and User/Me Feed.
 * @param {string} message
 */
async function publishToFacebook(message) {
  const { token, targetId, isPageToken } = await resolveFacebookSession(INITIAL_TOKEN);

  const primaryEndpoint = `https://graph.facebook.com/${FB_API_VERSION}/${targetId}/feed`;
  console.log(`📤 Attempting to post to primary endpoint: ${primaryEndpoint}...`);

  const primaryAttempt = await postToEndpoint(primaryEndpoint, token, message);

  if (primaryAttempt.ok) {
    return primaryAttempt.data;
  }

  console.warn(`\n⚠️ Primary endpoint returned an error:`);
  console.warn(JSON.stringify(primaryAttempt.data?.error || primaryAttempt.data, null, 2));

  // If primary fails with OAuthException (#200), try fallback to /me/feed
  const fallbackEndpoint = `https://graph.facebook.com/${FB_API_VERSION}/me/feed`;
  console.log(`\n🔄 Attempting fallback endpoint: ${fallbackEndpoint}...`);

  const fallbackAttempt = await postToEndpoint(fallbackEndpoint, token, message);

  if (fallbackAttempt.ok) {
    console.log(`✅ Fallback /me/feed succeeded!`);
    return fallbackAttempt.data;
  }

  // If both attempts fail, construct detailed diagnostic summary
  const primaryError = primaryAttempt.data?.error || {};
  const fallbackError = fallbackAttempt.data?.error || {};

  const errorSummary = `
================ META PERMISSION DIAGNOSTIC ================
Primary Endpoint Error:
- URL: ${primaryEndpoint}
- Message: ${primaryError.message || 'Unknown'}
- Code: ${primaryError.code} | Subcode: ${primaryError.error_subcode || 'N/A'} | Type: ${primaryError.type}
- FBTrace: ${primaryError.fbtrace_id || 'N/A'}

Fallback Endpoint Error:
- URL: ${fallbackEndpoint}
- Message: ${fallbackError.message || 'Unknown'}
- Code: ${fallbackError.code} | Subcode: ${fallbackError.error_subcode || 'N/A'} | Type: ${fallbackError.type}
- FBTrace: ${fallbackError.fbtrace_id || 'N/A'}

Resolution Guide:
If receiving error code 200 (OAuthException), Meta requires the token to have:
1. For Page Posts: Generate a Page Access Token with 'pages_manage_posts' and 'pages_read_engagement'.
2. In Graph API Explorer: Select your Page under "User or Page", add 'pages_manage_posts', and click "Generate Access Token".
============================================================`;

  throw new Error(errorSummary);
}

/**
 * Main execution function.
 */
async function main() {
  console.log('====================================================');
  console.log('🚀 Starting HomelyServ Daily Facebook Post Automation');
  console.log('====================================================');

  try {
    // 1. Content generation
    console.log('📝 Generating promotional post content in Arabic...');
    const postContent = await generateMarketingPost();

    console.log('\n--- Generated Post Content ---');
    console.log(postContent);
    console.log('-------------------------------\n');

    // 2. Publishing to Facebook
    const fbResult = await publishToFacebook(postContent);

    console.log('✅ Successfully published post to Facebook!');
    console.log(`📌 Post ID: ${fbResult.id || 'N/A'}`);
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ Error executing Facebook post automation:');
    console.error(error.message || error);
    console.log('====================================================');
    process.exit(1);
  }
}

main();
