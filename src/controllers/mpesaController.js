const Transaction = require('../models/Transaction');
const mpesaService = require('../services/mpesaService');

class MpesaController {
  async initiateSTKPush(req, res) {
    try {
      const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

      if (!phoneNumber || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and amount are required'
        });
      }

      if (amount < 1 || amount > 150000) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be between KES 1 and KES 150,000'
        });
      }

      const stkResponse = await mpesaService.stkPush(
        phoneNumber,
        amount,
        accountReference,
        transactionDesc
      );

      if (stkResponse.ResponseCode === '0') {
        const transaction = new Transaction({
          merchantRequestID: stkResponse.MerchantRequestID,
          checkoutRequestID: stkResponse.CheckoutRequestID,
          phoneNumber: phoneNumber,
          amount: amount,
          accountReference: accountReference || 'Payment',
          transactionDescription: transactionDesc || 'Payment for services',
          status: 'Pending'
        });

        await transaction.save();

        return res.status(200).json({
          success: true,
          message: 'STK Push initiated successfully',
          data: {
            merchantRequestID: stkResponse.MerchantRequestID,
            checkoutRequestID: stkResponse.CheckoutRequestID,
            responseDescription: stkResponse.ResponseDescription,
            customerMessage: stkResponse.CustomerMessage
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: stkResponse.ResponseDescription || 'STK Push failed',
          data: stkResponse
        });
      }
    } catch (error) {
      console.error('STK Push Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while processing STK Push',
        error: error.message
      });
    }
  }

  async mpesaCallback(req, res) {
    try {
      const callbackData = req.body;

      if (!callbackData.Body || !callbackData.Body.stkCallback) {
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data'
        });
      }

      const stkCallback = callbackData.Body.stkCallback;
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      const transaction = await Transaction.findOne({ 
        merchantRequestID: MerchantRequestID,
        checkoutRequestID: CheckoutRequestID 
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      let status = 'Failed';
      let mpesaReceiptNumber = null;

      if (ResultCode === 0) {
        status = 'Success';
        if (CallbackMetadata && CallbackMetadata.Item) {
          const receiptItem = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
          if (receiptItem) {
            mpesaReceiptNumber = receiptItem.Value;
          }
        }
      } else if (ResultCode === 1032) {
        status = 'Cancelled';
      }

      transaction.status = status;
      transaction.mpesaReceiptNumber = mpesaReceiptNumber;
      transaction.resultCode = ResultCode;
      transaction.resultDesc = ResultDesc;
      transaction.transactionDate = new Date();

      await transaction.save();

      console.log(`Transaction ${CheckoutRequestID} updated to status: ${status}`);

      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Success"
      });
    } catch (error) {
      console.error('Callback Error:', error);
      return res.status(500).json({
        ResultCode: 1,
        ResultDesc: "Failed"
      });
    }
  }

  async queryTransaction(req, res) {
    try {
      const { checkoutRequestID } = req.params;

      if (!checkoutRequestID) {
        return res.status(400).json({
          success: false,
          message: 'Checkout Request ID is required'
        });
      }

      const transaction = await Transaction.findOne({ checkoutRequestID });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const now = new Date();
      const lastQueried = transaction.updatedAt;
      const secondsSinceLastQuery = (now - lastQueried) / 1000;

      if (transaction.status === 'Pending' && secondsSinceLastQuery > 30) {
        try {
          const queryResponse = await mpesaService.checkTransactionStatus(checkoutRequestID);
          
          if (queryResponse.ResultCode === '0') {
            if (queryResponse.ResultDesc.includes('success') || queryResponse.ResultDesc.includes('Success')) {
              transaction.status = 'Success';
            } else if (queryResponse.ResultDesc.includes('failed') || queryResponse.ResultDesc.includes('Failed')) {
              transaction.status = 'Failed';
            }
            
            if (queryResponse.MpesaReceiptNumber) {
              transaction.mpesaReceiptNumber = queryResponse.MpesaReceiptNumber;
            }
            
            transaction.resultDesc = queryResponse.ResultDesc;
            await transaction.save();
            
            console.log(`📡 Query updated transaction ${checkoutRequestID} to: ${transaction.status}`);
          }
        } catch (queryError) {
          console.log('⚠️ M-Pesa query failed, returning cached data');
        }
      }

      return res.status(200).json({
        success: true,
        data: transaction,
        cached: secondsSinceLastQuery <= 30
      });
    } catch (error) {
      console.error('Query Transaction Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error querying transaction',
        error: error.message
      });
    }
  }

  async getAllTransactions(req, res) {
    try {
      const transactions = await Transaction.find().sort({ createdAt: -1 });
      
      return res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      console.error('Get Transactions Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching transactions',
        error: error.message
      });
    }
  }
}

module.exports = new MpesaController();
