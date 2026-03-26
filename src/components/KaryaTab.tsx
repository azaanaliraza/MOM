"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { 
  Search, Terminal, Copy, Download, Sparkles, MapPin, 
  ExternalLink, Zap, AlertCircle, Video, Image as ImageIcon, 
  Camera, Globe, Link2, Plus, Save, Trash2, Info, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import VisionVault from "./VisionVault";
import { Id } from "../../convex/_generated/dataModel";

interface KaryaTabProps {
  dayTask?: string;
  roadmapId: Id<"roadmaps">;
  roadmapData?: any;
  currentDay?: number;
}

export default function KaryaTab({ dayTask, roadmapId, roadmapData, currentDay = 1 }: KaryaTabProps) {
  const { user } = useUser();
  
  const allRoadmaps = useQuery(api.roadmaps.listMyRoadmaps, user ? { userId: user.id } : "skip");
  const currentRoadmap = allRoadmaps?.find(r => r._id === roadmapId);

  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [generatedReel, setGeneratedReel] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [reelLoading, setReelLoading] = useState(false);



  const startKarya = async () => {
    const aiContext = currentRoadmap?.businessVault?.aiContext;
    const manualContext = currentRoadmap?.manualContext;

    setLoading(true);
    setError(null);
    setGeneratedResult(null);
    setGeneratedPoster(null);
    setGeneratedReel(null);

    try {
      setLoadingStep("Agent is synthesizing context & goals...");
      const brainRes = await fetch('/api/karya/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aiContext: aiContext || "", 
          manualContext: manualContext || "",
          dayTask: dayTask || "General local outreach",
          roadmapData: roadmapData,
          currentDay: currentDay,
          brandName: currentRoadmap?.brandName,
          location: currentRoadmap?.location,
          category: currentRoadmap?.category
        }),
      });

      const decision = await brainRes.json();
      if (decision.error) throw new Error(decision.error);
      setGeneratedResult(decision);

      if (decision.type === 'poster' && decision.imagePrompt) {
          generatePoster(decision.imagePrompt);
      } else if (decision.type === 'reel' || decision.type === 'video') {
          generateReel(decision.videoPrompt || decision.imagePrompt || "Cinematic business promo");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Execution engine failure.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const generatePoster = async (prompt: string) => {
    setPosterLoading(true);
    try {
        const res = await fetch("/api/karya/generate/image", {
            method: "POST",
            body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.imageUrl) setGeneratedPoster(data.imageUrl);
    } catch (e) {
        console.error("Poster generation failed", e);
    } finally {
        setPosterLoading(false);
    }
  };

  const generateReel = async (prompt: string) => {
    setReelLoading(true);
    try {
        const res = await fetch("/api/karya/generate/video", {
            method: "POST",
            body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.videoUrl) setGeneratedReel(data.videoUrl);
    } catch (e) {
        console.error("Reel generation failed", e);
    } finally {
        setReelLoading(false);
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 overflow-visible">
      <header className="space-y-4">
        <h2 className="text-5xl font-light italic tracking-tighter">Agent Karya</h2>
        <p className="text-stone-400 text-lg max-w-lg font-medium leading-relaxed">
          The executor. Build your <span className="text-indigo-600 font-bold">Business Command Center</span> by providing AI Vision and manual context.
        </p>
      </header>

      {/* COMMAND CENTER: VISION + MANUAL CONTEXT */}
      <VisionVault roadmapId={roadmapId} />

      <div className="flex justify-center">
        <button 
          onClick={startKarya} 
          disabled={loading}
          className={`px-16 py-6 ${loading ? 'bg-stone-100 animate-pulse text-stone-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-[2.5rem] text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-indigo-200`}
        >
          {loading ? loadingStep : `Sync & Execute Dashboard`}
        </button>
      </div>
      
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 px-6 text-red-500 text-[10px] font-black uppercase tracking-widest">
          <AlertCircle size={14} /> {error}
        </motion.div>
      )}

      {generatedResult && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start animate-in fade-in zoom-in-95 duration-700">
                {/* LEFT: MEMORY STATUS */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-10 bg-white border border-stone-100 rounded-[3.5rem] shadow-2xl shadow-stone-200/40 space-y-8">
                        <header className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-indigo-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Roadmap Intelligence</h3>
                            </div>
                        </header>

                        <div className="space-y-6">
                            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2">
                                <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Context Synchronized</p>
                                <p className="text-[9px] font-bold text-stone-400 uppercase">Vision Intelligence + Manual Notes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: AGENT BRAIN OUTPUT */}
                <div className="lg:col-span-3 p-10 bg-white border border-stone-100 rounded-[4rem] shadow-2xl shadow-stone-200/40">
                    <div className="space-y-8">
                        <header className="flex justify-between items-start">
                            <div className="space-y-2">
                                <span className="inline-block px-3 py-1 bg-indigo-50 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100">Command Center Strategy</span>
                                <h4 className="text-2xl font-extrabold tracking-tight italic">
                                    {generatedResult?.type === 'reel' ? "Cinematic Business Reel" : 
                                     generatedResult?.type === 'poster' ? "High-Quality Poster Design" : "Execution Guide"}
                                </h4>
                            </div>
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <Sparkles size={18} className="text-indigo-600" />
                            </div>
                        </header>

                        <div className="prose prose-stone prose-sm max-w-none prose-headings:font-black prose-h1:text-xl prose-h3:text-sm text-stone-800 font-sans leading-relaxed selection:bg-indigo-100">
                            <ReactMarkdown>
                                {generatedResult.report}
                            </ReactMarkdown>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => generatedResult && navigator.clipboard.writeText(generatedResult.report)}
                                className="flex-1 py-5 bg-stone-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                            >
                                <Copy size={12} /> Copy Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
      )}

      {/* GENERATED VISUAL ASSETS */}
      {(generatedPoster || posterLoading || generatedReel || reelLoading) && (
          <div className="space-y-8 pt-8 border-t border-stone-100 animate-in fade-in zoom-in-95 duration-700">
              <div className="flex items-center gap-4">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-stone-300">Toolbox Output</h4>
                  <div className="h-[1px] flex-1 bg-stone-100" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className={`p-10 bg-white border border-stone-100 rounded-[3.5rem] transition-all duration-500 overflow-hidden relative group ${!generatedPoster && !posterLoading ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:shadow-2xl'}`}>
                      <div className="aspect-square w-full bg-stone-50 rounded-[2.5rem] overflow-hidden relative flex items-center justify-center border border-stone-50">
                          {generatedPoster ? (
                              <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={generatedPoster} className="w-full h-full object-cover" alt="AI Poster" />
                          ) : (
                              <div className="flex flex-col items-center gap-4 opacity-40">
                                  {posterLoading ? <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" /> : <ImageIcon size={48} />}
                                  <p className="text-[10px] font-black uppercase tracking-widest">{posterLoading ? "Designing..." : "Waiting"}</p>
                              </div>
                          )}
                      </div>
                      <div className="mt-8 flex justify-between items-center px-4">
                          <p className="text-[11px] font-black uppercase tracking-widest text-stone-900">Custom Poster</p>
                          <button disabled={!generatedPoster} className="p-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl disabled:opacity-30">
                              <Download size={16} />
                          </button>
                      </div>
                  </div>

                  <div className={`p-10 bg-indigo-950 text-white rounded-[3.5rem] transition-all duration-500 relative group overflow-hidden ${!generatedReel && !reelLoading ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:shadow-2xl shadow-indigo-900/40'}`}>
                      <div className="aspect-[9/16] w-full bg-white/5 rounded-[2.5rem] overflow-hidden relative flex items-center justify-center border border-white/5">
                          {generatedReel ? (
                              <motion.img 
                                  initial={{ opacity: 0 }} 
                                  animate={{ opacity: 1, scale: [1, 1.15] }} 
                                  src={generatedReel} 
                                  transition={{ 
                                      opacity: { duration: 0.5 },
                                      scale: { duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" } 
                                  }}
                                  className="w-full h-full object-cover" 
                              />
                          ) : (
                              <div className="flex flex-col items-center gap-4 opacity-40">
                                  {reelLoading ? <div className="w-10 h-10 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Video size={48} />}
                                  <p className="text-[10px] font-black uppercase tracking-widest">{reelLoading ? "Editing..." : "Waiting"}</p>
                              </div>
                          )}
                      </div>
                      <div className="mt-8 flex justify-between items-center px-4 relative z-10">
                          <p className="text-[11px] font-black uppercase tracking-widest text-white">Engagement Reel</p>
                          <button disabled={!generatedReel} className="p-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors border border-white/10 disabled:opacity-30">
                              <Download size={16} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
