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
  const [imageUrl, setImageUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (profilePhoto instanceof File) {
      const url = URL.createObjectURL(profilePhoto);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageUrl('');
    }
  }, [profilePhoto]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo *</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {profilePhoto ? (
          <div className="space-y-3">
            {uploading ? (
              <div className="space-y-4">
                <div className="relative w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg overflow-hidden">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white font-bold text-sm">{uploadProgress}%</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">Uploading profile photo...</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600">{uploadProgress}% complete</p>
                </div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">{profilePhoto.name}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(profilePhoto.size)}
              </p>
            </div>
            {uploading ? (
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
            ) : (
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