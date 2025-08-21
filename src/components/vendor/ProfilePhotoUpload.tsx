import React from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProfilePhotoUploadProps {
  profilePhoto: File | null;
  onPhotoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading?: boolean;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  profilePhoto,
  onPhotoSelect,
  onRemove,
  uploading = false
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo *</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {profilePhoto ? (
          <div className="space-y-3">
            {uploading ? (
              <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto border-4 border-white shadow-lg flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <img
                src={URL.createObjectURL(profilePhoto)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
              />
            )}
            <p className="text-sm text-gray-600">{profilePhoto.name}</p>
            {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
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
            <p className="text-sm text-gray-600 mb-4">Upload a professional headshot</p>
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