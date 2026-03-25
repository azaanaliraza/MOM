"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";

export default function OnboardingForm({ initialPrompt, userId, onClose }: { initialPrompt: string, userId: string, onClose: () => void }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: "",
    city: "",
    address: "",
    monthlyRevenue: "",
    category: "Retail", // Retail, Food, Service
    whatsapp: ""
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!isLoaded || !isSignedIn || !user) {
        // Force a sign-in if they aren't ready
        return;
    }
    
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          initialPrompt,
          userId: user.id // Pass the actual clerk user ID
        }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const err = await res.json();
        alert("Generation failed: " + (err.details || "Check your limit."));
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6"
    >
      <button onClick={onClose} className="absolute top-12 right-12 opacity-20 hover:opacity-100 transition-opacity">
        <X size={24} />
      </button>

      <div className="max-w-md w-full space-y-12">
        {/* PROGRESS DOTS */}
        <div className="flex gap-2 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all ${step === s ? 'bg-stone-900 w-6' : 'bg-stone-100'}`} />
          ))}
        </div>

        <div className="min-h-[300px] flex flex-col justify-center">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Identity</p>
                <h3 className="text-3xl font-medium tracking-tight">What is your shop called?</h3>
              </div>
              <input 
                autoFocus
                placeholder="Shop Name"
                className="w-full text-2xl font-light border-b border-stone-100 py-4 outline-none placeholder:text-stone-100"
                value={formData.shopName}
                onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Location</p>
                <h3 className="text-3xl font-medium tracking-tight">Where should we deliver?</h3>
              </div>
              <div className="space-y-4">
                <input 
                  autoFocus
                  placeholder="City Name"
                  className="w-full text-xl font-light border-b border-stone-100 py-4 outline-none"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
                <input 
                  placeholder="Full Address (Area/Street)"
                  className="w-full text-xl font-light border-b border-stone-100 py-4 outline-none"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Context</p>
                <h3 className="text-3xl font-medium tracking-tight">Financial & Contact</h3>
              </div>
              <div className="space-y-4">
                <input 
                  autoFocus
                  type="number"
                  placeholder="Monthly Revenue (Target)"
                  className="w-full text-xl font-light border-b border-stone-100 py-4 outline-none"
                  value={formData.monthlyRevenue}
                  onChange={(e) => setFormData({...formData, monthlyRevenue: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
                <input 
                  placeholder="WhatsApp Number"
                  className="w-full text-xl font-light border-b border-stone-100 py-4 outline-none"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
              </div>
            </motion.div>
          )}
        </div>

        <button 
          onClick={handleNext}
          disabled={loading}
          className="w-full py-6 bg-stone-900 text-white rounded-2xl font-bold text-sm tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-4 shadow-xl"
        >
          {loading ? (
             <>
               <Loader2 className="animate-spin" size={20} />
               <span>GENERATING ENGINE...</span>
             </>
          ) : step === 3 ? "LAUNCH VIGYAPAN" : "CONTINUE"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>
    </motion.div>
  );
}
