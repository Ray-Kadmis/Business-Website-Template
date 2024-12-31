import Stripe from "stripe";
import {
  getFirestore,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_REALTIME_DATABASE_URL,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const stripe = new Stripe(
  "sk_test_51QEqGNDCQX4iuy2s1xCRoZBzJ9FJDvWElGALAL7t7Lc6R1zp5FJITOOgXirth4K6sid8A7tCeL4C6Qsi6DbYC3jQ00h2qBO6LQ",
  {
    apiVersion: "2024-09-30.acacia", // Replace with the desired API version
  }
);
const endpointSecret =
  "whsec_31e599d44d376a5238893233900742cb74bfe7151914d58d205182272a8f9529";

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          { expand: ["line_items"] }
        );

        const customerId = session.customer;
        const customerDetails = session.customer_details;

        if (customerDetails?.email) {
          const userQuery = query(
            collection(db, "users"),
            where("email", "==", customerDetails.email)
          );
          const userDoc = await getDocs(userQuery);
          if (userDoc.empty) throw new Error("User not found");
          const user = userDoc.docs[0];

          if (!user.data().customerId) {
            const userRef = doc(db, "users", userDoc.docs[0].id);
            await setDoc(userRef, { customerId }, { merge: true });
          }

          const lineItems = session.line_items?.data || [];

          for (const item of lineItems) {
            const priceId = item.price?.id;
            const isSubscription = item.price?.type === "recurring";

            if (isSubscription) {
              let endDate = new Date();
              if (priceId === process.env.STRIPE_YEARLY_PRICE_ID) {
                endDate.setFullYear(endDate.getFullYear() + 1);
              } else if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
                endDate.setMonth(endDate.getMonth() + 1);
              } else {
                throw new Error("Invalid priceId");
              }

              const subscriptionRef = db
                .collection("subscriptions")
                .doc(user.id);
              await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(subscriptionRef);
                const subscriptionData = {
                  userId: user.id,
                  startDate: new Date(),
                  endDate,
                  plan: "premium",
                  period:
                    priceId === process.env.STRIPE_YEARLY_PRICE_ID
                      ? "yearly"
                      : "monthly",
                };

                if (!doc.exists) {
                  transaction.set(subscriptionRef, subscriptionData);
                } else {
                  transaction.update(subscriptionRef, subscriptionData);
                }

                transaction.update(user.ref, { plan: "premium" });
              });
            } else {
              // one_time_purchase handling
            }
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.id
        );
        const userSnapshot = await db
          .collection("users")
          .where("customerId", "==", subscription.customer)
          .get();

        if (!userSnapshot.empty) {
          await userSnapshot.docs[0].ref.update({ plan: "free" });
        } else {
          console.error("User not found for the subscription deleted event.");
          throw new Error("User not found for the subscription deleted event.");
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Error handling event", error);
    return new Response("Webhook Error", { status: 400 });
  }

  return new Response("Webhook received", { status: 200 });
}
