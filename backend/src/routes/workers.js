const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  upsertProfile, getMyProfile, searchWorkers, getWorkerById
} = require('../controllers/workerController');

router.get('/search', searchWorkers);
router.get('/me', auth, getMyProfile);
router.post('/profile', auth, upsertProfile);
router.get('/:id', getWorkerById);

module.exports = router;