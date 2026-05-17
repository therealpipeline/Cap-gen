/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AudioUploader from './components/AudioUploader';
import { Github } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#f6f8fa] font-sans antialiased text-[#24292f] flex flex-col">
      {/* Interactive Navigation */}
      <header className="sticky top-0 z-50 bg-white/70 border-b border-[#d0d7de] py-3 px-4 md:px-10 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="bg-[#24292f] p-1.5 rounded-lg shadow-sm">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tighter">PART4-C</h1>
            <p className="text-[9px] text-[#0969da] uppercase tracking-[0.2em] font-black -mt-0.5">Engine v4.0</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-8">
          <nav className="hidden lg:flex items-center space-x-6 text-[11px] font-black uppercase tracking-widest text-[#57606a]">
            <a href="#" className="hover:text-[#0969da] transition-colors">Documentation</a>
            <a href="#" className="hover:text-[#0969da] transition-colors">Enterprise</a>
            <a href="#" className="hover:text-[#0969da] transition-colors">Status</a>
          </nav>
          <div className="h-4 w-[1px] bg-[#d0d7de] hidden md:block"></div>
          <button className="text-[11px] font-black bg-[#24292f] text-white px-4 py-2 rounded-xl hover:bg-[#1f2328] transition-all active:scale-95 shadow-md uppercase tracking-tight">
            Connect API
          </button>
        </div>
      </header>

      {/* Hero Section with Integrated Tool */}
      <main className="flex-1 relative overflow-hidden">
        {/* Modern Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#0969da]/10 via-transparent to-transparent rounded-full blur-[120px] -z-10 opacity-60"></div>
        <div className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-[#2da44e]/5 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-6xl mx-auto py-16 md:py-24 px-4 relative">
          <div className="text-center mb-16 px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-[#d0d7de] shadow-sm text-[10px] font-bold text-[#57606a] uppercase tracking-widest mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-[#2da44e] mr-2 animate-pulse"></span>
              Neural Subtitle Synthesis Active
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tighter text-[#111111] mb-8 leading-[0.95]"
            >
              Word-by-word <br className="hidden md:block" /> 
              <span className="text-[#0969da]">precision</span> captions.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#57606a] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Transform your raw audio into high-fidelity SRT files. 
              Powered by Groq's low-latency inference engine for millisecond-perfect synchronization.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          >
            <AudioUploader />
          </motion.div>
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-[#d0d7de] pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="bg-[#24292f] p-1 rounded-md">
                  <Github className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter">PART4-C</span>
              </div>
              <p className="text-[#57606a] text-sm max-w-sm leading-relaxed font-medium">
                Designing the next generation of transcription infrastructure. Lightweight, deterministic, and blindingly fast.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-6">Core Pipeline</h4>
              <ul className="space-y-3 text-sm text-[#57606a] font-medium">
                <li className="hover:text-[#0969da] cursor-pointer transition-colors">Whisper v3-Large</li>
                <li className="hover:text-[#0969da] cursor-pointer transition-colors">SRT Compiler</li>
                <li className="hover:text-[#0969da] cursor-pointer transition-colors">Word-Sync Lab</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-6">Network</h4>
              <ul className="space-y-3 text-sm text-[#57606a] font-medium">
                <li className="hover:text-[#0969da] cursor-pointer transition-colors">Groq Cloud</li>
                <li className="hover:text-[#0969da] cursor-pointer transition-colors">Vercel Edge</li>
                <li className="hover:text-[#0969da] cursor-pointer transition-colors">OpenAI API</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-10 border-t border-[#f6f8fa] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-8 text-[11px] font-bold text-[#8b949e] uppercase tracking-widest">
              <span className="hover:text-black cursor-pointer">Privacy</span>
              <span className="hover:text-black cursor-pointer">Security</span>
              <span className="hover:text-black cursor-pointer">SLA</span>
            </div>
            <p className="text-[11px] font-bold text-[#8b949e]">
              PART4-C PRO • BUILD 2026.05.17 • ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

