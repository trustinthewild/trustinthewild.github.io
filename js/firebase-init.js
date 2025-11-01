// Import Firebase core
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZIui4oK51FDw3nJ7J2R-tjyFWtnb_5L8",
    authDomain: "trustinthewildfirebase.firebaseapp.com",
    databaseURL: "https://trustinthewildfirebase-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "trustinthewildfirebase",
    storageBucket: "trustinthewildfirebase.firebasestorage.app",
    messagingSenderId: "694380204447",
    appId: "1:694380204447:web:56c8d6ff7d59e9bdfaedaa",
    measurementId: "G-VMF96GR9CV"
};

// Initialize Firebase if not already initialized
let app;
try {
    app = initializeApp(firebaseConfig);
} catch (error) {
    if (error.code !== 'app/duplicate-app') {
        console.error('Firebase initialization error:', error);
    }
}

export default app;