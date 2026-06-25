const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const serviceAccount = require('./serviceAccountKey.json')

initializeApp({
  credential: cert(serviceAccount)
})

const uid = process.argv[2]

if (!uid) {
  console.error('กรุณาระบุ UID: node setAdmin.cjs <uid>')
  process.exit(1)
}

getAuth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`admin done for UID: ${uid}`)
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
  })