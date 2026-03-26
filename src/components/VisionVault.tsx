"use client";

import { useState, useEffect } from "react";
import { Camera, Loader2, CheckCircle2, X, Save, Info, MessageSquare, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { processBusinessImage } from "../app/actions/vision";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface VisionVaultProps {
  roadmapId: Id<"roadmaps">;
}

export default function VisionVault({ roadmapId }: VisionVaultProps) {
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");

  const currentRoadmap = useQuery(api.roadmaps.getRoadmap, { roadmapId });
  const updateAgentMemory = useMutation(api.users.updateAgentMemory);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateManualContext = useMutation(api.roadmaps.updateManualContext);
  const removeVaultImage = useMutation(api.roadmaps.removeVaultImage);

  // Sync manual text with roadmap data
  useEffect(() => {
    if (currentRoadmap?.manualContext) {
      setManualText(currentRoadmap.manualContext);
    }
  }, [currentRoadmap]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadStatus("Optimizing & Reading Photo...");

    try {
      // 1. Client-Side Compression & Resize using Canvas
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Gemini doesn't need 4K for menu reading
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to a lighter JPEG for faster transport
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

          try {
            setUploadStatus("Agent is Extracting Intelligence...");
            const intelligence = await processBusinessImage(compressedBase64);

            if (intelligence) {
              setUploadStatus("Finalizing Memory...");

              // Optional: Store original/compressed file in Convex for the gallery
              const uploadUrl = await generateUploadUrl();
              const blob = await (await fetch(compressedBase64)).blob();
              const res = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": "image/jpeg" },
                body: blob,
              });
              const { storageId } = await res.json();

              // Update Convex Database
              await updateAgentMemory({ 
                roadmapId, 
                intelligence,
                storageId
              });

              setUploadStatus("Agent Memory Updated!");
              setTimeout(() => setUploadStatus(null), 3000);
            }
          } catch (err: any) {
            console.error("Vision process failed:", err.message);
            setUploadStatus("Vision failed. Try a smaller photo.");
          } finally {
            setIsUploading(false);
          }
        };
      };
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("Error reading image.");
      setIsUploading(false);
    }
  };

  const saveManualInfo = async () => {
    try {
      await updateManualContext({ roadmapId, text: manualText });
      setUploadStatus("Business Details Saved!");
      setTimeout(() => setUploadStatus(null), 2000);
    } catch (e) {
      setUploadStatus("Error saving details.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
      
      {/* MANUAL CONTEXT INPUT */}
      <div className="p-10 bg-white rounded-[3rem] border border-stone-100 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
            <MessageSquare size={14} className="text-indigo-400" /> Manual Business Context
        </h3>
        <textarea 
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="e.g. Current sale: 20% off on cricket kits. We are closed on Sundays."
            className="w-full h-32 p-6 bg-stone-50 rounded-[2rem] border border-stone-100 text-xs font-medium focus:ring-4 ring-indigo-50 outline-none transition-all resize-none placeholder:text-stone-300"
        />
        <button 
            onClick={saveManualInfo}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
        >
            <Save size={14} /> Save Context
        </button>
      </div>

      {/* UPLOAD AREA */}
      <div className="relative group">
        <input 
            type="file" 
            id="vision-upload-vault" 
            className="hidden" 
            onChange={handleUpload} 
            accept="image/*" 
            disabled={isUploading}
        />
        <label 
            htmlFor="vision-upload-vault" 
            className={`w-full p-10 bg-indigo-600/5 border-2 border-dashed border-indigo-200 rounded-[3rem] flex flex-col items-center gap-4 cursor-pointer transition-all hover:bg-indigo-600/10 group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="p-5 bg-white rounded-full shadow-xl shadow-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform">
                {isUploading ? <Loader2 className="animate-spin" size={28} /> : <Camera size={28} />}
            </div>
            <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-900">
                    {isUploading ? "Agent is Thinking..." : "📸 Upload Shop Photos"}
                </p>
                <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1 tracking-tighter">Menus, shelves, or storefronts</p>
            </div>
        </label>

        <AnimatePresence>
            {uploadStatus && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-10 left-0 right-0 flex justify-center"
                >
                    <div className="px-6 py-2 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                        {uploadStatus.includes("Updated") || uploadStatus.includes("Saved") ? <CheckCircle2 size={12} className="text-green-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                        {uploadStatus}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* AGENT MEMORY STATUS & REMOVER */}
      {currentRoadmap?.businessVault?.aiContext && (
        <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 relative group overflow-hidden">
          <button 
            onClick={() => removeVaultImage({ roadmapId })} 
            className="absolute top-4 right-4 p-3 bg-white text-red-500 rounded-full shadow-lg border border-red-50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
          >
            <Trash2 size={14} />
          </button>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Agent's Visual Memory</h4>
          </div>

          <p className="text-[11px] text-stone-600 font-medium italic leading-relaxed line-clamp-4">
            "{currentRoadmap.businessVault.aiContext}"
          </p>
          
          <div className="mt-4 pt-4 border-t border-stone-200/50 flex justify-between items-center">
             <span className="text-[8px] font-black text-stone-300 uppercase letter tracking-[0.2em]">Context Synced Rooted</span>
             <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">
                {currentRoadmap.businessVault.images?.length || 0} Photos Analyzed
             </span>
          </div>
        </div>
      )}
    </div>
  );
}
