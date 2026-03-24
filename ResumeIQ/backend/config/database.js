// config/database.js — MongoDB Atlas Connection · ResumeIQ v3.0
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB  = process.env.MONGODB_DB || 'resumeiq';

let _db = null;

async function getDB() {
  if (_db) return _db;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  _db = client.db(MONGO_DB);
  console.log(`✅ Connected to MongoDB Atlas — db: ${MONGO_DB}`);
  return _db;
}

async function getCol(name) {
  const db = await getDB();
  return db.collection(name);
}

function toObjId(id) {
  return new ObjectId(id);
}

function nowUTC() {
  return new Date();
}

function msToDate(dt) {
  if (!dt) return '';
  const d = dt instanceof Date ? dt : new Date(dt);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const UPLOAD_DIR    = __dirname + '/../uploads/resumes/';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTS  = ['pdf', 'doc', 'docx'];

module.exports = { getDB, getCol, toObjId, nowUTC, msToDate, UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_EXTS };
