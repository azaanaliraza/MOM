"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { City } from 'country-state-city';

export default function OnboardingForm({ initialPrompt, userId, onClose }: { initialPrompt: string, userId: string, onClose: () => void }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Comprehensive India Cities (4000+)
  const [allCities] = useState(() => City.getCitiesOfCountry('IN') || []);
  const [citySearch, setCitySearch] = useState("");
  
  const [locSearch, setLocSearch] = useState("");
  const [localities, setLocalities] = useState<string[]>([]);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  const loadingMessages = [
    "GENERATING ENGINE...",
    "HOLD ON WHILE AI IS WORKING...",
    "ANALYZING MARKET DATA...",
    "CRAFTING YOUR ROADMAP...",
    "OPTIMIZING BUSINESS STRATEGY..."
  ];
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const [formData, setFormData] = useState({
    shopName: "",
    city: "",
    address: "",
    monthlyRevenue: "",
    category: "Retail", // Retail, Food, Service
    whatsapp: ""
  });

  useEffect(() => {
    if (formData.city && locSearch.length > 1) {
      setFetchingLoc(true);
      const timer = setTimeout(() => {
        const cleanCityName = formData.city.split(',')[0].trim();
        fetch(`https://nominatim.openstreetmap.org/search?q=${locSearch}+in+${cleanCityName}+India&format=json&limit=10`)
          .then(r => r.json())
          .then(data => {
             if (data && data.length > 0) {
               // Extract just the specific local area/street name from the display_name
               const areas = data.map((d: any) => d.display_name.split(',')[0].trim());
               setLocalities(Array.from(new Set(areas)) as string[]);
             } else {
               setLocalities([]);
             }
          })
          .catch(() => setLocalities([]))
          .finally(() => setFetchingLoc(false));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLocalities([]);
    }
  }, [formData.city, locSearch]);

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
              <div className="space-y-4 relative">
                <input 
                  autoFocus
                  placeholder="Search City (e.g. Mumbai)"
                  className="w-full text-xl font-light border-b border-stone-100 py-4 outline-none pr-10"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    if (e.target.value === "") setFormData({...formData, city: "", address: ""});
                  }}
                />
                <Search size={18} className="absolute right-3 top-5 text-stone-300" />
                
                {/* Dropdown of matching cities */}
                {citySearch.length > 1 && !formData.city && (
                  <div className="absolute top-16 left-0 right-0 max-h-48 overflow-y-auto bg-white border border-stone-100 shadow-xl rounded-xl z-20">
                    {allCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 50).map(c => (
                      <div 
                        key={`${c.name}-${c.stateCode}`} 
                        className="py-3 px-4 hover:bg-stone-50 cursor-pointer text-sm font-medium border-b border-stone-50"
                        onClick={() => {
                          setFormData({...formData, city: c.name, address: ""});
                          setCitySearch(c.name);
                        }}
                      >
                        {c.name}, {c.stateCode}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Location Selection via Autocomplete */}
                {formData.city && (
                   <div className="relative">
                     <div className="flex items-center border-b border-stone-100 py-4">
                       <input 
                         placeholder={`Search specific area in ${formData.city}`}
                         className="w-full text-xl font-light outline-none pr-10"
                         value={formData.address ? formData.address : locSearch}
                         onChange={(e) => {
                           setFormData({...formData, address: ""});
                           setLocSearch(e.target.value);
                         }}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') handleNext();
                         }}
                       />
                       {fetchingLoc ? <Loader2 size={18} className="animate-spin text-stone-300 absolute right-3" /> : <Search size={18} className="text-stone-300 absolute right-3" />}
                     </div>

                     {/* Dropdown of local areas inside the city */}
                     {locSearch.length > 1 && !formData.address && localities.length > 0 && (
                       <div className="absolute top-16 left-0 right-0 max-h-48 overflow-y-auto bg-white border border-stone-100 shadow-xl rounded-xl z-20">
                         {localities.map((loc, idx) => (
                           <div 
                             key={idx} 
                             className="py-3 px-4 hover:bg-stone-50 cursor-pointer text-sm font-medium border-b border-stone-50"
                             onClick={() => {
                               setFormData({...formData, address: loc});
                               setLocSearch("");
                             }}
                           >
                             📍 {loc}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                )}
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
                  placeholder="WhatsApp Number (10 digits)"
                  className="w-full text-xl font-light border-b border-stone-100 py-4 outline-none"
                  value={formData.whatsapp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) setFormData({...formData, whatsapp: val});
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && formData.whatsapp.length === 10 && handleNext()}
                />
              </div>
            </motion.div>
          )}
        </div>

        <button 
          onClick={handleNext}
          disabled={
            loading || 
            (step === 1 && !formData.shopName) || 
            (step === 2 && (!formData.city || !formData.address)) || 
            (step === 3 && (!formData.monthlyRevenue || formData.whatsapp.length !== 10))
          }
          className="w-full py-6 bg-stone-900 text-white rounded-2xl font-bold text-sm tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50"
        >
          {loading ? (
             <>
               <Loader2 className="animate-spin" size={20} />
               <AnimatePresence mode="wait">
                 <motion.span 
                   key={loadingMsgIdx}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.2 }}
                 >
                   {loadingMessages[loadingMsgIdx]}
                 </motion.span>
               </AnimatePresence>
             </>
          ) : step === 3 ? "LAUNCH MOM" : "CONTINUE"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>
    </motion.div>
  );
}
