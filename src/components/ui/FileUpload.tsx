import React from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  file: File | null;
  label: string;
  accept: string;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  success?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  label,
  accept,
  onFileSelect,
  onRemove,
  uploading = false,
  uploadProgress = 0,
  success = false,
  disabled = false,
  className = ''
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const getFilePreview = () => {
    if (!file) return null;

    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const imagePreview = getFilePreview();

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
          ${file ? 'border-indigo-300 bg-indigo-50' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : success ? (
          <div className="space-y-2">
            <Check className="w-8 h-8 text-green-600 mx-auto" />
            <p className="text-sm text-green-600 font-medium">Upload successful!</p>
          </div>
        ) : file ? (
          <div className="space-y-3">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg mx-auto"
              />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">
                Click to browse or drag and drop
              </p>
            </div>
          </div>
        )}
      </div>

      {file && !uploading && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 truncate flex-1 mr-3">
            {file.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={X}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};