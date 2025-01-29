import stripe from "@/app/stripe";
import { db } from "@/app/firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
// export async function POST(req) {
//   const rawBody = await req.text();
//   console.log("Webhook received!");
//   const signature = req.headers.get("stripe-signature");
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       rawBody,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error("Webhook signature verification failed.", err.message);
//     return new Response(`Webhook Error: ${err.message}`, { status: 400 });
//   }

//   try {
//     switch (event.type) {
//       case "checkout.session.completed": {
//         try {
//           const session = await stripe.checkout.sessions.retrieve(
//             event.data.object.id,
//             {
//               expand: ["line_items", "subscription", "customer"], // Add these!
//             }
//           );
//           console.log("Session retrieved:", session);

//           const customerId = session.customer;
//           const customerDetails = session.customer_details;

//           if (!customerDetails || !customerDetails.email) {
//             throw new Error("Customer email not found in session.");
//           }

//           const usersRef = db.collection("users");
//           const userQuery = await usersRef
//             .where("email", "==", customerDetails.email)
//             .get();

//           if (userQuery.empty) {
//             console.error("User not found for email:", customerDetails.email);
//             throw new Error("User not found");
//           }

//           const userDoc = userQuery.docs[0];
//           if (!userDoc.data().customerId) {
//             await userDoc.ref.update({ customerId });
//           }

//           const lineItems = session.line_items?.data || [];
//           console.log("Line items:", lineItems);

//           for (const item of lineItems) {
//             const priceId = item.price?.id;
//             const isSubscription = item.price?.type === "recurring";

//             if (isSubscription) {
//               if (
//                 ![
//                   process.env.STRIPE_YEARLY_PRICE_ID,
//                   process.env.STRIPE_MONTHLY_PRICE_ID,
//                 ].includes(priceId)
//               ) {
//                 console.error("Invalid priceId:", priceId);
//                 throw new Error("Invalid priceId");
//               }

//               let endDate = new Date();
//               if (priceId === process.env.STRIPE_YEARLY_PRICE_ID) {
//                 endDate.setFullYear(endDate.getFullYear() + 1);
//               } else if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
//                 endDate.setMonth(endDate.getMonth() + 1);
//               }

//               const subscriptionRef = db
//                 .collection("subscriptions")
//                 .doc(userDoc.id);

//               try {
//                 await db.runTransaction(async (transaction) => {
//                   const doc = await transaction.get(subscriptionRef);
//                   const subscriptionData = {
//                     userId: userDoc.id,
//                     startDate: new Date(),
//                     endDate,
//                     plan: "premium",
//                     period: priceId === process.env.STRIPE_YEARLY_PRICE_ID,
//                   };

//                   if (!doc.exists) {
//                     transaction.set(subscriptionRef, subscriptionData);
//                   } else {
//                     transaction.update(subscriptionRef, subscriptionData);
//                   }

//                   transaction.update(userDoc.ref, { plan: "premium" });
//                 });
//               } catch (error) {
//                 console.error("Firestore transaction failed:", error);
//                 throw new Error("Firestore transaction failed");
//               }
//             }
//           }
//         } catch (error) {
//           console.error("Error handling checkout.session.completed:", error);
//           throw new Error(
//             `Error handling checkout.session.completed: ${error.message}`
//           );
//         }
//         break;
//       }
//       case "customer.subscription.deleted": {
//         const subscription = await stripe.subscriptions.retrieve(
//           event.data.object.id
//         );

//         const userSnapshot = await db
//           .collection("users")
//           .where("customerId", "==", subscription.customer)
//           .get();

//         if (!userSnapshot.empty) {
//           await userSnapshot.docs[0].ref.update({ plan: "free" });
//         } else {
//           console.error("User not found for the subscription deleted event.");
//           throw new Error("User not found for the subscription deleted event.");
//         }
//         break;
//       }
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }

//     return new Response("Webhook received", { status: 200 });
//   } catch (error) {
//     console.error("Error handling event:", error);
//     return new Response(`Webhook Error: ${error.message}`, { status: 400 });
//   }
// }

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  let event;

  try {
    // Verify webhook signature
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
        // Retrieve the checkout session
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          { expand: ["customer"] } // Optional: Expand customer details if needed
        );

        // Extract email from session
        const email = session?.customer_details?.email;

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
          });
          console.log("New user created:", email);
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
