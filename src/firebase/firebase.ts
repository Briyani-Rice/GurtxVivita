// Import the functions you need from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOEY-lzz3RUV51oKmnJ_bWAbQf_Y_OSao",
  authDomain: "gurtxvivita-4c370.firebaseapp.com",
  projectId: "gurtxvivita-4c370",
  storageBucket: "gurtxvivita-4c370.firebasestorage.app",
  messagingSenderId: "1008871337090",
  appId: "1:1008871337090:web:6bd64b69e09e91e5eb189b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export so other files can use them
export { app, db };