"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Calendar, ToggleRight, MessageSquare,
  Mic, Sparkles, Loader2
} from 'lucide-react';
import { useUser, SignInButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import OnboardingForm from "../components/OnboardingForm";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-stone-100/50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="text-xl font-extrabold tracking-tighter bg-gradient-to-r from-primary to-indigo-accent bg-clip-text text-transparent">Vigyapan AI</div>
        <div className="hidden md:flex gap-8 text-[11px] font-bold tracking-[0.15em] uppercase text-stone-500">
          <a href="#" className="hover:text-primary transition-colors">Strategy</a>
          <a href="#" className="hover:text-primary transition-colors">Execution</a>
          <a href="#" className="hover:text-primary transition-colors">Agents</a>
          <a href="#" className="hover:text-primary transition-colors">Pricing</a>
        </div>
        <button className="bg-stone-900 hover:bg-primary transition-all text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">
          Get Started
        </button>
      </div>
    </motion.nav>
  );
}

export default function VigyapanPage() {
  const { user, isSignedIn } = useUser();
  const storeUser = useMutation(api.users.storeUser);
  
  useEffect(() => {
    if (isSignedIn && user) {
      storeUser();
    }
  }, [isSignedIn, user, storeUser]);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <Hero />
      <BentoGrid />
      <ONDCSection />
      <VoiceSEO />
      <FestivePulse />
      <WarRoom />
      <RadarSection />
      <ExecutionTimeline />
      <Pricing />
      <Footer />
    </div>
  );
}

// ... existing code ...

function Hero() {
  const { user, isSignedIn } = useUser();
  const [input, setInput] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();

  const handleStartOnboarding = () => {
     if (!input || !isSignedIn) return;
     setIsFormOpen(true);
  };

  const [placeholderText, setPlaceholderText] = useState("");
  const placeholders = [
    'I run a saree shop in Surat...',
    'I sell organic tea in Assam...',
    'I teach math in Bhopal...',
    'I grow apples in Shimla...',
    'I design jewelry in Jaipur...'
  ];

  useEffect(() => {
    let currentText = "";
    let isDeleting = false;
    let loopNum = 0;
    let typingSpeed = 100;
    let timer: ReturnType<typeof setTimeout>;

    const type = () => {
      const i = loopNum % placeholders.length;
      const fullText = placeholders[i];

      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
        typingSpeed = 30;
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
        typingSpeed = 60;
      }

      setPlaceholderText(currentText);

      if (!isDeleting && currentText === fullText) {
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        loopNum++;
        typingSpeed = 500;
      }

      timer = setTimeout(type, typingSpeed);
    };

    timer = setTimeout(type, typingSpeed);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="pt-48 pb-24 px-6 text-center relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10"
      />
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="relative z-10">
        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">AI Agents active in 142 Indian Cities</span>
        </motion.div>

        <motion.h1 variants={fadeInUp} className="text-6xl md:text-[6rem] font-black tracking-tighter leading-[0.9] mb-8 text-stone-900 drop-shadow-sm">
          Execution is the <span className="text-primary relative inline-block">Bottleneck.
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.8 }} className="absolute bottom-0 left-0 w-full h-2 bg-primary/20 origin-left rounded-full" />
          </span><br />
          We are the <span className="italic text-indigo-accent">Engine.</span>
        </motion.h1>

        <motion.div variants={fadeInUp} className="max-w-2xl mx-auto relative group mt-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-indigo-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-white border border-stone-200 rounded-3xl p-2 flex items-center shadow-2xl">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartOnboarding()}
              className="w-full bg-transparent border-none px-6 py-5 text-lg focus:ring-0 outline-none placeholder:text-stone-400"
              placeholder={placeholderText + "|"}
            />
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="bg-primary hover:bg-stone-900 transition-all text-white px-6 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest mr-2">
                  Login to Start
                </button>
              </SignInButton>
            ) : (
              <button 
                onClick={handleStartOnboarding}
                className="bg-primary hover:bg-stone-900 transition-colors text-white h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ZEN ONBOARDING FORM */}
      <AnimatePresence>
        {isFormOpen && (
          <OnboardingForm 
            initialPrompt={input} 
            userId={user?.id || ""} 
            onClose={() => setIsFormOpen(false)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function BentoGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div variants={fadeInUp} className="md:col-span-2 glass-card p-12 rounded-[3rem] group hover:border-primary/20 transition-colors">
          <Calendar className="text-primary mb-12 group-hover:scale-110 transition-transform duration-500" size={40} />
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">Module 01</p>
          <h3 className="text-4xl font-bold tracking-tight mb-4 text-stone-900">Local Context</h3>
          <p className="text-base text-stone-500 leading-relaxed max-w-sm">Deep integration with the Indian cultural calendar. Automatically sync campaigns with Diwali, Eid, or local Surat markets.</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-card p-12 rounded-[3rem] group hover:border-indigo-accent/20 transition-colors">
          <div className="flex justify-between items-start mb-12">
            <ToggleRight className="text-indigo-accent group-hover:rotate-12 transition-transform duration-500" size={40} />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-stone-900">Hinglish Native</h3>
          <p className="text-sm text-stone-500 leading-relaxed">We don't translate. We think in the dialect your customers speak natively.</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="bg-primary text-white p-12 rounded-[3rem] relative overflow-hidden shadow-xl shadow-primary/20 group">
          <MessageSquare className="mb-12 group-hover:-translate-y-2 transition-transform duration-500" size={40} />
          <h3 className="text-2xl font-bold mb-3">WhatsApp Direct</h3>
          <p className="text-sm text-white/80 leading-relaxed">Zero friction. Go from strategy to lead inbox in 45 seconds.</p>
          <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <MessageSquare size={160} />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function ONDCSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="grid md:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="h-[450px] glass-card rounded-[3rem] relative flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-indigo-accent/5" />
          <div className="w-28 h-28 bg-white shadow-2xl rounded-full node-pulse flex items-center justify-center z-10 border border-indigo-accent/20">
            <span className="text-[12px] font-black text-indigo-accent tracking-[0.2em] relative z-10">BUSINESS</span>
          </div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-16 left-16 text-[11px] font-bold text-stone-400 tracking-wider">Paytm</motion.div>
          <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-40 right-16 text-[11px] font-bold text-stone-400 tracking-wider">PhonePe</motion.div>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4.5, repeat: Infinity }} className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[11px] font-bold text-stone-400 tracking-wider">Magicpin</motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-12 text-stone-900">
            Join India’s Open Network. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-accent to-primary">Sell everywhere, pay less.</span>
          </h2>
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-stone-400"><span>Marketplaces</span> <span className="text-red-500 font-black">35% Commission</span></div>
              <div className="h-2.5 w-full bg-stone-100/80 rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "35%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-stone-400"><span>ONDC Gateway</span> <span className="text-indigo-accent font-black">5-8% Total</span></div>
              <div className="h-2.5 w-full bg-stone-100/80 rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} whileInView={{ width: "8%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-indigo-accent to-blue-500 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function VoiceSEO() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-16 text-stone-900 leading-tight">
          Speak their language. Rank for <br />every <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">'Near Me'</span> search.
        </h2>
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-stone-100 flex items-center gap-6 transform hover:scale-105 transition-transform duration-500">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Mic className="text-indigo-accent" size={24} />
          </div>
          <p className="flex-1 text-left text-lg font-medium italic text-stone-600">"Bhaiya, near me best hardware shop batao"</p>
          <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">98% Confidence</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FestivePulse() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-stone-900 rounded-[4rem] p-16 md:p-24 flex flex-col md:flex-row gap-20 items-center overflow-hidden relative shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full mix-blend-screen" />
        <div className="flex-1 relative z-10">
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 text-white leading-tight">
            Don't guess the <br />season. <span className="text-primary">Predict it.</span>
          </h2>
          <p className="text-stone-400 text-lg leading-relaxed max-w-md">AI insights tailored for the Indian festive cycle. Know exactly when to stock up and when to deploy maximum ad spend.</p>
        </div>
        <div className="flex-1 w-full glass-card bg-white/5 border-white/10 rounded-[2.5rem] relative p-10 z-10 backdrop-blur-2xl">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-10">
            <span>Demand Trend</span><span className="text-primary">Conversion Rate</span>
          </div>
          <div className="relative h-40">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
              <motion.path
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M0 80 Q 100 90, 150 50 T 300 15 T 400 60"
                fill="none"
                stroke="#a93100"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <motion.circle
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.5, duration: 0.5 }}
                cx="300" cy="15" r="6" fill="#fff" stroke="#a93100" strokeWidth="3"
              />
            </svg>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.8 }}
              className="absolute top-[-10px] left-[280px] bg-white text-stone-900 text-[10px] font-black px-3 py-1 rounded-lg shadow-xl"
            >
              Diwali Peak
            </motion.div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase mt-6">
            <span>Aug</span><span>Sep</span><span>Oct</span><span className="text-white">Nov</span><span>Dec</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function WarRoom() {
  const logs = [
    { t: "[14:15]", s: "INFO", m: "SEO ranking for 'Organic Ghee Indore' moved to #2", c: "text-blue-400" },
    { t: "[14:32]", s: "PROCESS", m: "Recalibrating ad spend based on festive spike", c: "text-yellow-400" },
    { t: "[14:50]", s: "SUCCESS", m: "Google Merchant Center Sync Complete", c: "text-green-400" },
    { t: "[15:02]", s: "DATA", m: "Detected competitor price drop; notifying owner...", c: "text-purple-400" },
    { t: "[15:10]", s: "EXECUTING", m: "Drafting local campaign for Lucknow warehouse", c: "text-white" },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-5xl font-black tracking-tighter text-center mb-16 text-stone-900">Total Transparency.</h2>
        <div className="max-w-4xl mx-auto bg-[#0a0a0a] rounded-[3rem] overflow-hidden shadow-2xl border border-stone-800">
          <div className="bg-[#111] px-8 py-4 flex gap-2 items-center border-b border-stone-800">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-6 text-[11px] font-mono font-bold tracking-widest text-stone-600 uppercase">Agent Console</span>
          </div>
          <div className="p-12 font-mono text-[13px] space-y-5">
            {logs.map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex gap-6"
              >
                <span className="text-stone-600">{l.t}</span>
                <span className={`font-bold ${l.c} w-24`}>{l.s}</span>
                <span className="text-stone-300">{l.m}</span>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="flex gap-6 pt-4"
            >
              <span className="text-stone-600">[sys]</span>
              <span className="w-2 h-4 bg-primary inline-block" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function RadarSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-32">
      <div className="grid md:grid-cols-2 gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
            <p className="text-[10px] font-black text-indigo-accent tracking-[0.2em] uppercase">Radar V2.4</p>
          </div>
          <h2 className="text-6xl font-black tracking-tighter mb-8 leading-[0.9] text-stone-900">Find the Gap.</h2>
          <p className="text-stone-500 text-lg mb-12 max-w-md leading-relaxed">Discover untapped neighborhoods before your competitors do. We map high-demand, low-supply pockets across tier-2 and tier-3 cities.</p>
          <button className="bg-indigo-accent hover:bg-stone-900 transition-colors text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/20">
            Scan Your Area
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="h-[450px] glass-card rounded-[3rem] relative overflow-hidden border border-stone-100 bg-stone-50 shadow-2xl"
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-accent/10 rounded-full border border-indigo-accent/30 flex items-center justify-center backdrop-blur-sm"
          >
            <span className="text-[10px] font-black tracking-widest text-indigo-accent">INDORE SE</span>
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center backdrop-blur-sm"
          >
            <span className="text-[10px] font-black tracking-widest text-primary uppercase">Palasia</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ExecutionTimeline() {
  const steps = [
    { t: "Business Input", d: "Define your goal in plain text. No complex dashboards or rigid configurations required." },
    { t: "AI Reasoning", d: "Agents parse regional context, analyze competitor moves, and formulate a localized plan." },
    { t: "Instant Execution", d: "Ads go live, WhatsApp broadcasts deploy, leads are engaged. The engine never sleeps." },
  ];
  return (
    <section className="max-w-4xl mx-auto px-6 py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-center mb-28 text-stone-900">The Loop of Execution</h2>
        <div className="relative pl-12 md:pl-20 border-l-2 border-stone-100 space-y-24">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -left-[51px] md:-left-[83px] top-0 w-8 h-8 bg-white border-4 border-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-3">Phase 0{i + 1}</p>
              <h3 className="text-3xl font-bold mb-4 text-stone-900 tracking-tight">{s.t}</h3>
              <p className="text-stone-500 text-base leading-relaxed max-w-lg">{s.d}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-28 flex justify-center"
        >
          <div className="bg-white px-8 py-5 rounded-3xl shadow-2xl border border-stone-100 flex items-center gap-5 transform -translate-y-2 hover:-translate-y-4 transition-transform duration-300">
            <Sparkles className="text-primary animate-pulse" size={28} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Active Reasoning...</p>
              <p className="text-sm font-bold text-stone-900 border-b border-stone-200 pb-0.5 inline-block">Execute: Send Broadcast to 50 Leads in Jaipur.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-32 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-stone-900">Pricing for Execution</h2>
        <p className="text-stone-500 text-lg mb-24 max-w-xl mx-auto">Scale simply. No hidden platform fees. Choose the power level your business demands.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          <PriceCard p="0" t="Trial Mode" l={["5 AI Reasoning cycles", "1 Channel execution", "Basic Insights"]} />
          <PriceCard p="299" t="Standard" active l={["Unlimited Reasoning", "All Channels (WhatsApp+)", "Regional Optimization", "Priority Support"]} />
          <PriceCard p="5000" t="High Vol" l={["Priority Compute", "Direct Account Agent", "Custom Logic API", "Dedicated Infrastructure"]} />
        </div>
      </motion.div>
    </section>
  );
}

function PriceCard({ p, t, l, active }: any) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className={`p-12 rounded-[3.5rem] border transition-all duration-300 ${active ? 'bg-stone-900 text-white border-stone-800 shadow-2xl shadow-stone-900/40 md:scale-105 md:-translate-y-4' : 'glass-card text-stone-900 border-stone-100 hover:shadow-xl'} text-center flex flex-col items-center`}
    >
      <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-8 px-4 py-1.5 rounded-full inline-block ${active ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary'}`}>{t}</p>
      <div className="flex items-start justify-center mb-10 text-left">
        <span className="text-2xl font-bold mt-2 mr-1 opacity-50">₹</span>
        <span className="text-7xl font-black tracking-tighter">{p}</span>
      </div>
      <ul className="space-y-5 text-sm font-medium w-full mb-10">
        {l.map((item: string, i: number) => (
          <li key={i} className={`flex items-center justify-center gap-3 ${active ? 'opacity-90' : 'opacity-70'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-primary' : 'bg-stone-300'}`} />
            {item}
          </li>
        ))}
      </ul>
      <button className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all mt-auto ${active ? 'bg-primary hover:bg-white hover:text-stone-900 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-900'}`}>
        Choose Plan
      </button>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-6 py-24 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-8 mt-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">© 2026 Vigyapan AI. Execution Precision.</p>
      <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-stone-400">
        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
        <a href="#" className="hover:text-primary transition-colors">Terms</a>
        <a href="#" className="hover:text-primary transition-colors">Contact</a>
        <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
      </div>
    </footer>
  );
}