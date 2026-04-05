const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const fixInventoryIndex = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('inventories');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(i => i.name));

    // Drop the problematic index if it exists
    const oldIndexNames = ['branch_1_product_1_size_1_color_1', 'branch_1_product_1_variant_1_batchNumber_1'];
    
    for (const indexName of oldIndexNames) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (err) {
        if (err.code === 27) {
          console.log(`⚠️ Index ${indexName} does not exist, skipping`);
        } else {
          console.log(`❌ Error dropping ${indexName}:`, err.message);
        }
      }
    }

    // Drop all documents in inventories collection to start fresh
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} inventory documents`);

    console.log('\n✅ Inventory collection cleaned. Restart your server and add inventory again.');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixInventoryIndex();