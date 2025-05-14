// app/dashboard/api/stripe/check-subscription/route.js
import { NextResponse } from "next/server";
import stripe from "@/app/stripe";
import { db } from "@/app/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

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
    console.log(
      "Raw user data from Firestore:",
      JSON.stringify(userData, null, 2)
    );

    // Get and validate subscriptionId
    let subscriptionId = userData.subscriptionId;
    const customerId = userData.customerId;

    // Handle potential object subscriptionId
    if (subscriptionId && typeof subscriptionId === "object") {
      console.log("Found object subscriptionId:", subscriptionId);
      // If it's an object with an id property, use that
      if (subscriptionId.id) {
        subscriptionId = subscriptionId.id;
      } else {
        // If it's some other object, try to stringify it
        subscriptionId = JSON.stringify(subscriptionId);
      }
      console.log("Converted subscriptionId to:", subscriptionId);
    }

    // 2. Check if user has a subscription
    if (!subscriptionId) {
      console.log("No subscriptionId found for user:", email);
      return NextResponse.json(
        {
          access: false,
          error: "No subscription found",
          redirect: "/payment-reminder",
        },
        { status: 403 }
      );
    }

    // 3. Get subscription from Stripe
    let subscription;
    try {
      console.log("Attempting to fetch subscription with ID:", {
        subscriptionId,
        type: typeof subscriptionId,
        customerId,
        userEmail: email,
      });

      if (typeof subscriptionId !== "string") {
        throw new Error(
          `Invalid subscriptionId type: ${typeof subscriptionId}, value: ${JSON.stringify(
            subscriptionId
          )}`
        );
      }

      subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log("Stripe subscription data:", {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        customer: subscription.customer,
      });
    } catch (err) {
      console.error("Error retrieving subscription from Stripe:", {
        error: err.message,
        type: err.type,
        code: err.code,
        subscriptionId,
        customerId,
      });
      return NextResponse.json(
        {
          access: false,
          error: `Failed to retrieve subscription: ${err.message}`,
          redirect: "/payment-reminder",
        },
        { status: 404 }
      );
    }

    // 4. Check subscription status and period
    const now = Math.floor(Date.now() / 1000);
    const isActive = ["active", "trialing"].includes(subscription.status);
    const periodEnd = subscription.current_period_end;
    const isTrial = subscription.status === "trialing";
    const isCanceled = subscription.cancel_at_period_end;

    console.log("Subscription check details:", {
      status: subscription.status,
      isActive,
      periodEnd,
      now,
      isTrial,
      isCanceled,
      daysRemaining: Math.ceil((periodEnd - now) / (24 * 60 * 60)),
    });

    // 5. Determine access and return appropriate response
    if (isActive && periodEnd > now) {
      console.log("Access granted for user:", email);
      return NextResponse.json({
        access: true,
        subscription: {
          status: subscription.status,
          trial_end: subscription.trial_end,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: isCanceled,
          is_trial: isTrial,
          days_remaining: Math.ceil((periodEnd - now) / (24 * 60 * 60)),
        },
      });
    } else if (isTrial && periodEnd <= now) {
      console.log("Trial expired for user:", email);
      return NextResponse.json(
        {
          access: false,
          error: "Trial period has expired",
          redirect: "/payment-reminder",
          subscription: {
            status: subscription.status,
            trial_end: subscription.trial_end,
            current_period_end: subscription.current_period_end,
          },
        },
        { status: 403 }
      );
    } else if (isCanceled) {
      console.log("Subscription canceled for user:", email);
      return NextResponse.json(
        {
          access: false,
          error: "Subscription will end at period end",
          redirect: "/payment-reminder",
          subscription: {
            status: subscription.status,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: true,
          },
        },
        { status: 403 }
      );
    } else {
      console.log("Subscription not active for user:", email);
      return NextResponse.json(
        {
          access: false,
          error: "Subscription is not active",
          redirect: "/payment-reminder",
          subscription: {
            status: subscription.status,
            current_period_end: subscription.current_period_end,
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
