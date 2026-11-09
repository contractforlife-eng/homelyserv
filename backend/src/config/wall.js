export const DEFAULT_WALL_GIFTS = [
  { id: 'rose', emoji: '🌹', price: 100 },
  { id: 'red_heart', emoji: '❤️', price: 120 },
  { id: 'green_heart', emoji: '💚', price: 140 },
  { id: 'blue_heart', emoji: '💙', price: 160 },
  { id: 'white_heart', emoji: '🤍', price: 180 },
  { id: 'flag', emoji: '🏳️', price: 200 },
  { id: 'slap', emoji: '🫲', price: 250 },
  { id: 'chocolate', emoji: '🍫', price: 300 },
  { id: 'eagle', emoji: '🦅', price: 350 },
  { id: 'sunflower', emoji: '🌻', price: 400 },
  { id: 'applause', emoji: '👏', price: 450 },
  { id: 'teddy', emoji: '🧸', price: 600 },
  { id: 'perfume', emoji: '🧴', price: 750 },
  { id: 'ring', emoji: '💍', price: 850 },
  { id: 'pearl', emoji: '🦪', price: 1000 },
  { id: 'diamond', emoji: '💎', price: 1200 },
  { id: 'royal_crown', emoji: '👑', price: 1800 },
  { id: 'lion', emoji: '🦁', price: 2500 },
  { id: 'phoenix', emoji: '🐦‍🔥', price: 3200 },
  { id: 'rocket', emoji: '🚀', price: 4000 },
  { id: 'sports_car', emoji: '🏎️', price: 5000 },
  { id: 'castle', emoji: '🏰', price: 6500 },
  { id: 'yacht', emoji: '🛥️', price: 8500 },
  { id: 'galaxy', emoji: '🌌', price: 12000 },
];
export const MIN_WALL_GIFT_PRICE = 100;

export function dinarPurchase(value) {
  const raw = String(value ?? '');
  const quantity = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
    throw Object.assign(new Error('INVALID_QUANTITY'), { status: 400 });
  }
  return { quantity, amount: quantity / 10, currency: 'EGP' };
}

export function wallCrown(count = 0) {
  return { level: count >= 500 ? 4 : count >= 250 ? 3 : count >= 100 ? 2 : count >= 50 ? 1 : 0,
    gems: count >= 1000 ? Math.floor((count - 500) / 500) : 0, gifts: count };
}

export function validateWallText(value, hasMedia = false) {
  const text = String(value ?? '').trim();
  if ((!text && !hasMedia) || text.length > 15000 || (text && text.split(/\s+/u).length > 500)) {
    throw Object.assign(new Error('INVALID_CONTENT'), { status: 400 });
  }
  return text;
}
