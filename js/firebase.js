// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPsbjpcCiBPM5fRgBnVOGXlu1t78a3-FE",
  authDomain: "nvians.firebaseapp.com",
  databaseURL: "https://nvians-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nvians",
  storageBucket: "nvians.firebasestorage.app",
  messagingSenderId: "81362347883",
  appId: "1:81362347883:web:5052436c2a7b15f60c8e2e",
  measurementId: "G-0E3L1BRYCJ"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);