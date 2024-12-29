import Stripe from "stripe";
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  collection,
  writeBatch,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  console.log("Webhook received!");

  try {
    const sig = req.headers.get("stripe-signature");
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Event type received:", event.type);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Session data:", JSON.stringify(session, null, 2));

      const email = session.customer_email; // Ensure email is present
      console.log("Customer email from session:", email);

      if (!email) {
        throw new Error("Customer email is missing from the session.");
      }

      // Calculate exactly one month from now
      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const paymentRef = doc(db, "payments", email);

      // Define the payment data
      const paymentData = {
        paymentStatus: "active",
        expiryDate: Timestamp.fromDate(expiryDate),
        customerId: session.customer,
        subscriptionId: session.subscription,
        createdAt: Timestamp.fromDate(now),
        lastPaymentStatus: session.payment_status,
        email: email,
        lastUpdated: Timestamp.fromDate(now),
      };

      // Then use setDoc once with the data
      try {
        await setDoc(paymentRef, paymentData, { merge: true });
        console.log("Document created successfully for:", email);
      } catch (error) {
        console.error("Error creating document:", error);
      }
      return new Response(
        JSON.stringify({
          received: true,
          email: email,
          documentCreated: true,
        }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
}


