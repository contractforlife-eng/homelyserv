// backend/src/templates/baseTemplate.js
// ============================================================
// BASE EMAIL TEMPLATE - HomelyServ Branding
// ============================================================
// Reusable HTML email template with HomelyServ branding
// Red/white color scheme, responsive, mobile-friendly
// ============================================================

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - User-generated text to escape
 * @returns {string} - Escaped text safe for HTML rendering
 */
const escapeHtml = (text) => {
  if (!text) return '';
  
  const map = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Build base email template with HomelyServ branding
 * @param {Object} options - Template options
 * @param {string} options.title - Email title (appears in header)
 * @param {string} options.previewText - Preview text (for email clients)
 * @param {string} options.content - Main HTML content
 * @param {Object} [options.actionButton] - Optional CTA button
 * @param {string} [options.actionButton.text] - Button text
 * @param {string} [options.actionButton.url] - Button URL
 * @param {string} [options.footerNote] - Optional footer note
 * @returns {string} - Complete HTML email
 */
export const buildBaseEmail = ({
  title,
  previewText,
  content,
  actionButton = null,
  footerNote = null
}) => {
  // Escape all user-generated content
  const safeTitle = escapeHtml(title);
  const safePreviewText = escapeHtml(previewText);
  const safeContent = content; // Content should already be escaped by caller
  const safeFooterNote = footerNote ? escapeHtml(footerNote) : null;
  
  // Build action button HTML
  const actionButtonHtml = actionButton ? `
    <tr>
      <td style="padding: 30px 0; text-align: center;">
        <a href="${escapeHtml(actionButton.url)}" 
           style="display: inline-block; 
                  padding: 14px 32px; 
                  background-color: #dc2626; 
                  color: #ffffff; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: 600; 
                  font-size: 16px;
                  font-family: Arial, sans-serif;">
          ${escapeHtml(actionButton.text)}
        </a>
      </td>
    </tr>
  ` : '';

  // Build footer note HTML
  const footerNoteHtml = footerNote ? `
    <tr>
      <td style="padding: 20px 40px 0; text-align: center; font-size: 13px; color: #6b7280; font-family: Arial, sans-serif;">
        ${safeFooterNote}
      </td>
    </tr>
  ` : '';

  // Complete HTML email template
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <x:OfficeOfficeSettings>
        <x:PixelsPerInch>96</x:PixelsPerInch>
      </x:OfficeOfficeSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">

  <!-- Email Container -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Red Background -->
          <tr>
            <td style="background-color: #dc2626; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; font-family: Arial, sans-serif; letter-spacing: -0.5px;">
                HomelyServ
              </h1>
              <p style="margin: 8px 0 0; color: #fef2f2; font-size: 14px; font-family: Arial, sans-serif;">
                ${safePreviewText}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              ${safeContent}
              
              <!-- Action Button -->
              ${actionButtonHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Note -->
          ${footerNoteHtml}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; font-family: Arial, sans-serif;">
                &copy; ${new Date().getFullYear()} <strong style="color: #111827;">HomelyServ</strong>
              </p>
              <p style="margin: 0 0 5px; color: #6b7280; font-size: 13px; font-family: Arial, sans-serif;">
                <a href="mailto:support@homelyserv.com" style="color: #dc2626; text-decoration: none;">support@homelyserv.com</a>
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; font-family: Arial, sans-serif;">
                <a href="https://homelyserv.com" style="color: #dc2626; text-decoration: none;">https://homelyserv.com</a>
              </p>
              <p style="margin: 15px 0 0; color: #9ca3af; font-size: 11px; font-family: Arial, sans-serif; font-style: italic;">
                This email was sent automatically.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email Card -->

      </td>
    </tr>
  </table>
  <!-- /Email Container -->

</body>
</html>
  `;
};

/**
 * Build simple text content for email body
 * @param {string} text - Plain text content
 * @returns {string} - HTML paragraph
 */
export const buildTextContent = (text) => {
  const safeText = escapeHtml(text);
  return `<p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">${safeText}</p>`;
};

/**
 * Build heading content
 * @param {string} text - Heading text
 * @param {number} level - Heading level (2 or 3)
 * @returns {string} - HTML heading
 */
export const buildHeading = (text, level = 2) => {
  const safeText = escapeHtml(text);
  const tag = level === 3 ? 'h3' : 'h2';
  const fontSize = level === 3 ? '20px' : '24px';
  
  return `<${tag} style="margin: 0 0 20px; color: #111827; font-size: ${fontSize}; font-weight: 700; font-family: Arial, sans-serif; line-height: 1.3;">${safeText}</${tag}>`;
};

export { escapeHtml };

export default {
  buildBaseEmail,
  buildTextContent,
  buildHeading,
};
