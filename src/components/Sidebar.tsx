"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PremiumBadge } from "./PremiumBadge";
import Link from "next/link";
import { Zap, LayoutDashboard, Settings, User } from "lucide-react";

export default function Sidebar() {
  const { user, isSignedIn, isLoaded } = useUser();
  // Fetch user data from your 'users' table
  const dbUser = useQuery(api.users.getUser, { clerkId: user?.id ?? "loading" });

  // 🕵️ Debug Logs (Check your Browser Console F12)
  console.log("Clerk User ID:", user?.id);
  console.log("Convex User Data:", dbUser);
  console.log("Is Premium?:", dbUser?.isPremium);


  const NavItem = ({ href, icon: Icon, label }: any) => (
    <Link 
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-stone-600 hover:text-indigo-600 hover:bg-stone-50 rounded-xl transition-all group"
    >
      <Icon size={18} className="transition-colors group-hover:text-indigo-600" />
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="w-80 h-screen border-r border-stone-100 p-6 flex flex-col justify-between sticky top-0 bg-[#FDFDFF]">
      <div>
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 mb-10 px-4 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-stone-900">MOM</span>
        </Link>

        {/* NAVIGATION ITEMS */}
        <nav className="space-y-2">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/profile" icon={User} label="My Profile" />
            <NavItem href="/settings" icon={Settings} label="Settings" />
        </nav>
      </div>

      {/* User Section at the bottom */}
      {isSignedIn && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50/50 border border-stone-100 transition-colors">
            <img 
              src={user?.imageUrl} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-stone-200" 
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-stone-900 truncate">
                  {user?.firstName}
                </p>
                {/* 🔥 Premium Badge Rendered Conditionally */}
                {dbUser?.isPremium && <PremiumBadge />}
              </div>
              <p className="text-[9px] font-bold text-stone-400 truncate tracking-tight uppercase">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
      )}
    </aside>
  );
}
