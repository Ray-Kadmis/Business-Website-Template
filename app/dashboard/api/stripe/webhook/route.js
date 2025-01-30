// import stripe from "@/app/stripe";
// import { db } from "@/app/firebaseConfig";
// import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// export async function POST(req) {
//   const rawBody = await req.text();
//   const signature = req.headers.get("stripe-signature");
//   let event;

//   try {
//     // Verify webhook signature
//     event = stripe.webhooks.constructEvent(
//       rawBody,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error("Webhook verification failed:", err.message);
//     return new Response(`Webhook Error: ${err.message}`, { status: 400 });
//   }

//   try {
//     switch (event.type) {
//       case "checkout.session.completed": {
//         // Retrieve the checkout session
//         const session = await stripe.checkout.sessions.retrieve(
//           event.data.object.id,
//           { expand: ["customer"] } // Optional: Expand customer details if needed
//         );

//         // Extract email from session
//         const email = session?.customer_details?.email;

//         if (!email) {
//           console.error("No email found in checkout session");
//           return new Response("Email not found in session", { status: 400 });
//         }

//         const usersRef = collection(db, "users");
//         const q = query(usersRef, where("email", "==", email));
//         const snapshot = await getDocs(q);

//         if (snapshot.empty) {
//           await addDoc(usersRef, {
//             email: email,
//             createdAt: new Date(),
//           });
//           console.log("New user created:", email);
//         }

//         break;
//       }
//       default:
//         console.log(`Unhandled event type: ${event.type}`);
//     }

//     return new Response("Webhook processed", { status: 200 });
//   } catch (error) {
//     console.error("Webhook processing error:", error);
//     return new Response(`Webhook Error: ${error.message}`, { status: 500 });
//   }
// }

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
          { expand: ["customer"] }
        );

        const email = session?.customer_details?.email;
        const customerId = session.customer;

        if (!email) {
          console.error("No email found in checkout session");
          return new Response("Email not found in session", { status: 400 });
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          await addDoc(usersRef, {
            email: email,
            createdAt: new Date(),
            customerId: customerId,
          });
          console.log("New user created:", email);
        } else {
          const userDoc = snapshot.docs[0];
          // Replace update() with updateDoc()
          await updateDoc(userDoc.ref, { customerId: customerId });
          console.log("Updated user with customerId:", email);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("customerId", "==", customerId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          await addDoc(usersRef, {
            email: email,
            createdAt: new Date(),
            customerId: customerId,
          });
          console.log("New user created:", email);
        } else {
          const userDoc = snapshot.docs[0];
          // Replace update() with updateDoc()
          await updateDoc(userDoc.ref, { customerId: customerId });
          console.log("Updated user with customerId:", email);
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
          await deleteDoc(userDoc.ref);
          console.log("User deleted due to refund:", userDoc.id);
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
