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
                <div className="w-12 h-12 mx-auto flex flex-col items-center justify-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-xs font-bold text-blue-600">{uploadProgressFront}%</span>
                  </div>
                </div>
              ) : (
                <FileText className="w-12 h-12 text-green-600 mx-auto" />
              )}
              <p className="text-sm text-gray-600">{frontLicense.name}</p>
              {uploadingFront && (
                <div className="space-y-2">
                  <p className="text-sm text-blue-600">Uploading license front...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgressFront}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveFront}
                icon={X}
                disabled={uploadingFront}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                {uploadingFront ? 'Uploading...' : 'Upload front of license'}
              </p>
              {uploadingFront && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgressFront}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{uploadProgressFront}% uploaded</p>
                </div>
              )}
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
                {uploadingFront ? 'Uploading...' : 'Choose File'}
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
                <div className="w-12 h-12 mx-auto flex flex-col items-center justify-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-xs font-bold text-blue-600">{uploadProgressBack}%</span>
                  </div>
                </div>
              ) : (
                <FileText className="w-12 h-12 text-green-600 mx-auto" />
              )}
              <p className="text-sm text-gray-600">{backLicense.name}</p>
              {uploadingBack && (
                <div className="space-y-2">
                  <p className="text-sm text-blue-600">Uploading license back...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgressBack}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveBack}
                icon={X}
                disabled={uploadingBack}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                {uploadingBack ? 'Uploading...' : 'Upload back of license'}
              </p>
              {uploadingBack && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgressBack}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{uploadProgressBack}% uploaded</p>
                </div>
              )}
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
                {uploadingBack ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};