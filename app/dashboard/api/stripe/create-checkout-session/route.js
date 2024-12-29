import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

export async function POST(req) {
  try {
    const { email } = await req.json(); // Get customer email from the request body.

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Enable card payments
      mode: "subscription", // Subscription mode
      line_items: [
        {
          price: PRICE_ID, // Reference your product price ID
          quantity: 1,
        },
      ],
      customer_email: email, // Auto-fill email in Stripe Checkout
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`, // Redirect to dashboard on success
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-reminder`, // Redirect to reminder on cancel
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
