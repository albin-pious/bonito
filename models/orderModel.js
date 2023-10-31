const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');

class Order {
    constructor(userId, productDetails, totalPrice, status, address, paymentType) {
        this.userId = userId;
        this.productDetails = productDetails;
        this.totalPrice = totalPrice;
        this.orderDate = new Date();
        this.deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        this.status = status;
        this.address = address;
        this.paymentType = paymentType;
    }

    async save(){
        try {
            const db = getDb();
            const result = await db.collection('order').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.error(error);
            throw error
        }
    }
}

module.exports = Order;