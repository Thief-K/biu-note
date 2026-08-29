import React from 'react';
import { NavLink } from 'react-router-dom';
import { Lightbulb, FileText, Zap, Bot, Settings } from 'lucide-react';
import { useModalStore } from '../../stores/modalStore';

export default function FloatingPillNav() {
  const openAiMemo = useModalStore((s) => s.openAiMemo);

  return (
    <nav 
      className="fixed bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto transform-gpu"
      aria-label="Application Navigation"
    >
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-full p-1.5 flex items-center gap-1.5">
        
        {/* 1. Sparks Tab (Amber / Yellow) */}
        <NavLink
          to="/sparks"
          className={({ isActive }) =>
            `w-10 h-10 rounded-full grid place-items-center shrink-0 transition-all cursor-pointer border ${
              isActive
                ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/60'
                : 'text-zinc-400 border-transparent hover:text-amber-500 dark:hover:text-amber-400 hover:bg-zinc-850'
            }`
          }
        >
          <Lightbulb size={20} className="w-5 h-5 shrink-0 block m-auto" />
        </NavLink>

        {/* 2. Notes Tab (Blue / Sky) */}
        <NavLink
          to="/notes"
          className={({ isActive }) =>
            `w-10 h-10 rounded-full grid place-items-center shrink-0 transition-all cursor-pointer border ${
              isActive
                ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400 border-blue-500/60'
                : 'text-zinc-400 border-transparent hover:text-blue-500 dark:hover:text-blue-400 hover:bg-zinc-850'
            }`
          }
        >
          <FileText size={20} className="w-5 h-5 shrink-0 block m-auto" />
        </NavLink>

        {/* 3. Quick Action Central Lightning Button (Emerald Accent FAB - AI Quick Memo) */}
        <button
          type="button"
          onClick={() => openAiMemo()}
          className="mx-0.5 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white grid place-items-center shrink-0 transition-all cursor-pointer border border-emerald-300/80"
        >
          <Zap size={20} className="w-5 h-5 fill-current stroke-[1.5] shrink-0 block m-auto" />
        </button>

        {/* 4. AI Assistant Tab (Purple / Violet) */}
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `w-10 h-10 rounded-full grid place-items-center shrink-0 transition-all cursor-pointer border ${
              isActive
                ? 'bg-purple-500/20 text-purple-500 dark:text-purple-400 border-purple-500/60'
                : 'text-zinc-400 border-transparent hover:text-purple-500 dark:hover:text-purple-400 hover:bg-zinc-850'
            }`
          }
        >
          <Bot size={20} className="w-5 h-5 shrink-0 block m-auto" />
        </NavLink>

        {/* 5. Settings Tab (Zinc / Slate) */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `w-10 h-10 rounded-full grid place-items-center shrink-0 transition-all cursor-pointer border ${
              isActive
                ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                : 'text-zinc-400 border-transparent hover:text-zinc-100 hover:bg-zinc-850'
            }`
          }
        >
          <Settings size={20} className="w-5 h-5 shrink-0 block m-auto" />
        </NavLink>

      </div>
    </nav>
  );
}
