import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import marketplaceRouter from './marketplace.js';
import MarketplaceListing from '../models/MarketplaceListing.js';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || '8e07f8bff66210118e8088720b325af1774590a3bfdb9b2967dae4c53a749c0b';
const token = (id, role) => jwt.sign({ userId: id, id, role }, JWT_SECRET);

test('Marketplace complete pagination on backend routes: Browse, Mine, Moderation', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/marketplace', marketplaceRouter);

  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api/marketplace`;

  // Mock listings database
  const totalCount = 38;
  const mockItems = Array.from({ length: totalCount }, (_, i) => ({
    _id: `507f1f77bcf86cd7994390${String(i).padStart(2, '0')}`,
    ownerId: '507f1f77bcf86cd799439099',
    title: `Listing Item ${i + 1}`,
    description: `Description for listing item number ${i + 1}`,
    price: 10 + i,
    currency: 'USD',
    country: 'EG',
    region: 'Cairo',
    city: 'Nasr City',
    locationDescription: 'Central street',
    phone: '+201012345678',
    whatsapp: '+201012345678',
    status: 'ACTIVE',
    reports: [{ reporterId: 'user1', reason: 'Spam reason' }],
    createdAt: new Date(Date.now() - i * 1000)
  }));

  const origFind = MarketplaceListing.find;
  const origCount = MarketplaceListing.countDocuments;
  const origUserFind = User.find;
  const origUserFindOne = User.findOne;

  try {
    User.findOne = () => ({
      select: () => ({
        lean: async () => ({ tokenSessionVersion: 1, status: 'ACTIVE' })
      }),
      exec: async () => ({ tokenSessionVersion: 1, status: 'ACTIVE' }),
      then: (resolve) => resolve({ tokenSessionVersion: 1, status: 'ACTIVE' })
    });
    User.find = () => ({
      select: () => ({
        lean: async () => [{ _id: '507f1f77bcf86cd799439099', fullName: 'Test Seller', role: 'WORKER' }]
      })
    });

    MarketplaceListing.find = (query) => {
      let result = [...mockItems];
      return {
        sort: () => ({
          skip: (skipCount) => ({
            limit: (limitCount) => Promise.resolve(result.slice(skipCount, skipCount + limitCount))
          })
        })
      };
    };

    MarketplaceListing.countDocuments = async () => totalCount;

    const authHeaders = {
      authorization: `Bearer ${token('507f1f77bcf86cd799439099', 'WORKER')}`
    };

    // 1. Browse pagination: page 1
    const resPage1 = await fetch(`${base}?page=1&limit=12`, { headers: authHeaders });
    assert.equal(resPage1.status, 200);
    const dataPage1 = await resPage1.json();
    assert.equal(dataPage1.page, 1);
    assert.equal(dataPage1.pages, 4); // ceil(38 / 12) = 4
    assert.equal(dataPage1.total, 38);
    assert.equal(dataPage1.listings.length, 12);
    assert.equal(dataPage1.listings[0].title, 'Listing Item 1');

    // 2. Browse pagination: page 4 (last page with remaining 2 items)
    const resPage4 = await fetch(`${base}?page=4&limit=12`, { headers: authHeaders });
    assert.equal(resPage4.status, 200);
    const dataPage4 = await resPage4.json();
    assert.equal(dataPage4.page, 4);
    assert.equal(dataPage4.pages, 4);
    assert.equal(dataPage4.listings.length, 2);
    assert.equal(dataPage4.listings[0].title, 'Listing Item 37');

    // 3. My Listings pagination
    const resMine = await fetch(`${base}/mine?page=2&limit=12`, { headers: authHeaders });
    assert.equal(resMine.status, 200);
    const dataMine = await resMine.json();
    assert.equal(dataMine.page, 2);
    assert.equal(dataMine.pages, 4);
    assert.equal(dataMine.total, 38);
    assert.equal(dataMine.listings.length, 12);
    assert.equal(dataMine.listings[0].title, 'Listing Item 13');

    // 4. Moderation reports pagination
    const adminHeaders = {
      authorization: `Bearer ${token('507f1f77bcf86cd799439001', 'ADMIN')}`
    };
    const resMod = await fetch(`${base}/admin/reports?page=3&limit=12`, { headers: adminHeaders });
    assert.equal(resMod.status, 200);
    const dataMod = await resMod.json();
    assert.equal(dataMod.page, 3);
    assert.equal(dataMod.pages, 4);
    assert.equal(dataMod.total, 38);
    assert.equal(dataMod.listings.length, 12);
    assert.equal(dataMod.listings[0].title, 'Listing Item 25');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    MarketplaceListing.find = origFind;
    MarketplaceListing.countDocuments = origCount;
    User.find = origUserFind;
    User.findOne = origUserFindOne;
  }
});
