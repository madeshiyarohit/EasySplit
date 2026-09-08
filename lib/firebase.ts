import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBsCePR1EYvfQ57Nop6t2djYyuhulW0svE",
  authDomain: "easysplit-44b94.firebaseapp.com",
  projectId: "easysplit-44b94",
  storageBucket: "easysplit-44b94.firebasestorage.app",
  messagingSenderId: "693476580275",
  appId: "1:693476580275:web:1962435d2a2cbdb8c449c6",
  measurementId: "G-GJX5Z395EK",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");
// Request full profile so we get name + photo
googleProvider.setCustomParameters({ prompt: "select_account" });
