const VERSION = 3;
const SIZE = VERSION * 4 + 17;
const DATA_CODEWORDS = 55;
const ECC_CODEWORDS = 15;

const gfExp = new Uint8Array(512);
const gfLog = new Uint8Array(256);

let value = 1;
for (let i = 0; i < 255; i += 1) {
  gfExp[i] = value;
  gfLog[value] = i;
  value <<= 1;
  if (value & 0x100) value ^= 0x11d;
}
for (let i = 255; i < gfExp.length; i += 1) gfExp[i] = gfExp[i - 255];

const multiply = (a, b) => (a && b ? gfExp[gfLog[a] + gfLog[b]] : 0);

const appendBits = (bits, valueToAppend, length) => {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((valueToAppend >>> i) & 1);
};

const reedSolomonDivisor = (degree) => {
  let result = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(result.length + 1).fill(0);
    result.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= multiply(coefficient, gfExp[i]);
    });
    result = next;
  }
  return result;
};

const reedSolomonRemainder = (data, divisor) => {
  const result = new Array(divisor.length - 1).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    divisor.slice(1).forEach((coefficient, index) => {
      result[index] ^= multiply(coefficient, factor);
    });
  });
  return result;
};

const toByteData = (text) => Array.from(new TextEncoder().encode(text));

const createCodewords = (text) => {
  const bytes = toByteData(text);
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));
  appendBits(bits, 0, Math.min(4, DATA_CODEWORDS * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  for (let pad = 0xec; data.length < DATA_CODEWORDS; pad ^= 0xec ^ 0x11) data.push(pad);

  return [...data, ...reedSolomonRemainder(data, reedSolomonDivisor(ECC_CODEWORDS))];
};

const createMatrix = () => ({
  modules: Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
  reserved: Array.from({ length: SIZE }, () => Array(SIZE).fill(false))
});

const setFunctionModule = (qr, row, column, dark) => {
  if (row >= 0 && row < SIZE && column >= 0 && column < SIZE) {
    qr.modules[row][column] = dark;
    qr.reserved[row][column] = true;
  }
};

const drawFinder = (qr, row, column) => {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 &&
        (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      setFunctionModule(qr, row + dy, column + dx, dark);
    }
  }
};

const drawAlignment = (qr, row, column) => {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunctionModule(qr, row + dy, column + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
};

const drawFunctionPatterns = (qr) => {
  drawFinder(qr, 0, 0);
  drawFinder(qr, 0, SIZE - 7);
  drawFinder(qr, SIZE - 7, 0);
  drawAlignment(qr, 22, 22);

  for (let i = 8; i < SIZE - 8; i += 1) {
    if (!qr.reserved[6][i]) setFunctionModule(qr, 6, i, i % 2 === 0);
    if (!qr.reserved[i][6]) setFunctionModule(qr, i, 6, i % 2 === 0);
  }
  setFunctionModule(qr, SIZE - 8, 8, true);

  for (let i = 0; i < 15; i += 1) {
    if (i < 6) setFunctionModule(qr, i, 8, false);
    else if (i < 8) setFunctionModule(qr, i + 1, 8, false);
    else setFunctionModule(qr, SIZE - 15 + i, 8, false);

    if (i < 8) setFunctionModule(qr, 8, SIZE - i - 1, false);
    else if (i < 9) setFunctionModule(qr, 8, 15 - i, false);
    else setFunctionModule(qr, 8, 15 - i - 1, false);
  }
};

const formatBits = () => {
  const data = 0b01000; // Error correction L, mask 0.
  let bits = data << 10;
  let remainder = bits;
  while (remainder >= (1 << 10)) {
    const shift = Math.floor(Math.log2(remainder)) - 10;
    remainder ^= 0x537 << shift;
  }
  return ((bits | remainder) ^ 0x5412) & 0x7fff;
};

const drawFormatBits = (qr) => {
  const bits = formatBits();
  for (let i = 0; i < 15; i += 1) {
    const dark = ((bits >>> i) & 1) !== 0;
    if (i < 6) qr.modules[i][8] = dark;
    else if (i < 8) qr.modules[i + 1][8] = dark;
    else qr.modules[SIZE - 15 + i][8] = dark;

    if (i < 8) qr.modules[8][SIZE - i - 1] = dark;
    else if (i < 9) qr.modules[8][15 - i] = dark;
    else qr.modules[8][15 - i - 1] = dark;
  }
};

const mask = (row, column) => (row + column) % 2 === 0;

const drawCodewords = (qr, codewords) => {
  let row = SIZE - 1;
  let direction = -1;
  let bitIndex = 0;

  for (let column = SIZE - 1; column > 0; column -= 2) {
    if (column === 6) column -= 1;
    for (let offset = 0; offset < SIZE; offset += 1) {
      const currentRow = row + direction * offset;
      for (let columnOffset = 0; columnOffset < 2; columnOffset += 1) {
        const currentColumn = column - columnOffset;
        if (!qr.reserved[currentRow][currentColumn]) {
          const bit = bitIndex < codewords.length * 8
            ? ((codewords[Math.floor(bitIndex / 8)] >>> (7 - (bitIndex % 8))) & 1) !== 0
            : false;
          qr.modules[currentRow][currentColumn] = bit !== mask(currentRow, currentColumn);
          bitIndex += 1;
        }
      }
    }
    row += direction * (SIZE - 1);
    direction = -direction;
  }
};

export const createQrMatrix = (text) => {
  const codewords = createCodewords(text);
  if (codewords.length !== 70) throw new Error('Unexpected QR codeword length');
  const qr = createMatrix();
  drawFunctionPatterns(qr);
  drawCodewords(qr, codewords);
  drawFormatBits(qr);
  return qr.modules;
};
