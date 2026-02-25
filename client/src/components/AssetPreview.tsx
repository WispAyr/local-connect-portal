import { X } from 'lucide-react';

interface Props { asset: any; onClose: () => void; }

export default function AssetPreview({ asset, onClose }: Props) {
  const url = `/uploads/${asset.file_path}`;
  const isImage = asset.mime_type?.startsWith('image/');
  const isVideo = asset.mime_type?.startsWith('video/');
  const isPDF = asset.mime_type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-gray-400 hover:text-white"><X size={24} /></button>
        {isImage && <img src={url} alt={asset.name} className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />}
        {isVideo && <video src={url} controls className="w-full max-h-[85vh] rounded-lg" />}
        {isPDF && <iframe src={url} className="w-full h-[85vh] rounded-lg" />}
        {!isImage && !isVideo && !isPDF && <div className="bg-surface-2 rounded-lg p-12 text-center text-gray-400">Preview not available for this file type</div>}
      </div>
    </div>
  );
}
