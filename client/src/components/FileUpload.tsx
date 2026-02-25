import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { api } from '../api/client';

interface Props { projectId?: string; clientId: string; onUpload?: (asset: any) => void; }

export default function FileUpload({ projectId, clientId, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name);
    fd.append('client_id', clientId);
    if (projectId) fd.append('project_id', projectId);
    try {
      const asset = await api.upload('/assets/upload', fd);
      onUpload?.(asset);
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button onClick={() => inputRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-700 rounded-lg text-sm text-gray-400 hover:border-gray-500 hover:text-white disabled:opacity-50">
        <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
}
