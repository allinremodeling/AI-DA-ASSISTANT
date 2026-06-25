// Thread management using sessionStorage for persistence
const SESSION_KEY = 'allin_ai_session';
const THREADS_KEY = 'allin_ai_threads';

export function getSessionId(): string {
  let session = sessionStorage.getItem(SESSION_KEY);
  if (!session) {
    session = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

export function getThreadId(): string | null {
  return sessionStorage.getItem(THREADS_KEY);
}

export function setThreadId(threadId: string): void {
  sessionStorage.setItem(THREADS_KEY, threadId);
}

export function createNewThread(): string {
  const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setThreadId(threadId);
  // Save thread list for sidebar
  const threads = getThreadList();
  threads.unshift({
    id: threadId,
    title: 'Nueva conversación',
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem('allin_ai_thread_list', JSON.stringify(threads.slice(0, 50)));
  return threadId;
}

export function getThreadList(): { id: string; title: string; createdAt: string }[] {
  try {
    return JSON.parse(localStorage.getItem('allin_ai_thread_list') || '[]');
  } catch {
    return [];
  }
}

export function saveThreadTitle(threadId: string, title: string): void {
  const threads = getThreadList();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx >= 0) {
    threads[idx].title = title;
  }
  localStorage.setItem('allin_ai_thread_list', JSON.stringify(threads));
}

export function saveMessages(threadId: string, messages: any[]): void {
  sessionStorage.setItem(`messages_${threadId}`, JSON.stringify(messages));
}

export function getMessages(threadId: string): any[] {
  try {
    return JSON.parse(sessionStorage.getItem(`messages_${threadId}`) || '[]');
  } catch {
    return [];
  }
}
