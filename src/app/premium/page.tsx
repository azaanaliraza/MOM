"use client";
import { Check, Zap, Sparkles } from "lucide-react";
import Script from "next/script";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function PremiumPage() {
  const { user } = useUser();
  const updatePremiumStatus = useMutation(api.users.makeUserPremium);
  // Using query logic to check if user is already premium
  const dbUser = useQuery(api.users.getUser, user ? { clerkId: user.id } : "skip");

  const handlePayment = async () => {
    // 1. Create order on your server
    const res = await fetch("/api/payments/razorpay", { method: "POST" });
    const order = await res.json();

    if (order.error) {
      alert("Error creating order: " + order.error);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: "INR",
      name: "MOM",
      description: "Unlock Agent Karya Premium",
      order_id: order.id,
      handler: async function (response: any) {
        // 🔥 THIS IS THE FIX:
        try {
          console.log("Payment verified. Updating Convex...");
          
          // Ensure user.id exists
          if (!user?.id) {
            alert("Error: User session not found. Please log in again.");
            return;
          }

          // Call the mutation and WAIT for it to finish
          const result = await updatePremiumStatus({ clerkId: user.id });

          if (result && result.success) {
            alert("Welcome to the Premium Club, Bhaiya!");
            window.location.href = "/dashboard?upgrade=success";
          }
        } catch (error) {
          console.error("Database update failed:", error);
          alert("Payment was successful, but we couldn't update your account. Please contact support.");
        }
      },
      prefill: {
        name: user?.fullName,
        email: user?.primaryEmailAddress?.emailAddress,
      },
      theme: { color: "#4f46e5" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };


  return (
    <div className="min-h-screen bg-white py-20 px-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <div className="flex justify-center mb-8">
          <Link href="/" className="text-xl font-extrabold tracking-tighter bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">MOM</Link>
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-stone-900 uppercase">
          Upgrade to <span className="text-indigo-600">Pro</span>
        </h1>
        <p className="text-stone-500 text-lg">Stop guessing. Start growing with Agent Karya.</p>
      </div>

      <div className="mt-16 max-w-md mx-auto p-12 bg-stone-50 rounded-[4rem] border border-stone-100 shadow-2xl shadow-indigo-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6">
          <Sparkles className="text-indigo-400 opacity-20" size={100} />
        </div>

        <div className="space-y-8 relative z-10">
          <div>
            <span className="px-4 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Most Popular
            </span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-black text-stone-900">₹999</span>
              <span className="text-stone-400 font-medium">/month</span>
            </div>
          </div>

          <ul className="space-y-4">
            {[
              "Unlock Agent Karya (Full 30-Day Execution)",
              "AI Vision: Extract Menus & Product Info",
              "Unlimited 4K Marketing Posters (Flux)",
              "Shadow Audit: Spy on Competitors",
              "Priority Support for local Businesses"
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-stone-700 font-medium">
                <Check size={18} className="text-indigo-500 bg-indigo-50 p-0.5 rounded-full" />
                {feature}
              </li>
            ))}
          </ul>

          <button 
            onClick={handlePayment}
            disabled={dbUser?.isPremium}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {dbUser?.isPremium ? "Already Premium" : <><Zap size={16} fill="white"/> Activate Now</>}
          </button>
        </div>
      </div>
    </div>
  );
}
