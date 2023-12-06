const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');

class Coupon{
    constructor(couponName,couponCode,couponOffer,minAmount,expireDate,brand,category,status,apply){
        this.couponName = couponName,
        this.couponCode = couponCode,
        this.couponOffer = couponOffer,
        this.minAmount = minAmount,
        this.expireDate = expireDate,
        this.brand = brand,
        this.category = category,
        this.status = status,
        this.apply = apply,
        this.usedBy = 0
    }

    async save(){
        try {
            const db = getDb();
            const result = await db.collection('coupons').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.log(error.message);
            throw error;
        }
    }
}

module.exports = Coupon;