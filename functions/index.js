const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors')({origin: true});

admin.initializeApp();

// Create Stripe Checkout Session
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { priceId, productId, type } = req.body;

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price: priceId,
                    quantity: 1,
                }],
                mode: type === 'subscription' ? 'subscription' : 'payment',
                success_url: `${req.headers.origin}/products/${productId}.html?success=true`,
                cancel_url: `${req.headers.origin}/products/${productId}.html?canceled=true`,
            });

            res.status(200).json({ id: session.id });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Handle Stripe webhook
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                // Add purchase to Firebase
                await admin.firestore().collection('purchases').add({
                    customerId: session.customer,
                    productId: session.metadata.productId,
                    amount: session.amount_total,
                    status: 'completed',
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({received: true});
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Get product comments
exports.getComments = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const productId = req.query.productId;
            const snapshot = await admin.firestore()
                .collection(`products/${productId}/comments`)
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const comments = [];
            snapshot.forEach(doc => {
                comments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.status(200).json(comments);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Add comment
exports.addComment = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            const { productId, name, comment } = req.body;
            
            const docRef = await admin.firestore()
                .collection(`products/${productId}/comments`)
                .add({
                    name,
                    comment,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

            res.status(200).json({ 
                success: true, 
                id: docRef.id 
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});