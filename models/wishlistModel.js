const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');

class Wishlist{
    constructor(userId,products){
        this.userId = userId;
        this.products = products;
    }

    async save(){
        try {
            const db = getDb();
            const result = await db.collection('wishlist').insertOne(this)
        } catch (error) {
            console.log(error.message);
            throw error;
        }
    }
}