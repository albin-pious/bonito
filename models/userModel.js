const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');

class User {
    constructor(name, email, password, mobile,role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.mobile = mobile;
        this.role = role || 'User';
        this.blocked = false;
    }

    // Save the user to the database;
    async save() {
        try {
            const db = getDb();
            const result = await db.collection('users').insertOne(this);
            return result.insertedId;
        } catch (error) {
            console.log(error.message);
            throw error;
        }
    }
}

module.exports = User;