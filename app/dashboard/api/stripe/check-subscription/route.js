// app/dashboard/api/stripe/check-subscription/route.js
import { NextResponse } from "next/server";
import stripe from "@/app/stripe";
import { db } from "@/app/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

export async function POST(req) {
  try {
    const { email } = await req.json();
    console.log("Checking subscription for email:", email);

    if (!email) {
      console.log("No email provided in request");
      return NextResponse.json(
        { access: false, error: "No email provided" },
        { status: 400 }
      );
    }

    // 1. Get user from Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("No user found in Firestore for email:", email);
      return NextResponse.json(
        { access: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = snapshot.docs[0].data();
    const userDocRef = snapshot.docs[0].ref;
    console.log(
      "Raw user data from Firestore:",
      JSON.stringify(userData, null, 2)
    );

    // Get customerId from userData
    let customerId = userData.customerId;
    if (customerId && typeof customerId === "object") {
      customerId = customerId.id || customerId;
    }

    // Get subscriptionId from userData
    let subscriptionId = userData.subscriptionId;
    if (subscriptionId && typeof subscriptionId === "object") {
      subscriptionId = subscriptionId.id || subscriptionId;
    }

    console.log(
      "Processing customerId:",
      customerId,
      "subscriptionId:",
      subscriptionId
    );

    // 2. First try to get subscription by ID if we have one
    let subscription;
    try {
      if (subscriptionId) {
        subscription = await stripe.subscriptions.retrieve(subscriptionId);
        console.log("Retrieved stored subscription:", {
          id: subscription.id,
          status: subscription.status,
        });
      }
    } catch (err) {
      console.log("Stored subscription not found or error:", err.message);
    }

    // 3. If no subscription or it's canceled, look for active subscriptions
    if (!subscription || subscription.status === "canceled") {
      console.log("Looking for active subscriptions for customer:", customerId);

      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
          console.log("Found new active subscription:", {
            id: subscription.id,
            status: subscription.status,
          });

          // Update Firestore with new subscription ID
          await updateDoc(userDocRef, {
            subscriptionId: subscription.id,
          });
          console.log("Updated Firestore with new subscription ID");
        }
      } catch (err) {
        console.error("Error checking for active subscriptions:", err);
      }
    }

    // 4. If we still don't have an active subscription
    if (!subscription) {
      console.log("No active subscription found for user:", email);
      return NextResponse.json(
        {
          access: false,
          error: "No active subscription found",
          redirect: "/payment-reminder",
        },
        { status: 403 }
      );
    }

    // 5. Check subscription status
    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    const isTrial = subscription.status === "trialing";
    const isCanceled = subscription.cancel_at_period_end;
    const now = Math.floor(Date.now() / 1000);
    const periodEnd = subscription.current_period_end;
    const daysRemaining = periodEnd
      ? Math.ceil((periodEnd - now) / (24 * 60 * 60))
      : 0;

    console.log("Final subscription status check:", {
      id: subscription.id,
      status: subscription.status,
      isActive,
      periodEnd,
      isTrial,
      isCanceled,
      daysRemaining,
    });

    // 6. Return appropriate response
    if (isActive) {
      console.log("Access granted for user:", email);
      return NextResponse.json({
        access: true,
        subscription: {
          status: subscription.status,
          trial_end: subscription.trial_end,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: isCanceled,
          is_trial: isTrial,
          days_remaining: daysRemaining,
        },
      });
    } else {
      // Handle different non-active states
      let error = "Subscription is not active";

      if (subscription.status === "incomplete") {
        error = "Payment incomplete. Please update payment method";
      } else if (subscription.status === "past_due") {
        error = "Payment past due. Please update payment method";
      } else if (subscription.status === "canceled") {
        error = "Subscription has been canceled";
      } else if (subscription.status === "unpaid") {
        error = "Subscription payment failed";
      } else if (subscription.status === "incomplete_expired") {
        error = "Subscription setup expired";
      }

      console.log(
        `Subscription not active for user: ${email}. Status: ${subscription.status}`
      );
      return NextResponse.json(
        {
          access: false,
          error: error,
          redirect: "/payment-reminder",
          subscription: {
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: isCanceled,
          },
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Check subscription error:", error);
    return NextResponse.json(
      {
        access: false,
        error: "Internal server error",
        redirect: "/payment-reminder",
      },
      { status: 500 }
    );
  }
}
