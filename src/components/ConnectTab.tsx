"use client";
import React, { useState } from 'react';
import { MessageSquare, MapPin, Camera, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from 'framer-motion';

export default function ConnectTab() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<string[]>(["whatsapp"]);
  const [confirming, setConfirming] = useState<any>(null);
  
  const roadmap = useQuery(api.roadmaps.getLatest, user ? { userId: user.id } : "skip");
  const postToSocial = useAction(api.whatsapp.postToSocial);
  const getConnectedPlatforms = useAction(api.whatsapp.getConnectedPlatforms);
  const clearPendingApproval = useMutation(api.roadmaps.clearPendingApproval);

  React.useEffect(() => {
    if (user) {
      getConnectedPlatforms({ clerkId: user.id }).then(platforms => {
        setActiveConnections(["whatsapp", ...platforms]);
      });
    }
  }, [user, getConnectedPlatforms]);
  
  const platforms = [
    { 
      id: "whatsapp",
      name: "WhatsApp", 
      icon: <MessageSquare className="text-green-500" size={28} />, 
      description: "Automate daily task notifications and reminders.",
      connected: activeConnections.includes("whatsapp") 
    },
    { 
      id: "googlebusinessprofile",
      name: "Google Business (GMB)", 
      icon: <MapPin className="text-blue-500" size={28} />, 
      description: "Post updates and local news to Google Maps.",
      connected: activeConnections.includes("googlebusinessprofile")
    },
    { 
      id: "instagram",
      name: "Instagram Meta", 
      icon: <Camera className="text-pink-500" size={28} />, 
      description: "Post Reels directly to your business profile.",
      connected: activeConnections.includes("instagram"),
      authConfigId: "ac_N7Zr6qH26T7k" 
    }
  ];

  const handleConnect = async (platformId: string, authConfigId?: string) => {
    if (!user) return;
    setLoading(platformId);
    try {
      const response = await fetch('/api/composio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           platform: platformId.toUpperCase(), 
           clerkId: user.id,
           authConfigId: authConfigId
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("[MOM] Connection failed", error);
    } finally {
      setLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!user || !roadmap || !confirming) return;
    setLoading(confirming.id);
    try {
      await postToSocial({
        clerkId: user.id,
        platform: confirming.type === "gmb_post" ? "googlebusinessprofile" : "instagram",
        content: confirming.content
      });
      await clearPendingApproval({ roadmapId: roadmap._id, itemId: confirming.id });
    } catch (e) {
      console.error("Post failed", e);
    } finally {
      setLoading(null);
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* APPROVAL MODAL */}
      {confirming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3rem] p-10 max-w-xl w-full shadow-2xl space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Zap size={24} className="text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-stone-900 leading-tight">Ready to Publish?</h4>
                <p className="text-stone-400 text-sm font-medium">Agent Karya is standing by.</p>
              </div>
            </div>

            {confirming.type.includes('instagram') ? (
               <div className="mx-auto w-[280px] bg-white border border-stone-200 rounded-[2.5rem] p-4 shadow-xl shadow-stone-200/50 flex flex-col gap-3">
                 <div className="flex items-center gap-2 mb-1">
                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px]">
                     <div className="w-full h-full bg-white rounded-full border-2 border-white flex items-center justify-center">
                       <Zap size={10} className="text-pink-500" />
                     </div>
                   </div>
                   <div className="text-[11px] font-bold text-stone-900">Your Business</div>
                 </div>
                 <div className="w-full h-[340px] bg-stone-100 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                   {confirming.imageUrl && (
                     <img src={confirming.imageUrl} className="absolute inset-0 w-full h-full object-cover z-0" alt="Generated post" />
                   )}
                   {confirming.type === 'instagram_reel' ? (
                     <div className="absolute inset-0 bg-stone-900/20 flex flex-col items-center justify-center backdrop-blur-[2px] z-10 transition-all group-hover:bg-stone-900/40">
                       <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg border border-white backdrop-blur-md cursor-pointer hover:scale-110 transition-transform">
                         <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-stone-900 border-b-[8px] border-b-transparent ml-1" />
                       </div>
                       <p className="mt-3 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">Review AI Reel</p>
                     </div>
                   ) : confirming.imageUrl ? null : (
                     <div className="text-stone-400 font-bold uppercase tracking-widest text-[10px] z-10 relative">AI Generated Image</div>
                   )}
                 </div>
                 <div className="flex gap-3 text-stone-900 px-1 pt-1">
                    <div className="hover:opacity-50 cursor-pointer"><p className="text-lg">❤️</p></div>
                    <div className="hover:opacity-50 cursor-pointer"><p className="text-lg">💬</p></div>
                    <div className="hover:opacity-50 cursor-pointer"><p className="text-lg">✈️</p></div>
                 </div>
                 <div className="px-1 max-h-24 overflow-y-auto custom-scrollbar">
                   <p className="text-[11px] text-stone-800 leading-relaxed font-medium">
                     <span className="font-bold mr-1">Your Business</span>
                     {confirming.content}
                   </p>
                 </div>
               </div>
             ) : confirming.type === 'gmb_post' ? (
               <div className="w-full bg-white border border-stone-200 rounded-3xl p-5 shadow-xl shadow-stone-200/50">
                 <div className="flex gap-4">
                   <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-lg">MB</div>
                   <div className="flex-1">
                     <p className="font-bold text-stone-900 text-sm">Your Local Business</p>
                     <p className="text-[10px] text-stone-400 font-medium">Just now • Google Updates</p>
                     <div className="mt-4 pb-2">
                       <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">{confirming.content}</p>
                     </div>
                     <div className="w-full h-40 bg-stone-100 rounded-2xl flex items-center justify-center mt-3 mb-2 border border-stone-200 overflow-hidden relative">
                       {confirming.imageUrl ? (
                         <img src={confirming.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Generated GMB preview" />
                       ) : (
                         <p className="text-[10px] font-black tracking-widest text-stone-400 uppercase relative z-10">Promo Image Preview</p>
                       )}
                     </div>
                     <button className="w-fit mt-3 px-4 py-1.5 bg-blue-50 text-blue-600 font-bold text-[11px] rounded-full uppercase tracking-wider hover:bg-blue-100 transition-colors">Learn More</button>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="p-8 bg-stone-50 rounded-3xl border border-stone-100 italic text-stone-600 leading-relaxed font-bold">
                  "{confirming.content}"
               </div>
             )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleApprove}
                disabled={loading === confirming.id}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading === confirming.id ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Yes, Post Automatically"}
              </button>
              <button 
                onClick={() => setConfirming(null)}
                className="w-full py-5 bg-stone-100 text-stone-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-stone-200 transition-all"
              >
                Go Back / Edit
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap size={20} className="text-white" />
          </div>
          <h2 className="text-4xl font-black tracking-tight text-stone-900 leading-none">Vault Connections</h2>
        </div>
        <p className="text-stone-400 text-lg max-w-lg font-medium leading-relaxed">
          Link your accounts to allow Agent Karya to execute your marketing strategy.
        </p>
      </header>

      {/* PENDING APPROVALS SECTION */}
      {roadmap?.pendingApprovals && roadmap.pendingApprovals.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-4">
            <Zap className="text-indigo-600 animate-pulse" size={14} />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">Pending Agent Approvals</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmap.pendingApprovals.map((item: any) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id} 
                className="p-8 bg-indigo-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden group border border-indigo-800"
              >
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-50" />
                
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                    {item.type === 'gmb_post' ? <MapPin size={18} className="text-blue-400" /> : <Camera size={18} className="text-pink-400" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">{item.type.replace(/_/g, ' ')}</p>
                    <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Ready for Agent to Post</p>
                  </div>
                </div>
                
                <div className="p-6 bg-white/5 rounded-2xl mb-8 border border-white/5 relative z-10 hover:bg-white/10 transition-colors">
                  <p className="text-sm text-indigo-50 leading-relaxed font-medium italic truncate">"{item.content}"</p>
                </div>

                <div className="flex gap-3 relative z-10">
                  <button 
                    onClick={() => setConfirming(item)}
                    disabled={loading === item.id}
                    className="flex-1 py-4 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 shadow-xl disabled:bg-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 group/btn"
                  >
                    {loading === item.id ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={12} className="group-hover/btn:animate-bounce" />Review & Approve</>}
                  </button>
                  <button 
                    onClick={() => clearPendingApproval({ roadmapId: roadmap._id, itemId: item.id })}
                    className="px-6 py-4 bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {platforms.map((p) => (
          <div key={p.id} className="p-10 bg-white border border-stone-100 rounded-[3rem] shadow-xl shadow-stone-200/20 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all group relative overflow-hidden">
            <div className="p-4 bg-stone-50 w-fit rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
              {p.icon}
            </div>
            
            <h3 className="text-xl font-black text-stone-900 mb-3">{p.name}</h3>
            <p className="text-sm text-stone-400 font-medium leading-relaxed mb-10">{p.description}</p>
            
            {p.connected ? (
              <div className="flex items-center gap-2 px-6 py-4 bg-green-50 text-green-600 border border-green-100 rounded-2xl">
                <CheckCircle2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-center flex-1">Connected</span>
              </div>
            ) : (
              <button 
                onClick={() => handleConnect(p.id, (p as any).authConfigId)}
                disabled={loading === p.id}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                  loading === p.id 
                    ? 'bg-stone-100 text-stone-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {loading === p.id ? <Loader2 size={16} className="animate-spin" /> : <>Connect Account</>}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-10 bg-stone-900 rounded-[3.5rem] text-white relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <Zap size={140} />
        </div>
        <div className="bg-white/10 p-5 rounded-3xl h-fit border border-white/5">
          <AlertCircle size={24} className="text-indigo-300" />
        </div>
        <div className="space-y-3 relative z-10">
          <h4 className="text-xl font-black tracking-tight">Security & Privacy</h4>
          <p className="text-sm text-stone-400 font-medium max-w-2xl leading-relaxed">
            MOM uses Composio and AES-256 bank-level encryption. Agent Karya will <span className="text-white font-bold italic">ALWAYS</span> ask for your approval on WhatsApp before posting anything public.
          </p>
        </div>
      </div>
    </div>
  );
}
