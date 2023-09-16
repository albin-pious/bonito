const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');

class Product {
  constructor(title, description, price, gender, categoryId, stock, offer, sizes, colors, images) {
    if (!title || !description || !price || !gender || !categoryId || !stock || !colors || !Array.isArray(images) || !Array.isArray(sizes)) {
      throw new Error('Required fields are missing');
    }

    this.title = title;
    this.description = description;
    this.price = price;
    this.gender = gender;
    this.category = categoryId;
    this.stock = stock;
    this.offer = offer;
    this.sizes = sizes;
    this.colors = colors;
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
