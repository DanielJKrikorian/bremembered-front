import React from 'react';
import { FileUpload } from './FileUpload'; // Adjust to '../ui/FileUpload' if needed

interface ProfilePhotoUploadProps {
  profilePhoto: File | null;
  onPhotoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
  uploadProgress: number;
  success: boolean;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  profilePhoto,
  onPhotoSelect,
  onRemove,
  uploading,
  uploadProgress,
  success,
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

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">Profile Photo *</label>
      {imageUrl && !uploading && (
        <div className="mb-4 flex justify-center">
          <img
            src={imageUrl}
            alt="Profile Preview"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>
      )}
      <FileUpload
        file={profilePhoto}
        label="Upload profile photo"
        accept="image/*"
        onFileSelect={onPhotoSelect}
        onRemove={onRemove}
        uploading={uploading}
        uploadProgress={uploadProgress}
        success={success}
      />
    </div>
  );
};