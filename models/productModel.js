const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');  

class Product {
  constructor(
    title, 
    description, 
    price, 
    gender, 
    categoryId, 
    stock, 
    offer, 
    sizeUnits, 
    brand, 
    images
    ) {
    if (!title || !description || !price || !gender || !categoryId || !stock || !offer || !sizeUnits || !brand || !Array.isArray(images)) {
      throw new Error('Required fields are missing');
    }

    this.title = title;
    this.description = description;
    this.price = price;
    this.gender = gender;
    this.category = categoryId;
    this.stock = stock;
    this.offer = offer;
    this.sizeUnits = sizeUnits;
    this.brand = brand;
    this.images = images;
  }

  async save() {
    try {
      const db = getDb();
      const result = await db.collection('products').insertOne(this);
      return result.insertedId;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }
}

module.exports = Product;
