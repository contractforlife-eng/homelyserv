import { WallContent, WallEntry } from '../models/Wall.js';
import User from '../models/User.js';
import { reconcileWallReports } from './wallReportService.js';
import { createNotification } from './notificationService.js';

const COPY = {
  ar: ['هدية جديدة على الحائط', 'تعليق جديد على بوستك', name => `${name} أرسل لك هدية`, name => `${name} علّق على بوستك`],
  en: ['A new Wall gift', 'A new comment on your post', name => `${name} sent you a gift`, name => `${name} commented on your post`],
  fr: ['Un nouveau cadeau', 'Un nouveau commentaire', name => `${name} vous a envoyé un cadeau`, name => `${name} a commenté votre publication`],
  de: ['Ein neues Geschenk', 'Ein neuer Kommentar', name => `${name} hat dir ein Geschenk gesendet`, name => `${name} hat deinen Beitrag kommentiert`],
  ru: ['Новый подарок', 'Новый комментарий', name => `${name} отправил(а) вам подарок`, name => `${name} прокомментировал(а) вашу публикацию`],
  tr: ['Yeni bir hediye', 'Yeni bir yorum', name => `${name} sana bir hediye gönderdi`, name => `${name} gönderine yorum yaptı`],
};
export function wallNotificationPayload(kind, item, senderName, language = 'en') {
  const gift = kind === 'GIFT';
  const copy = COPY[language] || COPY.en;
  return { type: gift ? 'WALL_GIFT' : 'WALL_COMMENT', title: copy[gift ? 0 : 1], message: copy[gift ? 2 : 3](senderName),
    icon: gift ? (item.giftEmoji || '🎁') : '💬', entityType: 'WALL_POST', entityId: String(item.postId),
    link: `/wall?post=${item.postId}${gift ? '' : `&comment=${item._id}`}`,
    eventKey: `wall:${kind.toLowerCase()}:${item._id}`,
    data: { postId: String(item.postId), actorId: String(gift ? item.userId : item.authorId), ...(gift ? { giftId: item.giftId } : { commentId: String(item._id) }) } };
}

let running = false;
export async function reconcileWallNotifications() {
  if (running) return;
  running = true;
  try {
    const [gifts, comments] = await Promise.all([
      WallEntry.find({ type: 'GIFT', notificationHandedOff: { $ne: true } }).sort({ _id: 1 }).limit(100).lean(),
      WallContent.find({ postId: { $ne: null }, notificationRecipientId: { $nin: [null, ''] }, notificationHandedOff: { $ne: true }, deleted: false }).sort({ _id: 1 }).limit(100).lean(),
    ]);
    for (const [kind, items, model] of [['GIFT', gifts, WallEntry], ['COMMENT', comments, WallContent]]) {
      for (const item of items) {
        const recipientId = kind === 'GIFT' ? item.recipientId : item.notificationRecipientId;
        const actorId = kind === 'GIFT' ? item.userId : item.authorId;
        if (!recipientId || recipientId === actorId) { await model.updateOne({ _id: item._id }, { $set: { notificationHandedOff: true } }); continue; }
        try {
          const [sender, recipient] = await Promise.all([User.findById(actorId).select('fullName').lean(), User.findById(recipientId).select('language').lean()]);
          const notification = await createNotification(recipientId, wallNotificationPayload(kind, item, sender?.fullName || 'HomelyServ', recipient?.language));
          if (notification) await model.updateOne({ _id: item._id }, { $set: { notificationHandedOff: true } });
        } catch (error) { console.error('Wall notification retry pending:', error.name); }
      }
    }
  } finally { running = false; }
}
let timer;
export function startWallNotificationWorker() {
  if (timer) return;
  const run = () => Promise.all([reconcileWallNotifications(), reconcileWallReports()]).catch(error => console.error('Wall notification worker:', error.name));
  run(); timer = setInterval(run, 15000); timer.unref?.();
}
