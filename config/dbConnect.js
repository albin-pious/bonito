const mongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv').config()
const uri = process.env.DATABASE_URL;
const client = new mongoClient(uri);

let _db;

const dbConnection = async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
    // store database collection
    _db = client.db();
    await createUniqueIndex();
  } catch (error) {
    console.log('Error connecting to the database:', error);
    throw error;
  }
};

const getDb = ()=>{
  if(_db){
    return _db;
  }else{
    throw new Error('Database connection not established yet.')
  }
}

const createUniqueIndex = async () => {
  try {
    const db = getDb();

    // Create unique indexes with unique names
    await db.collection('users').createIndex({ email: 1 }, { name: 'unique_email_index' });
    await db.collection('users').createIndex({ mobile: 1 }, { name: 'unique_mobile_index' });
    await db.collection('category').createIndex({ categoryName: 1 });
    await db.collection('brand').createIndex({ brandName: 1 }, { name: 'unique_brandName_index' });
  } catch (error) {
    console.log(error);
  }
}



module.exports = {
  dbConnection,
  getDb
}