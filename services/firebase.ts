import { getApp, getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2KpWxHjFuxLfjttvKwhqy90jzlwugfPs",
  authDomain: "odontoplay-bb7fc.firebaseapp.com",
  projectId: "odontoplay-bb7fc",
  storageBucket: "odontoplay-bb7fc.firebasestorage.app",
  messagingSenderId: "131213387213",
  appId: "1:131213387213:web:1dfe348b0ac2737a41d084",
  measurementId: "G-1RXNDBBVGZ",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;

try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
