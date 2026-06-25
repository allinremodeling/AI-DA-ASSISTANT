import { useState, useCallback, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { Sidebar } from './components/Sidebar';
import { type ChatMessage } from './lib/types';
import { getThreadId, createNewThread, getThreadList } from './lib/thread';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const threads = getThreadList().map(t => ({
    id: t.id,
    thread_id: t.id,
    session_id: '',
    title: t.title,
    created_at: t.createdAt,
    updated_at: t.createdAt,
  }));

  useEffect(() => {
    const existingThread = getThreadId();
    if (existingThread) {
      setThreadId(existingThread);
    } else {
      const newThread = createNewThread();
      setThreadId(newThread);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    const newThread = createNewThread();
    setThreadId(newThread);
    setMessages([]);
  }, []);

  const handleThreadSelect = useCallback((tid: string) => {
    setThreadId(tid);
    const savedMessages = sessionStorage.getItem(`messages_${tid}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([]);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen bg-white text-[#111111]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectThread={handleThreadSelect}
        currentThreadId={threadId}
        conversations={threads}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          threadId={threadId}
          messages={messages}
          setMessages={setMessages}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
