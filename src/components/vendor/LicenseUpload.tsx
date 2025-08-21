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
}

export const LicenseUpload: React.FC<LicenseUploadProps> = ({
  frontLicense,
  backLicense,
  onFrontSelect,
  onBackSelect,
  onRemoveFront,
  onRemoveBack
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Driver's License Front */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Driver's License (Front) *</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {frontLicense ? (
            <div className="space-y-3">
              <FileText className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-sm text-gray-600">{frontLicense.name}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveFront}
                icon={X}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">Upload front of license</p>
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
              <FileText className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-sm text-gray-600">{backLicense.name}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveBack}
                icon={X}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">Upload back of license</p>
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