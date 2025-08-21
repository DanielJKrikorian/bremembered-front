import React from 'react';
import { Upload, X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Progress } from '../ui/Progress';

interface FileUploadProps {
  file: File | null;
  label: string;
  accept: string;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
  uploadProgress: number;
  success: boolean;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  label,
  accept,
  onFileSelect,
  onRemove,
  uploading,
  uploadProgress,
  success,
  disabled = false,
}) => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      {file ? (
        <div className="flex items-center justify-between">
          <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
          <Button variant="ghost" icon={X} size="sm" onClick={onRemove} className="text-red-500" />
        </div>
      ) : (
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={onFileSelect}
            className="hidden"
            disabled={uploading || disabled}
          />
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-gray-600">{label}</span>
          </div>
        </label>
      )}
      {uploading && (
        <div className="mt-4">
          <Progress value={uploadProgress} className="w-full" />
          <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
        </div>
      )}
      {success && (
        <div className="mt-2 flex items-center text-green-600">
          <Check className="w-5 h-5 mr-2" />
          <span>File uploaded successfully</span>
        </div>
      )}
    </div>
  );
};