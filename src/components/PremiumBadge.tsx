import { Crown } from "lucide-react";

export const PremiumBadge = () => {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-200/50 premium-glow">
      <Crown size={10} className="text-white fill-white" />
      <span className="text-[8px] font-black text-white uppercase tracking-tighter">
        Pro Member
      </span>
    </div>
  );
};
