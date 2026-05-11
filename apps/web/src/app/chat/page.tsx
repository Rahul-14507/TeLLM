"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  PlusCircle, 
  History, 
  User, 
  Bot, 
   ChevronRight, 
  Sparkles,
  RefreshCw,
  LogOut,
  AlertCircle,
  BookOpen
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { HintLevelBar } from '@/components/HintLevelBar';
import { SimCard } from '@/components/SimCard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SimEvent {
  template: string;
  params: Record<string, string | number>;
}

interface Message {
  id: string;
  role: 'student' | 'assistant';
  content: string;
  sim_event?: SimEvent;
  sources?: string[];
  timestamp: Date;
}


interface Session {
  id: string;
  subject: string;
  lastMessage: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hintLevel, setHintLevel] = useState(1);
  const [currentSubject, setCurrentSubject] = useState('Physics Class 11');
  const [curriculumSources, setCurriculumSources] = useState<string[]>([]);
  const [sessions, setSessions] = useState<Session[]>([

    { id: '1', subject: 'Physics Class 11', lastMessage: 'Understanding Projectile Motion...' },
    { id: '2', subject: 'Computer Science', lastMessage: 'Explain Recursion clearly.' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/curriculum/sources', {
          headers: { 'Authorization': 'Bearer placeholder-token' }
        });
        const data = await response.json();
        if (data.sources) setCurriculumSources(data.sources);
      } catch (e) {
        console.error('Failed to fetch sources', e);
      }
    };
    fetchSources();
  }, []);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const studentMessage: Message = {
      id: Date.now().toString(),
      role: 'student',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, studentMessage]);
    setInputValue('');
    setIsStreaming(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer placeholder-token' // In real app, get from store/cookie
        },
        body: JSON.stringify({
          session_id: 'current-session',
          content: inputValue,
          subject_id: 'physics-101'
        })
      });

      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                accumulatedContent += data.content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                ));
              }

              if (data.sim_event) {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, sim_event: data.sim_event } : m
                ));
              }

              if (data.hint_level !== undefined) {
                setHintLevel(data.hint_level);
              }

              if (data.sources) {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, sources: data.sources } : m
                ));
              }

              if (data.error) {

                setMessages(prev => prev.map(m => 
                  m.id === assistantMsgId ? { ...m, content: data.error } : m
                ));
              }
            } catch (e) {
              console.error('Error parsing SSE chunk', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, content: 'Sorry, I encountered an error. Please try again.' } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar - 30% */}
      <aside className="w-[30%] border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">TeLLM</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold leading-none">EdTech Platform</p>
            </div>
          </div>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <PlusCircle className="w-5 h-5" />
            Start New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <div className="px-4 mb-2 flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            <History className="w-3 h-3" />
            Recent Sessions
          </div>
          {sessions.map(s => (
            <button 
              key={s.id}
              className="w-full text-left p-4 rounded-xl border border-transparent hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{s.subject}</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{s.lastMessage}</p>
            </button>
          ))}
        </div>

        <div className="px-8 mt-8 space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-3">
            <AlertCircle className="w-3.5 h-3.5" />
            Source Data (RAG)
          </div>
          {curriculumSources.length > 0 ? (
            <div className="space-y-2">
              {curriculumSources.map(source => (
                <div key={source} className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-slate-400">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="truncate">{source}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 italic px-2">No curriculum data loaded yet.</p>
          )}
        </div>


        <div className="p-6 border-t border-slate-800">
          <HintLevelBar level={hintLevel} />
        </div>
      </aside>

      {/* Main Chat Area - 70% */}
      <main className="flex-1 flex flex-col bg-slate-950 relative">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] pointer-events-none rounded-full" />

        <header className="h-20 border-b border-slate-800/50 flex items-center px-10 relative z-10 backdrop-blur-md bg-slate-950/50">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2 text-white">
              {currentSubject}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Socratic Learning Active</p>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 text-xs text-slate-300">
              <RefreshCw className="w-3.5 h-3.5" />
              AI Assistant
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 relative z-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-3xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_40px_rgba(37,99,235,0.1)]">
                  <Sparkles className="w-10 h-10 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">How can I help you learn today?</h3>
                  <p className="text-slate-400 max-w-sm">Ask about physics, concepts, or problems and we’ll figure it out together.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
                  {['Why does ice float?', 'How does gravity work?', 'Explain Ohms law', 'Solve x² + 2x + 1 = 0'].map(q => (
                    <button 
                      key={q}
                      onClick={() => setInputValue(q)}
                      className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-left text-sm text-slate-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((message, i) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  message.role === 'student' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className="flex items-center gap-2 mb-2 px-1">
                  {message.role === 'assistant' ? (
                    <>
                      <Bot className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">TeLLM Assistant</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">You (Student)</span>
                      <User className="w-4 h-4 text-slate-500" />
                    </>
                  )}
                </div>

                <div className={cn(
                  "p-5 rounded-3xl text-sm leading-relaxed shadow-sm ring-1",
                  message.role === 'student' 
                    ? "bg-blue-600 text-white ring-blue-500 shadow-[0_4px_20px_rgba(37,99,235,0.2)] rounded-tr-none" 
                    : "bg-slate-900 text-slate-200 ring-slate-800 rounded-tl-none"
                )}>
                  {message.content || (isStreaming && i === messages.length - 1 && (
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  ))}
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map(source => (
                          <span key={source} className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-md text-[10px] text-blue-400 border border-slate-700">
                            <BookOpen className="w-3 h-3" />
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                {message.sim_event && (
                  <div className="w-full mt-4">
                    <SimCard template={message.sim_event.template} params={message.sim_event.params} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <footer className="p-8 pb-10 relative z-10">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden focus-within:border-blue-500/50 transition-all shadow-2xl">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask your tutor anything..."
                className="flex-1 bg-transparent px-6 py-5 text-sm outline-none resize-none placeholder:text-slate-600 text-slate-200 max-h-32 min-h-[64px]"
                rows={1}
              />
              <div className="px-4">
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    inputValue.trim() && !isStreaming
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-center text-[10px] text-slate-600 font-medium uppercase tracking-widest">
              Focusing on critical thinking. TeLLM is here to help you learn.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
