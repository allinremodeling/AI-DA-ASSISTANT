import { motion } from 'framer-motion';
import { Plus, MessageSquare, X, Wand2 } from 'lucide-react';
import type { Conversation } from '../lib/types';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
  currentThreadId: string;
  conversations: Conversation[];
}

export function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onSelectThread,
  currentThreadId,
  conversations,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
          width: 280,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed lg:static left-0 top-0 h-full z-50 border-r border-[#e5e5e5]',
          'bg-[#f5f5f5] flex flex-col',
        )}
        style={{ width: 280 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e5e5e5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-[#111111]">All In AI</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-[#e8e8e8] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[#6b6b6b]" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f9f9f9] transition-colors text-sm font-medium text-[#111111]"
          >
            <Plus className="w-4 h-4" />
            Nueva conversación
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div className="text-xs font-medium text-[#999999] uppercase tracking-wider mb-2 px-1">
            Conversaciones
          </div>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.thread_id}
                onClick={() => onSelectThread(conv.thread_id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors',
                  currentThreadId === conv.thread_id
                    ? 'bg-[#e0e0e0] text-[#111111]'
                    : 'text-[#6b6b6b] hover:bg-[#e8e8e8]',
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{conv.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#e5e5e5]">
          <a
            href="https://allinremodeling.us"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[#6b6b6b] hover:text-[#111111] transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            allinremodeling.us
          </a>
        </div>
      </motion.aside>
    </>
  );
}
