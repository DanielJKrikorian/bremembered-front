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
  const imageUrl = profilePhoto instanceof File ? URL.createObjectURL(profilePhoto) : '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo *</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {profilePhoto ? (
          <div className="space-y-3">
            {uploading ? (
              <div className="relative w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white font-bold text-sm">{uploadProgress}%</div>
                </div>
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-300"
                  style={{ height: `${uploadProgress}%` }}
                ></div>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
              />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{profilePhoto.name}</p>
              <p className="text-xs text-gray-500">
                {(profilePhoto.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {uploading && (
              <div className="space-y-2">
                <p className="text-sm text-blue-600 font-medium">Uploading profile photo...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600">{uploadProgress}% complete</p>
              </div>
            )}
            {!uploading && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemove}
                icon={X}
              >
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div>
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              JPG, PNG, or GIF format. Maximum 5MB.
            </p>
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
              Choose File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};