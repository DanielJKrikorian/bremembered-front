import React from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProfilePhotoUploadProps {
  profilePhoto: File | null;
  onPhotoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  profilePhoto,
  onPhotoSelect,
  onRemove
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo *</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {profilePhoto ? (
          <div className="space-y-3">
            <img
              src={URL.createObjectURL(profilePhoto)}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
            />
            <p className="text-sm text-gray-600">{profilePhoto.name}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              icon={X}
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
            >
              Choose File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};