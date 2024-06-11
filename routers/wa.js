const express = require('express');
const router = express.Router();
const { sendMessage, scan, bulkMessage, status } = require('../controllers/waController');

router.post('/send-message', sendMessage);
router.post('/send-bulk-message', bulkMessage);
router.get('/scan', scan);
router.get('/status', status);

module.exports = router;
