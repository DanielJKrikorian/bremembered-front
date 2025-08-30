import React from 'react';

interface PackageUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onUpgradeSuccess: () => void;
}

export const PackageUpgradeModal: React.FC<PackageUpgradeModalProps> = ({
  isOpen,
  onClose,
  booking,
  onUpgradeSuccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Package Upgrade</h3>
        <p className="text-gray-600 mb-4">Package upgrade functionality coming soon.</p>
        <button
          onClick={onClose}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};