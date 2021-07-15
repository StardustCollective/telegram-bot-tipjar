'use strict'

const FirebaseFunctions = require('firebase-functions');
const FirebaseAdmin = require('firebase-admin');
FirebaseAdmin.initializeApp(FirebaseFunctions.config().firebase);
const db = FirebaseAdmin.firestore()

module.exports = db
