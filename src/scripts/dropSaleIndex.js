const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dropSaleIndex = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('sales');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(i => i.name));

    // Drop the old invoiceNumber_1 index
    try {
      await collection.dropIndex('invoiceNumber_1');
      console.log('✅ Dropped index: invoiceNumber_1');
    } catch (err) {
      if (err.code === 27) {
        console.log('⚠️ Index invoiceNumber_1 does not exist');
      } else {
        console.log('❌ Error:', err.message);
      }
    }

    // Verify remaining indexes
    const remainingIndexes = await collection.indexes();
    console.log('📋 Remaining indexes:', remainingIndexes.map(i => i.name));

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

dropSaleIndex();
