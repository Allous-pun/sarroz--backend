const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');

router.post('/stk-push', mpesaController.initiateSTKPush);
router.post('/callback', mpesaController.mpesaCallback);
router.get('/query/:checkoutRequestID', mpesaController.queryTransaction);
router.get('/transactions', mpesaController.getAllTransactions);

module.exports = router;
