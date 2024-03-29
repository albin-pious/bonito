const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');

class Cart{
    constructor(userId,productId){
        this.userId = userId;
        this.productId = productId;
    }

    async save(){
        try {
            const  db = getDb();
            const result = await db.collection('cart').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.log(error.message);
            throw error; 
        }
    } 
}

 
module.exports = Cart;