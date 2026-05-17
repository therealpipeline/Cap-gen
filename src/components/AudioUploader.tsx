import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Download, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptionResult {
  srt: string;
  transcription: string;
}

export default function AudioUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (!response.ok) {
        let errorMsg = 'Transcription failed';
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.details || errorData.error || errorMsg;
          } catch (e) {
            errorMsg = `Server error (${response.status}): Could not parse error response.`;
          }
        } else {
          // Handle non-JSON errors (like Vercel HTML error pages)
          const text = await response.text();
          if (response.status === 413) {
            errorMsg = "File too large for Vercel deployment. Max limit is 4.5MB on Free tier, 15MB on Pro.";
          } else if (response.status === 504) {
            errorMsg = "Gateway timeout: The transcription process exceeded Vercel's execution time limit.";
          } else if (text.includes("A server error occurred")) {
            errorMsg = "Vercel Server Error: Your serverless function crashed. Please check if GROQ_API_KEY is correctly set in Vercel Environment Variables.";
          } else {
            errorMsg = `Server error (${response.status}): ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
          }
        }
        throw new Error(errorMsg);
      }

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
          setResult(data);
        } catch (e) {
          throw new Error("Failed to parse successful response as JSON. The server might have returned an invalid result.");
        }
      } else {
        const rawText = await response.text();
        throw new Error(`Invalid response format (expected JSON, got ${contentType}). Content: ${rawText.substring(0, 50)}...`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadSRT = () => {
    if (!result) return;
    const blob = new Blob([result.srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0] || 'captions'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl px-2 sm:px-4 py-4 sm:py-8 mx-auto">
      {/* Information Panel - Simplified for Hero Integration */}
      <div className="mb-6 sm:mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Engine", value: "Whisper L3" },
          { label: "Accuracy", value: "Word-Level" },
          { label: "Max Size", value: "512MB" },
          { label: "Format", value: "MP3/WAV" }
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#d0d7de] p-3 rounded-xl shadow-sm text-center">
            <p className="text-[9px] text-[#8b949e] uppercase font-bold tracking-wider mb-0.5">{stat.label}</p>
            <p className="text-[11px] font-bold text-[#111111]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#d0d7de] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="bg-[#f6f8fa]/50 border-b border-[#d0d7de] px-5 sm:px-8 py-5">
          <h2 className="text-sm font-bold text-[#111111] flex items-center">
            <Upload className="w-4 h-4 mr-2 text-[#0969da]" />
            Partition Interface
          </h2>
        </div>
        
        <div className="p-6 sm:p-10">
          {!file ? (
            <div 
              className="group border-2 border-dashed border-[#d0d7de] rounded-2xl p-10 sm:p-20 flex flex-col items-center justify-center cursor-pointer hover:border-[#0969da] hover:bg-[#f3f9ff] transition-all duration-300"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-[#f6f8fa] p-5 rounded-full mb-5 group-hover:scale-110 group-hover:bg-[#ddf4ff] transition-all duration-300">
                <FileAudio className="w-10 h-10 text-[#57606a] group-hover:text-[#0969da]" />
              </div>
              <p className="text-base sm:text-lg text-[#111111] font-bold mb-2">Initialize Data Stream</p>
              <p className="text-xs text-[#57606a] text-center max-w-[200px]">Drop audio files here or click to browse local storage</p>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="audio/*" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-[#d0d7de] rounded-xl bg-[#f6f8fa]/30 gap-4">
                <div className="flex items-center space-x-4 w-full">
                  <div className="bg-white p-2.5 rounded-xl border border-[#d0d7de] shadow-sm flex-shrink-0">
                    <FileAudio className="w-6 h-6 text-[#24292f]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#111111] truncate pr-2">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-[#57606a] font-mono mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • READY
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="w-full sm:w-auto text-xs font-bold text-[#cf222e] bg-[#cf222e]/5 hover:bg-[#cf222e]/10 px-4 py-2 rounded-lg transition-colors border border-[#cf222e]/10 shrink-0"
                  disabled={loading}
                >
                  Discard File
                </button>
              </div>

              {!result && !loading && (
                <button
                  onClick={handleUpload}
                  className="group relative w-full py-4 px-6 bg-[#24292f] hover:bg-black text-white text-sm font-bold rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all active:scale-[0.98] flex items-center justify-center overflow-hidden"
                >
                  <span className="relative z-10 flex items-center tracking-tight">
                    PROCESS WITH WHISPER V3
                    <span className="ml-2 opacity-50 group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-[5px] border-[#f0f1f2] rounded-full border-t-[#0969da] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-[#0969da] rounded-full animate-bounce"></div>
                    </div>
                  </div>
                  <p className="text-xs font-black text-[#0969da] uppercase tracking-[0.25em] animate-pulse">Analyzing Waveforms</p>
                  <p className="text-[10px] text-[#8b949e] mt-2 font-medium">Allocating Groq Tensor Processing Units...</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 border border-[#cf222e]/20 bg-[#fff5f5] text-[#cf222e] rounded-xl flex flex-col space-y-3"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-tight">System Fault Detected</p>
                  <p className="text-[11px] leading-relaxed font-medium">{error}</p>
                </div>
              </div>
              {error.includes("GROQ_API_KEY") || error.includes("Vercel Server Error") ? (
                <div className="bg-white/50 p-3 rounded-lg border border-[#cf222e]/10">
                  <p className="text-[10px] font-bold text-[#24292f] mb-2 uppercase tracking-wide">Action Required:</p>
                  <ol className="text-[10px] space-y-1 list-decimal ml-4 text-[#57606a]">
                    <li>Go to your <b>Vercel Dashboard</b></li>
                    <li>Settings → <b>Environment Variables</b></li>
                    <li>Add Name: <span className="font-mono text-black">GROQ_API_KEY</span></li>
                    <li>Add Value: <span className="font-mono text-black">your_api_key_here</span></li>
                    <li><b>Redeploy</b> your application</li>
                  </ol>
                </div>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="mt-10 space-y-8"
          >
            <div className="bg-white border border-[#d0d7de] rounded-[24px] shadow-[0_15px_50px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="bg-white border-b border-[#f0f1f2] px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-[#111111]">Transcribed Text</h2>
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">Stream Output</p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button 
                    onClick={() => navigator.clipboard.writeText(result.transcription)}
                    className="flex-1 sm:flex-none text-[10px] font-bold text-[#57606a] bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] px-4 py-2 rounded-xl transition-colors active:scale-95"
                  >
                    Copy Text
                  </button>
                  <button 
                    onClick={downloadSRT}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 text-[10px] font-bold text-white bg-[#0969da] hover:bg-[#085bc1] px-5 py-2 rounded-xl shadow-lg shadow-[#0969da]/20 transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SRT</span>
                  </button>
                </div>
              </div>
              <div className="p-6 sm:p-8 max-h-[300px] overflow-y-auto text-[13px] sm:text-sm text-[#24292f] leading-relaxed scrollbar-thin scrollbar-thumb-[#d0d7de] scroll-smooth">
                {result.transcription}
              </div>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-[24px] shadow-2xl overflow-hidden">
              <div className="bg-[#161b22] border-b border-[#30363d] px-6 sm:px-8 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#f0f6fc]">Captions Object</h2>
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-[0.1em]">SRT Source Code</p>
                  </div>
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8 max-h-[350px] overflow-y-auto font-mono text-[11px] text-[#7d8590] whitespace-pre leading-relaxed scrollbar-dark">
                {result.srt}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
