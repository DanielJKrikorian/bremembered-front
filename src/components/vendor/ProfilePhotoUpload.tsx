import React from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProfilePhotoUploadProps {
  profilePhoto: File | null;
  onPhotoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading?: boolean;
  uploadProgress?: number;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  profilePhoto,
  onPhotoSelect,
  onRemove,
  uploading = false,
  uploadProgress = 0
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo *</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {profilePhoto ? (
          <div className="space-y-3">
            {uploading ? (
              <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto border-4 border-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500 rounded-full" style={{ clipPath: `circle(${uploadProgress}% at 50% 50%)` }}></div>
                <div className="relative z-10 text-white font-bold text-sm">{uploadProgress}%</div>
              </div>
            ) : (
              <img
                src={URL.createObjectURL(profilePhoto)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
              />
            )}
            <p className="text-sm text-gray-600">{profilePhoto.name}</p>
            {uploading && (
              <div className="space-y-2">
                <p className="text-sm text-blue-600">Uploading profile photo...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              icon={X}
              disabled={uploading}
            >
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              {uploading ? 'Uploading...' : 'Upload a professional headshot'}
            </p>
            {uploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onPhotoSelect}
              className="hidden"
              id="headshot-input"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('headshot-input')?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};