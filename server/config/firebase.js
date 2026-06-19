const admin = require('firebase-admin');

let initialized = false;

function isFirebaseConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY
    && process.env.FIREBASE_DATABASE_URL
  );
}

function initFirebaseAdmin() {
  if (initialized || !isFirebaseConfigured()) {
    return null;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  initialized = true;
  console.log('✅ Firebase Admin initialized.');
  return admin;
}

function getFirebaseAdmin() {
  if (!initialized) {
    return initFirebaseAdmin();
  }
  return admin;
}

module.exports = {
  isFirebaseConfigured,
  initFirebaseAdmin,
  getFirebaseAdmin
};
