// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "trustinthewild.firebaseapp.com",
    projectId: "trustinthewild",
    storageBucket: "trustinthewild.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add comment to Firestore
export async function addComment(productId, name, comment) {
    try {
        const docRef = await addDoc(collection(db, `products/${productId}/comments`), {
            name: name,
            comment: comment,
            timestamp: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error adding comment: ", error);
        return { success: false, error: error.message };
    }
}

// Get comments for a product
export async function getComments(productId) {
    try {
        const q = query(collection(db, `products/${productId}/comments`), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const comments = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        return comments;
    } catch (error) {
        console.error("Error getting comments: ", error);
        return [];
    }
}

// Submit contact form
export async function submitContactForm(formData) {
    try {
        const docRef = await addDoc(collection(db, "contacts"), {
            name: formData.name,
            email: formData.email,
            message: formData.message,
            timestamp: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error submitting contact form: ", error);
        return { success: false, error: error.message };
    }
}