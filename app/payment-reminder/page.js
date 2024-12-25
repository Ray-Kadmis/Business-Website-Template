"use client";
const PaymentReminder = () => {
  const redirectToPayment = async () => {
    try {
      const res = await fetch("./dashboard/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "rehanworks200@gmail.com" }), // Admin's email
      });

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert("Error creating checkout session. Please try again.");
      }
    } catch (error) {
      console.error("Error redirecting to payment:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payment Required</h1>
      <p className="mb-6">
        Your subscription has expired. Please renew to access the dashboard.
      </p>
      <button
        onClick={redirectToPayment}
        className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Renew Subscription
      </button>
    </div>
  );
};

export default PaymentReminder;
