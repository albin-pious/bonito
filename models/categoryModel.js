const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect')

class Category{
     constructor(categoryName){
        this.categoryName = categoryName;
     }

     async save(){
        try {
            const db = getDb();
            const result = await db.collection('category').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.log(error.message);
            throw error;
        }
     }
}

module.exports = Category;