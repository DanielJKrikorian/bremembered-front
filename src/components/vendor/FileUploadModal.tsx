import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, AlertCircle, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: File[]) => void;
  title: string;
  description: string;
  acceptedTypes: string;
  maxSize?: number; // in MB
  currentFiles?: File[];
  uploadType: 'profile' | 'license' | 'work';
  multiple?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  title,
  description,
  acceptedTypes,
  maxSize = 10,
  currentFiles = [],
  uploadType,
  multiple = false,
  uploading = false,
  uploadProgress = 0
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
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
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

  const handleFileSelect = (files: File[]) => {
    const validFiles: File[] = [];
    let hasError = false;

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        hasError = true;
        break;
      }
      validFiles.push(file);
    }

    if (!hasError && validFiles.length > 0) {
      setError(null);
      onFileSelect(validFiles);
      if (!multiple) {
        onClose();
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (multiple) {
      handleFileSelect(files);
    } else if (files.length > 0) {
      handleFileSelect([files[0]]);
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
    if (multiple) {
      handleFileSelect(files);
    } else if (files.length > 0) {
      handleFileSelect([files[0]]);
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

          {uploading ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Uploading Files...</h4>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
            </div>
          ) : currentFiles.length > 0 ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                {currentFiles.length} File{currentFiles.length !== 1 ? 's' : ''} Selected
              </h4>
              <div className="space-y-2 mb-4">
                {currentFiles.map((file, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleButtonClick}
                  className="flex-1"
                >
                  {multiple ? 'Add More Files' : 'Choose Different File'}
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
                {dragActive ? 'Drop files here' : `Upload ${multiple ? 'Files' : 'File'}`}
              </h4>
              <p className="text-gray-600 mb-4">
                Drag and drop your {multiple ? 'files' : 'file'} here, or click to browse
              </p>
              <Button variant="outline">
                Choose {multiple ? 'Files' : 'File'}
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
            multiple={multiple}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </Card>
    </div>
  );
};