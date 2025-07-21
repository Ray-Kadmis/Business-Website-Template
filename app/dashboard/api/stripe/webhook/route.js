import stripe from "@/app/stripe";
import { db } from "@/app/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          { expand: ["subscription", "customer"] }
        );

        const email = session?.customer_details?.email;
        const customerId = session?.customer?.id || session.customer;
        const subscriptionId =
          session?.subscription?.id || session.subscription;

        console.log("Checkout completed:", {
          email,
          customerId,
          subscriptionId,
          sessionId: session.id,
        });

        if (!email) {
          console.error("No email found in checkout session");
          return new Response("Email not found in session", { status: 400 });
        }

        // Get subscription status
        let subscriptionStatus = null;
        let subscription = null;
        if (subscriptionId) {
          try {
            subscription = await stripe.subscriptions.retrieve(subscriptionId);
            subscriptionStatus = subscription.status;
            console.log("Retrieved subscription status:", subscriptionStatus);
          } catch (err) {
            console.error("Failed to fetch subscription:", err);
          }
        }

        // Find user by email (primary identifier)
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        // Prepare user data with latest info
        const userData = {
          email,
          updatedAt: new Date(),
          customerId, // Always update with latest customer ID
        };

        if (subscriptionId) {
          userData.subscriptionId = subscriptionId;
          userData.subscriptionStatus = subscriptionStatus;
        }

        // If user exists, update their document
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const existingData = userDoc.data();

          console.log("Updating existing user:", {
            email,
            oldCustomerId: existingData.customerId,
            newCustomerId: customerId,
            oldSubscriptionId: existingData.subscriptionId,
            newSubscriptionId: subscriptionId,
          });

          await updateDoc(userDoc.ref, userData);
          console.log("Updated user:", email);
        } else {
          // If new user, create document
          userData.createdAt = new Date();
          await addDoc(usersRef, userData);
          console.log("New user created:", email);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const subscriptionId = subscription.id;

        console.log("Subscription deleted:", {
          customerId,
          subscriptionId,
        });

        // Find user by customer ID
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("customerId", "==", customerId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();

          // Only update if this is the current subscription
          if (userData.subscriptionId === subscriptionId) {
            await updateDoc(userDoc.ref, {
              subscriptionStatus: "canceled",
              updatedAt: new Date(),
            });
            console.log(
              "Updated user subscription status to canceled:",
              userData.email
            );
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const customerId = charge.customer;

        if (!customerId) {
          console.log("Charge has no associated customer");
          break;
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("customerId", "==", customerId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          await updateDoc(userDoc.ref, {
            subscriptionStatus: "refunded",
            updatedAt: new Date(),
          });
          console.log("Updated user status to refunded:", userDoc.id);
        } else {
          console.error("No user found for customerId:", customerId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
