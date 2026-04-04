"use client";
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Play, MapPin, ExternalLink, Lightbulb, Sparkles, TrendingUp, Zap, ChevronDown, Plus, CheckCircle, Circle } from 'lucide-react';
import ChatAgent from '../../components/ChatAgent';
import KaryaTab from '@/components/KaryaTab';
import ConnectTab from '@/components/ConnectTab';
import Link from 'next/link';

export default function AdvancedDashboard() {
  const { user } = useUser();

  // 1. Fetch all roadmaps
  const allRoadmaps = useQuery(api.roadmaps.listMyRoadmaps, user ? { userId: user.id } : "skip");
  const dbUser = useQuery(api.users.getUser, user ? { clerkId: user.id } : "skip");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'karya' | 'connect'>('strategy');

  const fullRoadmap = useQuery(api.roadmaps.getRoadmap, selectedId ? { roadmapId: selectedId as any } : "skip");

  // Set the first one as default if none selected
  useEffect(() => {
    if (allRoadmaps && allRoadmaps.length > 0 && !selectedId) {
      setSelectedId(allRoadmaps[0]._id);
    }
  }, [allRoadmaps, selectedId]);

  const [activeDay, setActiveDay] = useState<number>(1);
  const toggleTask = useMutation(api.roadmaps.toggleTaskCompletion);

  if (allRoadmaps === undefined || dbUser === undefined || (selectedId && fullRoadmap === undefined)) {
    return <div className="h-screen flex items-center justify-center bg-surface transition-all duration-1000"><div className="node-pulse w-12 h-12 bg-indigo-600/20 rounded-full" /></div>;
  }

  if (allRoadmaps.length === 0 || !fullRoadmap) return (
    <div className="h-screen flex flex-col items-center justify-center bg-surface gap-6 animate-in fade-in zoom-in duration-700">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
        <Zap size={40} className="text-indigo-600" />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black text-stone-900 tracking-tighter mb-2">Engine Not Found</h2>
        <p className="text-stone-400 font-medium">Head back home to launch your first marketing engine.</p>
      </div>
      <a href="/" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">Launch Now</a>
    </div>
  );

  const d = fullRoadmap.data || {};
  const thirtyDayPlan = d.thirtyDayPlan || d.roadmap || [];
  const brand = d.brand || { name: fullRoadmap.brandName, city: fullRoadmap.location, tagline: "Marketing Engine Active" };
  const weeklyThemes = d.weeklyThemes || d.weekly_intelligence || [];

  const selectedDayData = thirtyDayPlan.find((r: any) => r.day === activeDay) || thirtyDayPlan[0];
  const completedDays = fullRoadmap.completedDays || [];
  const completedCount = completedDays.length;

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-32 selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="bg-white/70 backdrop-blur-xl border-b border-stone-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-stone-900 group-hover:text-indigo-600 transition-colors">MOM</span>
          </Link>

          <div className="h-8 w-[1px] bg-stone-100 hidden md:block" />

          {/* TAB SWITCHER */}
          <div className="flex bg-stone-50 p-1 rounded-full border border-stone-100">
            <button 
              onClick={() => setActiveTab('strategy')} 
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'strategy' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-300'}`}
            >
              Strategy
            </button>
            <button 
              onClick={() => setActiveTab('karya')} 
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'karya' ? 'bg-indigo-900 text-white shadow-lg' : 'text-stone-300'}`}
            >
              <Sparkles size={10} /> Karya
            </button>
            <button 
              onClick={() => setActiveTab('connect')} 
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'connect' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-300'}`}
            >
              Connect
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          {/* ROADMAP SWITCHER (ONLY SHOW IN STRATEGY) */}
          {activeTab === 'strategy' && (
            <div className="relative group hidden lg:block">
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-900 hover:text-indigo-600 transition-colors">
                {brand.name} <ChevronDown size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-stone-100 shadow-2xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {allRoadmaps?.map(r => (
                    <button
                      key={r._id}
                      onClick={() => setSelectedId(r._id)}
                      className={`w-full text-left px-6 py-4 text-[10px] font-bold uppercase transition-colors border-b border-stone-50 last:border-none hover:bg-stone-50 ${selectedId === r._id ? 'text-indigo-600 bg-indigo-50/30' : 'text-stone-400'}`}
                    >
                      {r.brandName}
                    </button>
                  ))}
                </div>
                <a href="/" className="flex items-center gap-2 px-6 py-5 text-[10px] font-black text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors uppercase tracking-widest border-t border-indigo-100/30">
                  <Plus size={10} /> New Roadmap
                </a>
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-100">
            <MapPin size={12} className="text-stone-400" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">{brand.city}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              href="/premium"
              className="hidden sm:flex items-center gap-2 px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-[10px] font-black uppercase rounded-full shadow-lg shadow-yellow-100 transition-all active:scale-95"
            >
              <Zap size={10} fill="black" /> {dbUser?.isPremium ? "VIP" : "Upgrade"}
            </Link>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12 min-h-[60vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'strategy' && (
            <motion.div 
              key="strategy" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* 1. BRAND DNA HEADER */}
              <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                    <Sparkles size={10} className="text-indigo-600" />
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Active Marketing DNA</span>
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter text-stone-900 leading-[0.9] mb-4">
                    {brand.tagline || "Hyper-Execution Strategy"}
                  </h2>
                  <p className="text-stone-400 font-medium max-w-md text-sm leading-relaxed">
                    {d.marketingDNA?.competitiveEdge || "Engineered for localized growth in Bharat."}
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap md:justify-end">
                  {d.marketingDNA?.primaryChannels?.map((channel: string) => (
                    <span key={channel} className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl text-[10px] font-bold text-stone-600 uppercase tracking-widest">{channel}</span>
                  ))}
                </div>
              </div>

              {/* 2. PROGRESS SECTION */}
              <div className="mb-16">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase opacity-30 tracking-widest">30-Day Campaign Progress</span>
                  <span className="text-sm font-black text-indigo-600">{completedCount}/30 Done · Day {activeDay}</span>
                </div>
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner p-0.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(completedCount / 30) * 100}%` }} className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-200" />
                </div>
              </div>

              {/* 3. INTERACTIVE ROADMAP SCROLLER */}
              <section className="mb-16 overflow-hidden">
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 pt-2 -mx-4 px-4">
                  {thirtyDayPlan.map((step: any) => (
                    <button
                      key={step.day}
                      onClick={() => setActiveDay(step.day)}
                      className={`min-w-[150px] p-7 rounded-[2.5rem] border text-left transition-all duration-300 relative group ${
                        completedDays.includes(step.day)
                          ? activeDay === step.day
                            ? 'bg-green-600 border-green-500 text-white shadow-2xl scale-105 -translate-y-1'
                            : 'bg-green-50 border-green-200 shadow-sm'
                          : activeDay === step.day
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl scale-105 -translate-y-1'
                            : 'bg-white border-stone-100 hover:border-indigo-200 shadow-sm'
                      }`}
                    >
                      <p className={`text-[10px] font-black uppercase mb-4 ${activeDay === step.day ? 'opacity-60' : 'opacity-20'}`}>Day {step.day}</p>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-5 transition-colors ${
                        completedDays.includes(step.day)
                          ? activeDay === step.day
                            ? 'bg-white/20 text-white'
                            : 'bg-green-100 text-green-600'
                          : activeDay === step.day
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-50 text-indigo-600 group-hover:bg-indigo-50'
                      }`}>
                        {completedDays.includes(step.day) ? <Check size={16} /> : <Play size={12} fill="currentColor" />}
                      </div>
                      <h4 className="text-[12px] font-bold leading-tight">{step.label}</h4>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* 4. DAY DETAIL PANEL */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeDay}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white rounded-[4rem] p-12 md:p-16 border border-stone-100 shadow-xl shadow-stone-200/20"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                        <div>
                          <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-[0.2em]">Daily Execution Guide</p>
                          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900 leading-tight">{selectedDayData?.label}</h2>
                        </div>
                        {selectedDayData?.insight && (
                          <div className="bg-yellow-50 p-6 rounded-[2rem] border border-yellow-100 max-w-[280px] shadow-sm relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 text-yellow-100 group-hover:scale-110 transition-transform duration-700">
                              <Lightbulb size={80} />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-2 text-yellow-700">
                                <Lightbulb size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Local Insight</span>
                              </div>
                              <p className="text-[11px] text-yellow-800 leading-relaxed font-semibold italic">"{selectedDayData.insight}"</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
                        <div>
                          <h5 className="text-[11px] font-black uppercase opacity-20 tracking-[0.3em] mb-6">Tactical Steps for Small Businesses</h5>
                          <div className="space-y-6">
                            {selectedDayData?.execution_steps?.map((step: string, i: number) => (
                              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-5 items-start">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[11px] font-black mt-0.5 border border-indigo-100/50">{i + 1}</div>
                                <p className="text-sm text-stone-600 leading-relaxed font-medium">{step}</p>
                              </motion.div>
                            )) || <p className="text-sm text-stone-400">Tactical guide coming soon.</p>}
                          </div>
                        </div>

                        <div className="pt-4">
                          <button 
                            onClick={() => {
                              const isCurrentlyDone = completedDays.includes(activeDay);
                              toggleTask({ roadmapId: fullRoadmap._id, dayNumber: activeDay });
                              
                              if (!isCurrentlyDone) {
                                let nextDay = activeDay + 1;
                                while (nextDay <= 30 && completedDays.includes(nextDay)) {
                                  nextDay++;
                                }
                                if (nextDay <= 30) setActiveDay(nextDay);
                              }
                            }}
                            className={`w-full py-8 rounded-[2rem] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl cursor-pointer ${
                              completedDays.includes(activeDay) 
                                ? 'bg-green-500 text-white shadow-green-200 hover:bg-green-600' 
                                : 'bg-stone-900 text-white hover:bg-indigo-700 shadow-stone-200'
                            }`}
                          >
                            {completedDays.includes(activeDay) ? <CheckCircle size={28} /> : <Circle size={28} />}
                            <span className="text-sm font-black uppercase tracking-widest">
                              {completedDays.includes(activeDay) ? "Task Done! Shabaash! ✅" : "Mark Task as Done"}
                            </span>
                          </button>
                        </div>

                        {selectedDayData?.recommended_tools && selectedDayData.recommended_tools.length > 0 && (
                          <div>
                            <h5 className="text-[11px] font-black uppercase opacity-20 tracking-[0.3em] mb-4">Execution Stack</h5>
                            <div className="flex gap-4 flex-wrap">
                              {selectedDayData.recommended_tools.map((tool: any, i: number) => (
                                <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 px-6 py-3 bg-stone-50 hover:bg-white rounded-2xl border border-stone-100 hover:border-indigo-600/30 hover:shadow-lg transition-all">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-stone-100 group-hover:scale-110 transition-transform">
                                    <ExternalLink size={14} className="text-stone-400 group-hover:text-indigo-600" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-stone-900 leading-none mb-1">{tool.name}</p>
                                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">{tool.purpose || "Tool"}</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 5. SIDEBAR: WEEKLY THEMES & BUDGET */}
                <div className="space-y-12">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30 ml-4 mb-6">Strategy Themes</h3>
                    <div className="space-y-6">
                      {weeklyThemes.map((week: any, i: number) => (
                        <div key={i} className={`p-8 rounded-[3rem] border transition-all hover:scale-[1.02] ${i === 0 ? 'bg-indigo-900 text-white shadow-2xl shadow-indigo-200 border-indigo-800' : 'bg-white border-stone-100 shadow-sm'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'opacity-50' : 'text-indigo-600'}`}>Week {week.week}</p>
                            {i === 0 && <span className="text-[8px] font-black bg-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Current</span>}
                          </div>
                          <h4 className={`font-black tracking-tight mb-4 ${i === 0 ? 'text-2xl' : 'text-lg'}`}>{week.theme || "Marketing Focus"}</h4>
                          <div className="space-y-4">
                            <div className={`p-4 rounded-2xl ${i === 0 ? 'bg-white/10' : 'bg-stone-50'}`}>
                              <p className="text-[9px] font-black uppercase opacity-50 mb-1">Key Activity</p>
                              <p className="text-xs font-bold leading-tight">{week.keyActivity || week.focus}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp size={12} className={i === 0 ? "text-indigo-300" : "text-indigo-600"} />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">KPI</span>
                              </div>
                              <span className="text-xs font-black">{week.metric || week.roi_projection}</span>
                            </div>
                          </div>
                          {i === 0 && week.hinglishQuote && (
                            <p className="mt-6 text-[11px] font-medium leading-relaxed italic opacity-70 border-t border-white/10 pt-4">
                              "{week.hinglishQuote}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {d.budgetPlan && (
                    <div className="bg-stone-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <Zap size={120} />
                      </div>
                      <h3 className="text-xl font-black tracking-tighter mb-6 relative z-10">Smart Budget Plan</h3>
                      <div className="space-y-4 mb-8 relative z-10">
                        <div className="flex justify-between items-center">
                          <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Free Wins</span>
                          <span className="text-xs font-black">{d.budgetPlan.zeroRupee?.length || 0} Tactics</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Paid Boosts</span>
                          <span className="text-xs font-black">Under ₹2000</span>
                        </div>
                      </div>
                      <div className="p-5 bg-white/10 rounded-2xl border border-white/10 relative z-10">
                        <p className="text-[9px] font-black uppercase opacity-40 mb-2">ROI Tip</p>
                        <p className="text-[11px] font-semibold leading-relaxed">{d.budgetPlan.roi_tip}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'karya' && (
            <motion.div 
              key="karya" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <KaryaTab 
                dayTask={selectedDayData?.label} 
                roadmapId={fullRoadmap._id}
                roadmapData={thirtyDayPlan}
                currentDay={activeDay}
              />
            </motion.div>
          )}

          {activeTab === 'connect' && (
            <motion.div 
              key="connect" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ConnectTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ChatAgent
        roadmapId={fullRoadmap._id}
        userId={user?.id}
        businessData={{
          shopName: fullRoadmap.brandName,
          city: fullRoadmap.location,
          address: fullRoadmap.address,
          monthlyRevenue: fullRoadmap.monthlyRevenue,
          category: fullRoadmap.category
        }}
      />
    </div>
  );
}