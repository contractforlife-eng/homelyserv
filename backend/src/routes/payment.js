import express from 'express'; 
const router = express.Router(); 
 
router.get('/', (req, res) => { 
  res.json({ success: true, payments: [] }); 
}); 
 
router.get('/:id', (req, res) => { 
  res.json({ success: true, payment: null }); 
}); 
 
router.post('/', (req, res) => { 
  res.json({ success: true, message: 'Payment created' }); 
}); 
 
router.put('/:id', (req, res) => { 
  res.json({ success: true, message: 'Payment updated' }); 
}); 
 
router.delete('/:id', (req, res) => { 
  res.json({ success: true, message: 'Payment deleted' }); 
}); 
 
export default router; 
