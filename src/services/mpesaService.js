const axios = require('axios');
const mpesaConfig = require('../config/mpesa');

class MpesaService {
  async getAccessToken() {
    try {
      const url = `${mpesaConfig.baseURL}/oauth/v1/generate?grant_type=client_credentials`;
      const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw error;
    }
  }

  generatePassword(businessShortCode, passkey, timestamp) {
    return Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');
  }

  generateTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  async stkPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(
        mpesaConfig.businessShortCode,
        mpesaConfig.passkey,
        timestamp
      );

      let formattedPhone = phoneNumber.replace(/^0/, '254');
      if (!formattedPhone.startsWith('254')) {
        formattedPhone = `254${formattedPhone}`;
      }

      const payload = {
        BusinessShortCode: mpesaConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: mpesaConfig.transactionType,
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: mpesaConfig.partyB,
        PhoneNumber: formattedPhone,
        CallBackURL: mpesaConfig.callbackURL,
        AccountReference: accountReference || mpesaConfig.accountReference,
        TransactionDesc: transactionDesc || mpesaConfig.transactionDesc
      };

      const response = await axios.post(
        `${mpesaConfig.baseURL}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('STK Push Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async checkTransactionStatus(checkoutRequestID) {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(
        mpesaConfig.businessShortCode,
        mpesaConfig.passkey,
        timestamp
      );

      const payload = {
        BusinessShortCode: mpesaConfig.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      };

      const response = await axios.post(
        `${mpesaConfig.baseURL}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('⚠️ M-Pesa rate limit hit. Please wait 1 minute.');
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      console.error('Transaction Query Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new MpesaService();
