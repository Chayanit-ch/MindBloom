import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBYwCovF3FFPAma_ROQ5I6tqnz83JCoP-A",
  authDomain: "mindbloom-4edd3.firebaseapp.com",
  projectId: "mindbloom-4edd3",
  storageBucket: "mindbloom-4edd3.firebasestorage.app",
  messagingSenderId: "709192703642",
  appId: "1:709192703642:web:acb08d8b80942d5b084923"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()