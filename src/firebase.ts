// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB57WN51NHFJFh7szj2agO1LLcnF8bZuLE",
  authDomain: "bubble-trim-491e1.firebaseapp.com",
  projectId: "bubble-trim-491e1",
  storageBucket: "bubble-trim-491e1.firebasestorage.app",
  messagingSenderId: "755188685844",
  appId: "1:755188685844:web:9725ad45d1f9a7d43b9b01",
  measurementId: "G-MTB189L2C2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
