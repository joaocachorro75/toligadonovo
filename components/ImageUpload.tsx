import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { db } from '../services/db';

interface ImageUploadProps {
  label: string;
  currentImage?: string;
  onImageChange: (url: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, currentImage, onImageChange, className }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (5MB limit for uploads)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = await db.uploadImage(file);
      onImageChange(url);
    } catch (err) {
      setError('Erro ao enviar imagem.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onImageChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      
      <div className="flex items-start gap-4">
        {currentImage ? (
          <div className="relative group">
            <div className="w-32 h-32 rounded-lg border border-gray-700 overflow-hidden bg-gray-900">
              <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`w-32 h-32 rounded-lg border-2 border-dashed border-gray-700 bg-gray-900 flex flex-col items-center justify-center cursor-pointer transition-colors group ${loading ? 'opacity-50' : 'hover:border-cyan-500'}`}
          >
            {loading ? (
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-500 group-hover:text-cyan-500 mb-2" />
                <span className="text-xs text-gray-500 group-hover:text-gray-300">Carregar</span>
              </>
            )}
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-2 mb-1 disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4" />
            {loading ? 'Enviando...' : 'Escolher Arquivo'}
          </button>
          <p className="text-xs text-gray-500">
            Recomendado: .jpg ou .png (max 5MB).
            {error && <span className="block text-red-400 mt-1">{error}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};