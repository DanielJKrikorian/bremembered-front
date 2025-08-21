import React from 'react';
import { FileUpload } from './FileUpload';
import { Button } from '../ui/Button';
import { Plus, X } from 'lucide-react';

interface WorkSamplesUploadProps {
  workSamples: File[];
  onFilesSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onClearAll: () => void;
  maxFiles: number;
  uploading: boolean;
  uploadProgress: number;
  success: boolean;
}

export const WorkSamplesUpload: React.FC<WorkSamplesUploadProps> = ({
  workSamples,
  onFilesSelect,
  onRemove,
  onClearAll,
  maxFiles,
  uploading,
  uploadProgress,
  success,
}) => {
  return (
    <div className="space-y-6">
      <label className="block text-sm font-medium text-gray-700 mb-4">Work Samples *</label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workSamples.map((file, index) => (
          <FileUpload
            key={index}
            file={file}
            label={`Work Sample ${index + 1}`}
            accept="image/*,video/*"
            onFileSelect={onFilesSelect}
            onRemove={() => onRemove(index)}
            uploading={uploading}
            uploadProgress={uploadProgress}
            success={success}
            disabled={workSamples.length >= maxFiles || uploading}
          />
        ))}
        {workSamples.length < maxFiles && (
          <FileUpload
            file={null}
            label="Upload work samples (images or videos)"
            accept="image/*,video/*"
            onFileSelect={onFilesSelect}
            onRemove={() => {}}
            uploading={uploading}
            uploadProgress={uploadProgress}
            success={success}
            disabled={workSamples.length >= maxFiles || uploading}
          />
        )}
      </div>
      {workSamples.length > 0 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            icon={Plus}
            onClick={() => document.getElementById('work-samples-input')?.click()}
            disabled={workSamples.length >= maxFiles || uploading}
          >
            Add More Samples
          </Button>
          <Button
            variant="outline"
            icon={X}
            onClick={onClearAll}
            disabled={uploading}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>
      )}
      <input
        type="file"
        id="work-samples-input"
        accept="image/*,video/*"
        onChange={onFilesSelect}
        className="hidden"
        multiple
      />
      {workSamples.length >= maxFiles && (
        <p className="text-sm text-amber-600 mt-2">
          Maximum of {maxFiles} files reached. Remove files to add different ones.
        </p>
      )}
    </div>
  );
};