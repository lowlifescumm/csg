"use client";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiClient } from "@/lib/api-client";

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
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Confirm payment using PaymentElement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/credits?success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        throw new Error('Payment requires additional verification');
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <PaymentElement 
          options={{
            layout: 'tabs',
            business: { name: 'Cosmic Spiritual Guide' },
            fields: {
              billingDetails: {
                address: 'auto',
              }
            }
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 hover:from-purple-700 hover:to-pink-700 transition"
      >
        {loading ? "Processing..." : `Pay $${(pack.price / 100).toFixed(2)} for ${pack.name}`}
      </button>
    </form>
  );
}

function CheckoutWrapper({ pack, onSuccess, onError }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create payment intent when pack is selected
    const createPaymentIntent = async () => {
      try {
        const data = await apiClient.post("/api/credits/purchase", { packSize: pack.size, packPrice: pack.price });
        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          onError(data.error || "Failed to initialize payment");
        }
      } catch (error) {
        onError("Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [pack]);

  if (loading) {
    return <div className="text-center py-4">Initializing payment...</div>;
  }

  if (!clientSecret) {
    return <div className="text-center py-4 text-red-600">Failed to initialize payment</div>;
  }

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#9333ea',
          },
        },
      }}
    >
      <CheckoutForm 
        pack={pack} 
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default function CreditsPage() {
  const [selectedPack, setSelectedPack] = useState(null);
  const [message, setMessage] = useState("");
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    // Fetch the authoritative credit balance (credit_ledger)
    apiClient.get("/api/credits")
      .then(data => {
        const bal = data?.balance ?? data?.credits ?? data?.stats?.totalAvailable ?? 0;
        setUserCredits(bal);
      })
      .catch(() => {});
  }, []);

  const handleSuccess = () => {
    setMessage("Credits added successfully!");
    setSelectedPack(null);
    // Refresh credits from the authoritative source
    apiClient.get("/api/credits")
      .then(data => {
        const bal = data?.balance ?? data?.credits ?? data?.stats?.totalAvailable ?? 0;
        setUserCredits(bal);
      })
      .catch(() => {});
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
          <CheckoutWrapper
            pack={selectedPack} 
            onSuccess={handleSuccess}
            onError={handleError}
          />
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
