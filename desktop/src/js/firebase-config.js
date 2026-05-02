import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "lmsa-desktop-app-992",
  appId: "1:645502296718:web:32913747a7d49a8bb55fdf",
  storageBucket: "lmsa-desktop-app-992.firebasestorage.app",
  apiKey: "AIzaSyB2umiVqdPVCwepgp7-8PxrMWPnZySAd5Y",
  authDomain: "lmsa-desktop-app-992.firebaseapp.com",
  messagingSenderId: "645502296718"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
