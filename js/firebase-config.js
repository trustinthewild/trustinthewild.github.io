import app from './firebase-init.js';
import { getDatabase, ref, push, set, get, query, orderByChild } from 'https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js';

const db = getDatabase(app);

// Add comment to Realtime Database
export async function addComment(productId, name, comment) {
    try {
    const commentsRef = ref(db, `products/${productId}/comments`);
        const newCommentRef = push(commentsRef);
        await set(newCommentRef, {
            name: name,
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