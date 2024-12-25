import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

export async function POST(req) {
  try {
    const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!email) {
      throw new Error("Email is required in the request body.");
    }

    const paymentRef = doc(db, "payments", email);
    console.log("Checking Firestore document:", `payments/${email}`);

    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      console.log("No document found for email:", email);
      return new Response(JSON.stringify({ active: false }), { status: 404 });
    }

    const { paymentStatus, expiryDate } = paymentSnap.data();
    console.log("Payment document data:", { paymentStatus, expiryDate });

    const now = new Date().getTime();
    const active = paymentStatus === "active" && now < expiryDate;

    return new Response(JSON.stringify({ active }), { status: 200 });
  } catch (error) {
    console.error("Error in check-payment route:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500 }
    );
  }
}
