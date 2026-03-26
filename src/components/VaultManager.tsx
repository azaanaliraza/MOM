"use client";
import React from 'react';
import { Save, Plus, Globe, Link2, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

interface VaultManagerProps {
  links: string[];
  onSave: (links: string[]) => void;
  isLoading?: boolean;
}

export default function VaultManager({ links, onSave, isLoading }: VaultManagerProps) {
  const [currentLinks, setCurrentLinks] = React.useState<string[]>(links?.length ? links : [""]);

  // 🔄 Sync local state with database when links prop changes (e.g., after save or initial load)
  React.useEffect(() => {
    if (links && links.length > 0) {
      setCurrentLinks(links);
    }
  }, [links]);

  const addField = () => {
    if (currentLinks.length < 10) {
      setCurrentLinks([...currentLinks, ""]);
    }
  };

  const removeField = (index: number) => {
    const newLinks = [...currentLinks];
    newLinks.splice(index, 1);
    setCurrentLinks(newLinks.length ? newLinks : [""]);
  };

  return (
    <div className="p-12 bg-white rounded-[4rem] border border-stone-100 shadow-2xl shadow-stone-200/30 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 rounded-xl">
                    <Link2 size={16} className="text-indigo-600" />
                </span>
                <h3 className="text-2xl font-black italic tracking-tight text-stone-900">Business Intelligence Vault</h3>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-11">Agent Karya monitors these links for live context</p>
        </div>
        <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-stone-100 px-4 py-1.5 rounded-full text-stone-500">
            {currentLinks.filter(l => l).length}/10 Active
            </span>
            <div className="flex items-center gap-1 text-[8px] font-bold text-green-500 uppercase">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                Stealth Active
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {currentLinks.map((link, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative flex items-center gap-3 p-5 bg-stone-50 rounded-[2rem] border border-stone-100/50 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300"
            >
              <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Globe size={14} />
              </div>
              <input 
                value={link}
                onChange={(e) => {
                  const newLinks = [...currentLinks];
                  newLinks[i] = e.target.value;
                  setCurrentLinks(newLinks);
                }}
                placeholder="Amazon, Zomato, or GMB link..."
                className="flex-1 bg-transparent text-[10px] font-bold text-stone-600 placeholder:text-stone-300 outline-none"
              />
              <button 
                onClick={() => removeField(i)}
                className="opacity-0 group-hover:opacity-100 p-3 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 items-center">
        <button 
          onClick={addField}
          disabled={currentLinks.length >= 10}
          className="flex-1 py-6 bg-stone-50 hover:bg-stone-100 text-stone-400 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group disabled:opacity-30"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" /> 
          Add New Business Link
        </button>
        
        <button 
          onClick={() => onSave(currentLinks.filter(l => l.trim()))}
          disabled={isLoading}
          className="px-10 py-6 bg-stone-900 text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black hover:shadow-2xl hover:shadow-stone-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Save to Vault
        </button>
      </div>
    </div>
  );
}
