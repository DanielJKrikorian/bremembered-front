import React from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface LicenseUploadProps {
  frontLicense: File | null;
  backLicense: File | null;
  onFrontSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBackSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFront: () => void;
  onRemoveBack: () => void;
  uploadingFront?: boolean;
  uploadingBack?: boolean;
  uploadProgressFront?: number;
  uploadProgressBack?: number;
}

export const LicenseUpload: React.FC<LicenseUploadProps> = ({
  frontLicense,
  backLicense,
  onFrontSelect,
  onBackSelect,
  onRemoveFront,
  onRemoveBack,
  uploadingFront = false,
  uploadingBack = false,
  uploadProgressFront = 0,
  uploadProgressBack = 0
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Driver's License Front */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Driver's License (Front) *</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {frontLicense ? (
            <div className="space-y-3">
              {uploadingFront ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">Uploading license front...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgressFront}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600">{uploadProgressFront}% complete</p>
                </div>
              ) : (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              )}
              {!uploadingFront && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">{frontLicense.name}</p>
                  <p className="text-xs text-gray-500">
                    {(frontLicense.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-green-600 font-medium">✓ Uploaded successfully</p>
                </div>
              )}
              {!uploadingFront && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemoveFront}
                  icon={X}
                >
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Upload front of license
              </h4>
              <p className="text-gray-600 mb-4">
                JPG, PNG, or GIF format. Maximum 10MB.
              </p>
              <input
                type="file"
                id="license-front-input"
                accept="image/*"
                onChange={onFrontSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('license-front-input')?.click()}
                disabled={uploadingFront}
              >
                Choose File
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Driver's License Back */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Driver's License (Back) *</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {backLicense ? (
            <div className="space-y-3">
              {uploadingBack ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                  <p className="text-sm text-blue-600 font-medium">Uploading license back...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgressBack}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600">{uploadProgressBack}% complete</p>
                </div>
              ) : (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              )}
              {!uploadingBack && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">{backLicense.name}</p>
                  <p className="text-xs text-gray-500">
                    {(backLicense.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-green-600 font-medium">✓ Uploaded successfully</p>
                </div>
              )}
              {!uploadingBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemoveBack}
                  icon={X}
                >
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Upload back of license
              </h4>
              <p className="text-gray-600 mb-4">
                JPG, PNG, or GIF format. Maximum 10MB.
              </p>
              <input
                type="file"
                id="license-back-input"
                accept="image/*"
                onChange={onBackSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('license-back-input')?.click()}
                disabled={uploadingBack}
              >
                Choose File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};