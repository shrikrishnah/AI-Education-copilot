import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';

interface UploadProps {
  onUpload: (files: File[]) => void;
  onUrlUpload: (url: string) => void;
  loading: boolean;
}

export const Upload: React.FC<UploadProps> = ({ onUpload, onUrlUpload, loading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onUpload(Array.from(e.target.files));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Ingest Learning Materials</h2>
        <p className="text-slate-400">Upload PDFs, Texts, or Images for AI analysis</p>
      </div>

      <div 
        className="w-full max-w-2xl border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 p-12 text-center cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => !loading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".txt,.pdf,.md,.jpg,.jpeg,.png,.webp" 
        />
        {loading ? <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto" /> : <UploadCloud className="w-12 h-12 text-blue-400 mx-auto" />}
        <p className="mt-4 text-slate-300 font-medium">Click to upload files</p>
        <p className="text-sm text-slate-500 mt-2">Supports PDF, TXT, MD, JPG, PNG</p>
      </div>
      
      <div className="flex gap-2 w-full max-w-2xl">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="Paste URL..." 
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
        />
        <button onClick={() => onUrlUpload(url)} disabled={loading} className="bg-blue-600 px-6 py-2 rounded-lg text-white hover:bg-blue-500 transition-colors">Add</button>
      </div>
    </div>
  );
};