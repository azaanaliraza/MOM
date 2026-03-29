"use client";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Crown, Zap } from "lucide-react";
import Link from "next/link";
import { PremiumBadge } from "./PremiumBadge";

export default function Navbar() {
  const { user, isSignedIn } = useUser();
  
  // 1. Fetch user status (Make sure clerkId is valid)
  const dbUser = useQuery(api.users.getUser, { 
    clerkId: user?.id ?? "loading" 
  });

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-50">
      {/* LEFT: LOGO */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-stone-900">MOM</span>
        </Link>
      </div>

      {/* CENTER: NAV LINKS (Optional) */}
      <div className="hidden md:flex gap-8 text-[11px] font-bold tracking-[0.15em] uppercase text-stone-500">
          <a href="/#strategy" className="hover:text-indigo-600 transition-colors">Strategy</a>
          <a href="/#execution" className="hover:text-indigo-600 transition-colors">Execution</a>
          <a href="/#agents" className="hover:text-indigo-600 transition-colors">Agents</a>
      </div>

      {/* RIGHT: USER SECTION */}
      <div className="flex items-center gap-6" 
           data-clerk-user-id={user?.id}
           data-clerk-user-name={dbUser?.name ?? user?.fullName}
           data-clerk-user-image={user?.imageUrl}>
        {isSignedIn && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-2">
                  {/* DISPLAY NAME FROM DB */}
                  <span className="text-[11px] font-black uppercase tracking-widest text-stone-900">
                    {dbUser?.name ?? user?.fullName ?? "Loading..."}
                  </span>
                   {/* 🔥 THE VIP LOCK: Conditional Badge */}
                   {dbUser?.isPremium && <PremiumBadge />}
               </div>
               <span className="text-[9px] text-stone-400 font-bold uppercase tracking-tight">
                 {dbUser?.email ?? user?.primaryEmailAddress?.emailAddress}
               </span>
            </div>
            
            <div className="w-8 h-8 rounded-full border border-stone-100 overflow-hidden shadow-sm shadow-indigo-100">
               <UserButton />
            </div>
          </div>
        )}

        {!isSignedIn && (
            <Link 
              href="/#hero"
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              Get Started
            </Link>
        )}
      </div>
    </nav>
  );
}
