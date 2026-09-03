// backend/src/routes/supHelpSettings.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import authRouter from './auth.js';
import adminRouter from './admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';

const createAuthHeader = (userId, role) => {
  const token = jwt.sign({ id: userId, userId, role, tokenVersion: 0 }, JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
};

const withSettingsTestServer = async ({ initialUsers = {} }, run) => {
  const userMap = new Map();
  for (const [id, data] of Object.entries(initialUsers)) {
    userMap.set(String(id), { ...data, _id: String(id), id: String(id) });
  }

  const saved = {
    userFindById: User.findById,
    userFindByIdAndUpdate: User.findByIdAndUpdate,
    userFindOne: User.findOne,
    userFind: User.find,
  };

  const makeUserQuery = (userObj) => {
    const clone = userObj ? {
      ...userObj,
      toObject: () => ({ ...userObj }),
      save: async function () {
        userMap.set(String(this._id), { ...this });
      },
    } : null;

    const promise = Promise.resolve(clone);
    promise.select = (fields) => {
      if (!userObj) return Promise.resolve(null);
      const res = { ...userObj };
      if (fields && fields.includes('-password')) {
        delete res.password;
      }
      res.toObject = () => ({ ...res });
      res.save = async function () {
        userMap.set(String(this._id), { ...this });
      };
      return Promise.resolve(res);
    };

    return promise;
  };

  User.findById = (id) => {
    const user = userMap.get(String(id));
    return makeUserQuery(user);
  };

  User.findByIdAndUpdate = (id, update, options) => {
    const user = userMap.get(String(id));
    if (user) {
      const updates = update.$set || update;
      Object.assign(user, updates);
    }
    return makeUserQuery(user);
  };

  User.findOne = (query) => {
    let matchUser = null;
    for (const u of userMap.values()) {
      let match = true;
      if (query._id && String(u._id) !== String(query._id)) match = false;
      if (query.email && u.email !== query.email) match = false;
      if (match) {
        matchUser = u;
        break;
      }
    }
    return makeUserQuery(matchUser);
  };

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const fetchJson = async (url, opts = {}) => {
    const res = await fetch(url, {
      ...opts,
      headers: {
        'content-type': 'application/json',
        ...(opts.headers || {}),
      },
    });
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { response: res, body };
  };

  try {
    await run({ base, fetchJson, userMap });
  } finally {
    User.findById = saved.userFindById;
    User.findByIdAndUpdate = saved.userFindByIdAndUpdate;
    User.findOne = saved.userFindOne;
    User.find = saved.userFind;
    await new Promise((resolve) => server.close(resolve));
  }
};

test('1. SUPPORT_HELPER can update own profile fields (name, phone, language, photo)', async () => {
  const initialPasswordHash = await bcrypt.hash('Password123!', 10);
  const helperId = '665f1a2b3c4d5e6f7a8b9c01';

  await withSettingsTestServer({
    initialUsers: {
      [helperId]: {
        _id: helperId,
        fullName: 'Olivia Nerochader',
        email: 'olivia@homelyserv.com',
        phone: '1234567890',
        language: 'en',
        role: 'SUPPORT_HELPER',
        password: initialPasswordHash,
        tokenVersion: 0,
        profileImage: null,
      },
    },
  }, async ({ base, fetchJson, userMap }) => {
    const authHeader = createAuthHeader(helperId, 'SUPPORT_HELPER');

    const { response, body } = await fetchJson(`${base}/api/auth/profile`, {
      method: 'PUT',
      headers: { authorization: authHeader },
      body: JSON.stringify({
        fullName: 'Olivia N. Updated',
        phone: '+966500000000',
        language: 'ar',
        profileImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.user.fullName, 'Olivia N. Updated');
    assert.equal(body.user.phone, '+966500000000');
    assert.equal(body.user.language, 'ar');
    assert.equal(body.user.profileImage, 'https://res.cloudinary.com/demo/image/upload/sample.jpg');
    assert.equal(body.user.role, 'SUPPORT_HELPER');

    const persisted = userMap.get(helperId);
    assert.equal(persisted.fullName, 'Olivia N. Updated');
    assert.equal(persisted.phone, '+966500000000');
    assert.equal(persisted.language, 'ar');
    assert.equal(persisted.profileImage, 'https://res.cloudinary.com/demo/image/upload/sample.jpg');
    assert.equal(persisted.role, 'SUPPORT_HELPER');
  });
});

test('2. SUPPORT_HELPER cannot alter role via profile update (immutable role)', async () => {
  const initialPasswordHash = await bcrypt.hash('Password123!', 10);
  const helperId = '665f1a2b3c4d5e6f7a8b9c01';

  await withSettingsTestServer({
    initialUsers: {
      [helperId]: {
        _id: helperId,
        fullName: 'Olivia Nerochader',
        email: 'olivia@homelyserv.com',
        role: 'SUPPORT_HELPER',
        password: initialPasswordHash,
        tokenVersion: 0,
      },
    },
  }, async ({ base, fetchJson, userMap }) => {
    const authHeader = createAuthHeader(helperId, 'SUPPORT_HELPER');

    const { response, body } = await fetchJson(`${base}/api/auth/profile`, {
      method: 'PUT',
      headers: { authorization: authHeader },
      body: JSON.stringify({
        fullName: 'Olivia Attempting Escalation',
        role: 'ADMIN',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.user.role, 'SUPPORT_HELPER', 'Role in response must remain SUPPORT_HELPER');

    const persisted = userMap.get(helperId);
    assert.equal(persisted.role, 'SUPPORT_HELPER', 'Persisted role must remain SUPPORT_HELPER');
  });
});

test('3. SUPPORT_HELPER can change own password with valid currentPassword', async () => {
  const initialPasswordHash = await bcrypt.hash('CurrentSecret123!', 10);
  const helperId = '665f1a2b3c4d5e6f7a8b9c01';

  await withSettingsTestServer({
    initialUsers: {
      [helperId]: {
        _id: helperId,
        fullName: 'Olivia Nerochader',
        email: 'olivia@homelyserv.com',
        role: 'SUPPORT_HELPER',
        password: initialPasswordHash,
        tokenVersion: 0,
      },
    },
  }, async ({ base, fetchJson, userMap }) => {
    const authHeader = createAuthHeader(helperId, 'SUPPORT_HELPER');

    const { response, body } = await fetchJson(`${base}/api/auth/change-password`, {
      method: 'PUT',
      headers: { authorization: authHeader },
      body: JSON.stringify({
        currentPassword: 'CurrentSecret123!',
        newPassword: 'BrandNewSecret456!',
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.success, true);

    const persisted = userMap.get(helperId);
    const valid = await bcrypt.compare('BrandNewSecret456!', persisted.password);
    assert.equal(valid, true, 'New password must be hashed and match in storage');
  });
});

test('4. SUPPORT_HELPER password change fails with wrong currentPassword or short newPassword', async () => {
  const initialPasswordHash = await bcrypt.hash('CurrentSecret123!', 10);
  const helperId = '665f1a2b3c4d5e6f7a8b9c01';

  await withSettingsTestServer({
    initialUsers: {
      [helperId]: {
        _id: helperId,
        fullName: 'Olivia Nerochader',
        email: 'olivia@homelyserv.com',
        role: 'SUPPORT_HELPER',
        password: initialPasswordHash,
        tokenVersion: 0,
      },
    },
  }, async ({ base, fetchJson }) => {
    const authHeader = createAuthHeader(helperId, 'SUPPORT_HELPER');

    // Wrong current password
    const { response: resWrong, body: bodyWrong } = await fetchJson(`${base}/api/auth/change-password`, {
      method: 'PUT',
      headers: { authorization: authHeader },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewSecret456!',
      }),
    });
    assert.equal(resWrong.status, 400);
    assert.equal(bodyWrong.success, false);

    // Short new password (< 6 chars)
    const { response: resShort, body: bodyShort } = await fetchJson(`${base}/api/auth/change-password`, {
      method: 'PUT',
      headers: { authorization: authHeader },
      body: JSON.stringify({
        currentPassword: 'CurrentSecret123!',
        newPassword: '123',
      }),
    });
    assert.equal(resShort.status, 400);
    assert.equal(bodyShort.success, false);
  });
});

test('5. SUPPORT_HELPER cannot access Admin settings or admin routes', async () => {
  const helperId = '665f1a2b3c4d5e6f7a8b9c01';

  await withSettingsTestServer({
    initialUsers: {
      [helperId]: {
        _id: helperId,
        fullName: 'Olivia Nerochader',
        email: 'olivia@homelyserv.com',
        role: 'SUPPORT_HELPER',
        tokenVersion: 0,
      },
    },
  }, async ({ base, fetchJson }) => {
    const authHeader = createAuthHeader(helperId, 'SUPPORT_HELPER');

    const { response } = await fetchJson(`${base}/api/admin/financial-center`, {
      headers: { authorization: authHeader },
    });
    assert.equal(response.status, 403, 'SUPPORT_HELPER must receive 403 on admin routes');
  });
});

test('6. SUPPORT and ADMIN settings flows remain unchanged and fully functional', async () => {
  const supportHash = await bcrypt.hash('SupportPass123!', 10);
  const adminHash = await bcrypt.hash('AdminPass123!', 10);
  const supportId = '665f1a2b3c4d5e6f7a8b9c02';
  const adminId = '665f1a2b3c4d5e6f7a8b9c03';

  await withSettingsTestServer({
    initialUsers: {
      [supportId]: {
        _id: supportId,
        fullName: 'Arwa Support',
        email: 'arwa@homelyserv.com',
        role: 'SUPPORT',
        password: supportHash,
        tokenVersion: 0,
      },
      [adminId]: {
        _id: adminId,
        fullName: 'Admin Dave',
        email: 'admin@homelyserv.com',
        role: 'ADMIN',
        password: adminHash,
        tokenVersion: 0,
      },
    },
  }, async ({ base, fetchJson, userMap }) => {
    // Support update profile
    const { response: supRes } = await fetchJson(`${base}/api/auth/profile`, {
      method: 'PUT',
      headers: { authorization: createAuthHeader(supportId, 'SUPPORT') },
      body: JSON.stringify({ fullName: 'Arwa Support Lead' }),
    });
    assert.equal(supRes.status, 200);
    assert.equal(userMap.get(supportId).fullName, 'Arwa Support Lead');
    assert.equal(userMap.get(supportId).role, 'SUPPORT');

    // Admin update profile
    const { response: adminRes } = await fetchJson(`${base}/api/auth/profile`, {
      method: 'PUT',
      headers: { authorization: createAuthHeader(adminId, 'ADMIN') },
      body: JSON.stringify({ fullName: 'Dave Executive Admin' }),
    });
    assert.equal(adminRes.status, 200);
    assert.equal(userMap.get(adminId).fullName, 'Dave Executive Admin');
    assert.equal(userMap.get(adminId).role, 'ADMIN');
  });
});

test('7. i18n module loads cleanly without TDZ or initialization order errors for all 6 languages', async () => {
  if (typeof global.document === 'undefined') {
    global.document = { documentElement: { dir: 'ltr', lang: 'en', setAttribute: () => {} } };
  }
  if (typeof global.localStorage === 'undefined') {
    global.localStorage = { getItem: () => null, setItem: () => {} };
  }
  if (typeof global.window === 'undefined') {
    global.window = global;
  }

  const i18nModule = await import('../../../frontend/src/i18n/index.js');
  const i18n = i18nModule.default;
  const languages = ['en', 'ar', 'fr', 'ru', 'tr', 'de'];

  for (const lng of languages) {
    const bundle = i18n.getResourceBundle(lng, 'translation');
    assert.ok(bundle, `Translation bundle for ${lng} must exist`);
    assert.ok(bundle.supHelpSettingsPage, `supHelpSettingsPage bundle for ${lng} must exist`);
    assert.ok(bundle.supportSettingsPage, `supportSettingsPage bundle for ${lng} must exist`);
    assert.ok(bundle.supHelpNavigation, `supHelpNavigation bundle for ${lng} must exist`);
    assert.ok(bundle.supHelpSettingsPage.title, `supHelpSettingsPage.title for ${lng} must exist`);
    assert.ok(bundle.supHelpSettingsPage.supportRole, `supHelpSettingsPage.supportRole for ${lng} must exist`);
  }
});
