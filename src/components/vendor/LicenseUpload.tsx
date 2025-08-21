import React from 'react';
import { FileUpload } from './FileUpload';

interface LicenseUploadProps {
  frontLicense: File | null;
  backLicense: File | null;
  onFrontSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBackSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFront: () => void;
  onRemoveBack: () => void;
  uploadingFront: boolean;
  uploadingBack: boolean;
  uploadProgressFront: number;
  uploadProgressBack: number;
  successFront: boolean;
  successBack: boolean;
}

export const LicenseUpload: React.FC<LicenseUploadProps> = ({
  frontLicense,
  backLicense,
  onFrontSelect,
  onBackSelect,
  onRemoveFront,
  onRemoveBack,
  uploadingFront,
  uploadingBack,
  uploadProgressFront,
  uploadProgressBack,
  successFront,
  successBack,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Driver's License (Front) *</label>
        <FileUpload
          file={frontLicense}
          label="Upload front of license"
          accept="image/*"
          onFileSelect={onFrontSelect}
          onRemove={onRemoveFront}
          uploading={uploadingFront}
          uploadProgress={uploadProgressFront}
          success={successFront}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Driver's License (Back) *</label>
        <FileUpload
          file={backLicense}
          label="Upload back of license"
          accept="image/*"
          onFileSelect={onBackSelect}
          onRemove={onRemoveBack}
          uploading={uploadingBack}
          uploadProgress={uploadProgressBack}
          success={successBack}
        />
      </div>
    </div>
  );
};