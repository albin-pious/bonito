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

const createUniqueIndex = async()=>{
  try {
    const db = getDb();
    const collection = db.collection('users');
    await userCollection.createIndex({email:1},{unique:true})
    await userCollection.createIndex({mobile:1},{unique:true})
  } catch (error) {
    
  }
}

module.exports = {
  dbConnection,
  getDb
}