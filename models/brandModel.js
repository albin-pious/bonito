const {ObjectId}= require('mongodb');
const { getDb } = require('../config/dbConnect');

class Brand{
    constructor(brandName,categoryId){
        this.brandName = brandName;
        this.categoryId = categoryId;
    }

    async save(){
        try {
            const db = getDb();
            const result = await db.collection('brand').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.log(error.message);
            throw error;
        }
    }
}

module.exports = Brand;