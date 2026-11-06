// backend/src/config/cors.js
export const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://localhost',
  'https://homelyserv-nznn.vercel.app',
  'https://gas-clapped-copper.ngrok-free.dev',
  'http://192.168.100.12:5173',
  'http://192.168.100.12:3000',
  'https://homelyserv.com',
  'https://www.homelyserv.com',
];

export const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'Idempotency-Key',
  'X-Requested-With',
  'X-Guest-Token',
  'X-Client-Platform',
  'X-Client-Version',
  'Accept',
  'Origin',
  'Access-Control-Allow-Origin',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Methods'
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    const isNgrok = /^https:\/\/.*\.ngrok-free\.dev$/.test(origin);

    if (isAllowed || isNgrok) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders,
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

export const corsFallbackMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    const isNgrok = /^https:\/\/.*\.ngrok-free\.dev$/.test(origin);

    if (isAllowed || isNgrok) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    }
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};
