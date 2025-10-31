// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBZIui4oK51FDw3nJ7J2R-tjyFWtnb_5L8",
    authDomain: "trustinthewildfirebase.firebaseapp.com",
    // IMPORTANT: Add your Realtime Database URL here
    databaseURL: "https://trustinthewildfirebase-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "trustinthewildfirebase",
    storageBucket: "trustinthewildfirebase.firebasestorage.app",
    messagingSenderId: "694380204447",
    appId: "1:694380204447:web:56c8d6ff7d59e9bdfaedaa",
    measurementId: "G-VMF96GR9CV"
};

// Initialize Firebase
// Pin Firebase SDK to a specific stable version
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js';
import { getDatabase, ref, push, set, get, query, orderByChild } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js';

export const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Track authentication state
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    // Dispatch an event when auth state changes
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
});

// Add comment to Realtime Database
export async function addComment(productId, email, comment) {
    try {
        // Ensure user is authenticated
        const user = auth.currentUser;
        if (!user) {
            throw new Error('Authentication required');
        }

        const commentsRef = ref(db, `products/${productId}/comments`);
        const newCommentRef = push(commentsRef);
        await set(newCommentRef, {
            userId: user.uid,
            email: email,
            comment: comment,
            timestamp: new Date().toISOString()
        });
        return { success: true, id: newCommentRef.key };
    } catch (error) {
        console.error("Error adding comment: ", error);
        return { success: false, error: error.message };
    }
}

// Get comments for a product
export async function getComments(productId) {
    try {
    const commentsRef = ref(db, `products/${productId}/comments`);
        const snapshot = await get(commentsRef);
        const comments = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach((key) => {
                comments.push({ id: key, ...data[key] });
            });
            // Sort by timestamp descending
            comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return comments;
    } catch (error) {
        console.error("Error getting comments: ", error);
        return [];
    }
}

// Submit contact form
export async function submitContactForm(formData) {
    try {
        const contactsRef = ref(db, "contacts");
        const newContactRef = push(contactsRef);
        await set(newContactRef, {
            name: formData.name,
            email: formData.email,
            message: formData.message,
            timestamp: new Date().toISOString()
        });
        return { success: true, id: newContactRef.key };
    } catch (error) {
        console.error("Error submitting contact form: ", error);
        return { success: false, error: error.message };
    }
}