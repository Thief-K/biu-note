import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FloatingPillNav from './FloatingPillNav';
import SparkModal from './SparkModal';
import AiMemoModal from './AiMemoModal';
import SearchOverlay from './SearchOverlay';
import ConfirmModal from './ConfirmModal';
import DiffModal from '../DiffModal';
import { useModalStore } from '../../stores/modalStore';
import { useNotesStore } from '../../stores/notesStore';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { apiFetch } from '../../utils/api';

export default function AppLayout() {
  const isDiffOpen = useModalStore((s) => s.isDiffOpen);
  const diffData = useModalStore((s) => s.diffData);
  const closeDiff = useModalStore((s) => s.closeDiff);

  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const checkAiConfig = useNotesStore((s) => s.checkAiConfig);
  const initTheme = useThemeStore((s) => s.initTheme);
  const token = useAuthStore((s) => s.token);

  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const isNoteDetail = location.pathname.startsWith('/notes/') && location.pathname !== '/notes';
  const hideBottomNav = isChat || isNoteDetail;

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (token) {
      fetchNotes();
      checkAiConfig();
    }
  }, [token, fetchNotes, checkAiConfig]);

  const handleDiffConfirm = async (commitPayload) => {
    try {
      const res = await apiFetch('/api/ai/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commitPayload)
      });
      if (res.ok) {
        await fetchNotes();
        closeDiff();
      } else {
        const errData = await res.json();
        alert(`提交失败: ${errData.error || '未知错误'}`);
      }
    } catch (err) {
      console.error('Failed to commit AI diff:', err);
      alert(`提交失败: ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans antialiased relative">
      {/* Main Content Canvas (Full width, unified on PC and Mobile) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Outlet />
      </main>

      {/* Bottom Fade Gradient for Visual Depth and Scroll Isolation (Only on primary tabs) */}
      {!hideBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-30" />
      )}

      {/* Unified Bottom Floating Glass Capsule Navigation */}
      {!hideBottomNav && <FloatingPillNav />}

      {/* Global Overlays & Modals */}
      <SparkModal />
      <AiMemoModal />
      <SearchOverlay />
      <ConfirmModal />
      {isDiffOpen && diffData && (
        <DiffModal
          data={diffData}
          onCancel={closeDiff}
          onConfirm={handleDiffConfirm}
        />
      )}
    </div>
  );
}
