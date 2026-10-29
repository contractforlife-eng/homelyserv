const configuredCloudName = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'homelyserv';

export const isTrustedComplaintAttachmentUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hostname !== 'res.cloudinary.com') return false;
    const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (segments[0] !== configuredCloudName || segments[1] !== 'image' || segments[2] !== 'upload') return false;
    const folderIndex = /^v\d+$/.test(segments[3] || '') ? 4 : 3;
    return segments.slice(folderIndex, folderIndex + 2).join('/') === 'homelyserv/complaints';
  } catch { return false; }
};

export const trustedComplaintAttachments = (attachments) =>
  Array.isArray(attachments) ? attachments.filter(isTrustedComplaintAttachmentUrl) : [];
