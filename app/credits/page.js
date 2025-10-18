"use client";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const creditPacks = [
  { size: 10, price: 999, name: "10 Credits", description: "Perfect for trying out readings" },
  { size: 25, price: 1999, name: "25 Credits", description: "Great for regular use" },
  { size: 50, price: 3499, name: "50 Credits", description: "Best value for frequent users" },
  { size: 100, price: 5999, name: "100 Credits", description: "Maximum value pack" }
];

function CheckoutForm({ pack, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Create payment intent
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSize: pack.size, packPrice: pack.price })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (error) throw error;
      onSuccess();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement className="p-3 border rounded" />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? "Processing..." : `Buy ${pack.name} - $${(pack.price / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function CreditsPage() {
  const [selectedPack, setSelectedPack] = useState(null);
  const [message, setMessage] = useState("");
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    // Fetch user credits
    fetch("/api/auth/user")
      .then(res => res.json())
      .then(data => {
        if (data.user?.credits) setUserCredits(data.user.credits);
      })
      .catch(() => {});
  }, []);

  const handleSuccess = () => {
    setMessage("Credits added successfully!");
    setSelectedPack(null);
    // Refresh credits
    fetch("/api/auth/user")
      .then(res => res.json())
      .then(data => {
        if (data.user?.credits) setUserCredits(data.user.credits);
      });
  };

  const handleError = (error) => {
    setMessage(`Error: ${error}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Purchase Credits</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold">Your Credits: {userCredits}</h2>
        <p className="text-sm text-gray-600">Each reading costs 1 credit</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creditPacks.map((pack) => (
          <div key={pack.size} className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold">{pack.name}</h3>
            <p className="text-gray-600 mb-4">{pack.description}</p>
            <p className="text-2xl font-bold text-purple-600">${(pack.price / 100).toFixed(2)}</p>
            <button
              onClick={() => setSelectedPack(pack)}
              className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
            >
              Select Pack
            </button>
          </div>
        ))}
      </div>

      {selectedPack && (
        <div className="mt-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">Complete Purchase</h3>
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              pack={selectedPack} 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
          <button
            onClick={() => setSelectedPack(null)}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
