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
      <div 
        className="w-full max-w-2xl border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 p-12 text-center cursor-pointer hover:bg-slate-800"
        onClick={() => !loading && fileInputRef.current?.click()}
      >
        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.pdf,.md" />
        {loading ? <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto" /> : <UploadCloud className="w-12 h-12 text-blue-400 mx-auto" />}
        <p className="mt-4 text-slate-300">Click to upload files</p>
      </div>
      
      <div className="flex gap-2 w-full max-w-2xl">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="Paste URL..." 
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2"
        />
        <button onClick={() => onUrlUpload(url)} disabled={loading} className="bg-blue-600 px-6 py-2 rounded-lg">Add</button>
      </div>
    </div>
  );
};