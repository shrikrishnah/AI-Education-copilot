import React, { useRef, useState } from 'react';
import { UploadCloud, File as FileIcon, Loader2, Youtube, Link } from 'lucide-react';

interface UploadProps {
  onUpload: (files: File[]) => void;
  onUrlUpload: (url: string) => void;
  loading: boolean;
}

export const Upload: React.FC<UploadProps> = ({ onUpload, onUrlUpload, loading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onUrlUpload(url);
    setUrl('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Ingest Learning Materials</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Upload PDFs, text files, or paste YouTube links. The AI will extract, chunk, and validate all content.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        {/* File Drop Area */}
        <div 
          className="w-full border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group p-12 text-center"
          onClick={() => !loading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".txt,.pdf,.md,.csv" 
          />
          
          {loading ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-white">Analyzing Content...</h3>
              <p className="text-sm text-slate-500 mt-2">Gemini is reading, tagging, and validating.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
                <UploadCloud className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-lg font-medium text-white group-hover:text-brand-300 transition-colors">
                Click to upload or drag and drop
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Supports PDF, DOCX, TXT (Max 50MB)
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 text-slate-600">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-xs font-semibold">OR ADD LINK</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* URL Input */}
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {url.includes('youtube') || url.includes('youtu.be') ? (
                <Youtube className="h-5 w-5 text-red-500" />
              ) : (
                <Link className="h-5 w-5 text-slate-500" />
              )}
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube or Website URL..."
              className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Add Resource'}
          </button>
        </form>
      </div>

      <div className="w-full max-w-2xl">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Processing Pipeline</h4>
        <div className="space-y-3">
          <PipelineStep step={1} label="Text Extraction & Cleaning" active={loading} />
          <PipelineStep step={2} label="Semantic Analysis & Tagging" active={loading} />
          <PipelineStep step={3} label="Fact Checking & Validation" active={loading} />
          <PipelineStep step={4} label="Database Indexing" active={loading} />
        </div>
      </div>
    </div>
  );
};

const PipelineStep = ({ step, label, active }: { step: number, label: string, active: boolean }) => (
  <div className={`flex items-center gap-4 p-3 rounded-lg border ${active ? 'bg-slate-800/50 border-slate-700' : 'border-transparent opacity-50'}`}>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
      {step}
    </div>
    <span className="text-sm text-slate-300">{label}</span>
    {active && <Loader2 className="w-4 h-4 text-brand-500 animate-spin ml-auto" />}
  </div>
);