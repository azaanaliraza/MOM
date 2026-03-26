"use client";
import React, { useState } from 'react';
import { Link2, Trash2, Plus, Save, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LinkVaultProps {
  savedLinks?: string[];
  onSave: (links: string[]) => void;
  isLoading?: boolean;
}

export default function LinkVault({ savedLinks, onSave, isLoading }: LinkVaultProps) {
  const [links, setLinks] = useState<string[]>(savedLinks?.length ? savedLinks : [""]);

  const addField = () => {
    if (links.length < 10) {
      setLinks([...links, ""]);
    }
  };

  const removeField = (index: number) => {
    if (links.length > 1) {
      const newLinks = [...links];
      newLinks.splice(index, 1);
      setLinks(newLinks);
    } else {
      setLinks([""]);
    }
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleSave = () => {
    const validLinks = links.filter(link => link.trim().length > 0);
    onSave(validLinks);
  };

  return (
    <div className="p-10 bg-white border border-stone-100 rounded-[3rem] shadow-xl shadow-stone-200/40 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 rounded-lg">
              <Link2 size={12} className="text-indigo-600" />
            </span>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Business Context Vault</h3>
          </div>
          <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest pl-7">Add up to 10 context links (Amazon, Zomato, GMB)</p>
        </div>
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
           <Sparkles size={14} className="text-stone-300" />
        </div>
      </header>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {links.map((link, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 group"
            >
              <div className="flex-1 relative">
                <input 
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  placeholder="Paste Amazon, Zomato, or Google Maps link..."
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-100/50 rounded-2xl text-[10px] font-bold text-stone-600 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all"
                />
                <div className="absolute left-0 -top-2 px-2 py-0.5 bg-white border border-stone-100 rounded-md text-[7px] font-black text-stone-300 uppercase scale-90">Link {i + 1}</div>
              </div>
              <button 
                onClick={() => removeField(i)}
                className="p-4 rounded-2xl text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button 
          onClick={addField} 
          disabled={links.length >= 10}
          className="flex items-center gap-2 px-6 py-4 bg-stone-50 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[1.5rem] text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
        >
          <Plus size={12} className="group-hover:rotate-90 transition-transform duration-300" /> 
          Add Field ({links.length}/10)
        </button>
        
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="ml-auto flex items-center gap-3 px-8 py-4 bg-stone-900 text-white hover:bg-black rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-stone-900/10 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Save to Vault
        </button>
      </div>
    </div>
  );
}
