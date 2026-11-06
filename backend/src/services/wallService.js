import mongoose from 'mongoose';
import { WallWallet, WallEntry, WallSettings } from '../models/Wall.js';
import { DEFAULT_WALL_GIFTS, MIN_WALL_GIFT_PRICE, dinarPurchase } from '../config/wall.js';

export async function wallGifts() {
  const settings = await WallSettings.findById('gifts').lean();
  return DEFAULT_WALL_GIFTS.map(gift => ({ ...gift, price: Math.max(MIN_WALL_GIFT_PRICE, (settings?.pricingVersion === 3 ? settings?.prices?.[gift.id] : null) ?? gift.price) }));
}

// The balance mutation and unique ledger entry commit together. Retried callbacks
// cannot credit twice; an interrupted transaction cannot lose a credit.
export async function fulfillDinarPayment(payment) {
  if (payment?.purpose !== 'DINAR_PURCHASE' || payment.status !== 'completed' || !payment.userId) throw new Error('INVALID_DINAR_PAYMENT');
  const { quantity, amount } = dinarPurchase(payment.metadata?.dinarQuantity);
  const currency = payment.paymentMethod === 'bank_transfer' ? payment.metadata?.canonicalCurrency : payment.currency;
  const paidAmount = payment.paymentMethod === 'bank_transfer' ? payment.metadata?.canonicalAmount : payment.amount;
  if (currency !== 'EGP' || Number(paidAmount) !== amount) throw new Error('INVALID_DINAR_AMOUNT');
  const key = `purchase:${payment.id}`;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (await WallEntry.exists({ key }).session(session)) return;
      await WallEntry.create([{ key, type: 'PURCHASE', userId: String(payment.userId), quantity, paymentId: payment.id }], { session });
      await WallWallet.updateOne({ _id: String(payment.userId) }, { $inc: { balance: quantity } }, { session, upsert: true });
    });
  } catch (error) {
    if (error.code !== 11000 || !await WallEntry.exists({ key, userId: String(payment.userId) })) throw error;
  } finally { await session.endSession(); }
}
