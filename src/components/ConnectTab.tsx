"use client";
import React from 'react';
import { MessageSquare, MapPin, Camera } from 'lucide-react';

export default function ConnectTab() {
  const platforms = [
    { name: "WhatsApp Business", icon: <MessageSquare /> },
    { name: "Google Maps", icon: <MapPin /> },
    { name: "Instagram Meta", icon: <Camera /> }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h2 className="text-4xl font-light italic tracking-tighter">Vault Connections</h2>
        <p className="text-stone-400 text-lg max-w-lg font-medium">
          Securely link your platforms to enable automated execution of your marketing strategy.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((p) => (
          <div key={p.name} className="p-8 bg-stone-50 border border-stone-100 rounded-[2.5rem] opacity-60 hover:opacity-100 transition-opacity group">
            <div className="p-3 bg-white w-fit rounded-xl mb-6 shadow-sm group-hover:shadow-md transition-shadow">{p.icon}</div>
            <p className="text-[10px] font-black uppercase tracking-widest">{p.name}</p>
            <p className="text-[9px] font-bold text-indigo-500 uppercase mt-2 tracking-widest">Coming Soon</p>
          </div>
        ))}
      </div>

      <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100 text-[10px] font-bold text-indigo-900 uppercase tracking-[0.2em]">
        Your keys are stored in the Vigyapan Vault with AES-256 encryption. Agent only posts with your approval.
      </div>
    </div>
  );
}
