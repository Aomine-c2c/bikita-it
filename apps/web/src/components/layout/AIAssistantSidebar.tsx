"use client";

import React, { useState } from "react";
import { Sparkles, X, Send, Search, User, Laptop, Bot, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickPrompts = [
  "Who has laptop IT-0241?",
  "Show assets due for replacement",
  "Generate this month's audit report",
  "Find low-stock consumables",
];

export function AIAssistantSidebar({ isOpen, onClose }: AIAssistantSidebarProps) {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{role: "user" | "ai", content: any}[]>([]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setQuery("");
    setIsTyping(true);

    // Mock AI Response Delay
    setTimeout(() => {
      setIsTyping(false);
      // Hardcoded mock response based on the prompt
      if (text.includes("IT-0241")) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: (
            <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm w-full">
              <p className="text-sm text-foreground mb-4">Laptop <span className="font-mono font-bold text-primary">IT-0241</span> is currently assigned to <span className="font-semibold">Sarah Jenkins</span>.</p>
              
              <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">SJ</div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Sarah Jenkins</p>
                    <p className="text-[10px] text-muted-foreground">Product Design</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold text-primary hover:underline">View Profile</button>
              </div>
            </div>
          )
        }]);
      } else if (text.includes("replacement")) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: (
            <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm w-full">
              <p className="text-sm text-foreground mb-3">I found <span className="font-bold text-amber-500">14 devices</span> that have reached their 4-year lifecycle and are due for replacement.</p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700">Procurement Alert</p>
                  <p className="text-[10px] text-amber-600 mt-1">Estimated replacement cost is $28,500. Would you like me to draft a procurement request?</p>
                </div>
              </div>
            </div>
          )
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: <p className="text-sm text-foreground leading-relaxed">I've analyzed the platform data. How else can I assist you with this?</p> 
        }]);
      }
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="h-full border-l border-border/60 bg-[#FAFAFA] -[#0B0F19] flex flex-col shrink-0 overflow-hidden relative z-20"
        >
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-border/40 shrink-0 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Xiphos AI</h2>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
            
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl" />
                  <Sparkles className="w-8 h-8 text-indigo-500 relative z-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">How can I help?</h3>
                  <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">Ask me to find assets, analyze spending, or automate IT tasks.</p>
                </div>
                
                <div className="w-full space-y-2 mt-4 text-left">
                  {quickPrompts.map((prompt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="w-full p-3 bg-white border border-border/60 hover:border-indigo-500/50 rounded-xl text-xs font-medium text-foreground hover:text-indigo-600 transition-all flex items-center justify-between group shadow-sm"
                    >
                      {prompt}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "ai" && (
                  <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center shrink-0 mr-3 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[85%]",
                  msg.role === "user" ? "bg-primary text-white p-3 rounded-2xl rounded-tr-sm shadow-sm" : ""
                )}>
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-border/40 shrink-0">
            <div className="relative flex items-end bg-slate-50 border border-border/60 rounded-xl shadow-sm focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(query);
                  }
                }}
                placeholder="Ask AI Operations..."
                className="w-full bg-transparent p-3 text-sm outline-none resize-none max-h-32 min-h-[44px]"
                rows={1}
              />
              <button 
                onClick={() => handleSend(query)}
                disabled={!query.trim()}
                className="p-2 m-1.5 shrink-0 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[9px] text-muted-foreground mt-3 uppercase tracking-wider font-semibold">
              Xiphos AI uses advanced context analysis
            </p>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
