// src/config/db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);

let dbConnection;

module.exports = {
  connectToDb: (cb) => {
    client.connect()
      .then((client) => {
        dbConnection = client.db('social_network_final');
        return cb();
      })
      .catch(err => {
        console.error(err);
        return cb(err);
      });
  },
  getDb: () => dbConnection
};