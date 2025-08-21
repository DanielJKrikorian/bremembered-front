import React from 'react';
import { Upload, Camera, Video, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkSamplesUploadProps {
  workSamples: File[];
  onFilesSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onClearAll: () => void;
  maxFiles?: number;
}

export const WorkSamplesUpload: React.FC<WorkSamplesUploadProps> = ({
  workSamples,
  onFilesSelect,
  onRemove,
  onClearAll,
  maxFiles = 10
}) => {
  return (
    <div className="space-y-6">
      {workSamples.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Selected Files ({workSamples.length}/{maxFiles})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {workSamples.map((fileName, index) => {
              const isVideo = fileName.type.startsWith('video/');
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isVideo ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {isVideo ? (
                        <Video className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Camera className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{fileName.name}</p>
                      <p className="text-xs text-gray-500">
                        {(fileName.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Work Samples</h4>
        <p className="text-gray-600 mb-4">
          Upload photos (up to 25MB) and videos (up to 500MB) showcasing your best work
        </p>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onFilesSelect}
          className="hidden"
          id="work-samples-input"
        />
        <div className="flex space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={() => document.getElementById('work-samples-input')?.click()}
            disabled={workSamples.length >= maxFiles}
          >
            {workSamples.length === 0 ? 'Choose Files' : 'Add More Files'}
          </Button>
          {workSamples.length > 0 && (
            <Button
              variant="outline"
              onClick={onClearAll}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
        </div>
        
        {workSamples.length >= maxFiles && (
          <p className="text-sm text-amber-600 mt-2">
            Maximum of {maxFiles} files reached. Remove files to add different ones.
          </p>
        )}
      </div>
    </div>
  );
};