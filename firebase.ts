import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration provided in the prompt
const firebaseConfig = {
  apiKey: "AIzaSyAced75wkjtsDjFDBbC7mxMb1xSTb0UMPE",
  authDomain: "health-leave-2718b.firebaseapp.com",
  databaseURL: "https://health-leave-2718b-default-rtdb.firebaseio.com",
  projectId: "health-leave-2718b",
  storageBucket: "health-leave-2718b.firebasestorage.app",
  messagingSenderId: "177547298400",
  appId: "1:177547298400:web:284b71f0f4e585d66ce505",
  measurementId: "G-LCDKDNTXQ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Setting custom parameters for Google Auth if needed
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
