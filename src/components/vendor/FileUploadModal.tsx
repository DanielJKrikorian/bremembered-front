import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  title: string;
  description: string;
  acceptedTypes: string;
  maxSize?: number; // in MB
  currentFile?: File | null;
  uploadType: 'profile' | 'license' | 'work';
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  title,
  description,
  acceptedTypes,
  maxSize = 10,
  currentFile,
  uploadType
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (uploadType) {
      case 'profile': return Camera;
      case 'license': return FileText;
      case 'work': return Upload;
      default: return Upload;
    }
  };

  const Icon = getIcon();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim());
    const fileType = file.type;
    const isValidType = acceptedTypesArray.some(type => {
      if (type === 'image/*') return fileType.startsWith('image/');
      if (type === 'video/*') return fileType.startsWith('video/');
      return fileType === type;
    });

    if (!isValidType) {
      return `Please select a valid file type: ${acceptedTypes}`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onFileSelect(file);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {currentFile ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">File Selected</h4>
              <p className="text-sm text-gray-600 mb-4">{currentFile.name}</p>
              <p className="text-xs text-gray-500 mb-6">
                Size: {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleButtonClick}
                  className="flex-1"
                >
                  Choose Different File
                </Button>
                <Button
                  variant="primary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive 
                  ? 'border-rose-400 bg-rose-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDrag}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onClick={handleButtonClick}
            >
              <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {dragActive ? 'Drop file here' : 'Upload File'}
              </h4>
              <p className="text-gray-600 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <Button variant="outline">
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Accepted formats: {acceptedTypes}<br />
                Maximum size: {maxSize}MB
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </Card>
    </div>
  );
};