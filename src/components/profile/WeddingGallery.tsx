import React, { useState } from 'react';
import { useWeddingGallery } from '../../hooks/useWeddingGallery';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Camera, Download, Share2, Lock } from 'lucide-react';
import { StripePaymentModal } from '../../components/payment/StripePaymentModal';
import { differenceInDays, addDays } from 'date-fns';

export const WeddingGallery: React.FC = () => {
  const {
    files,
    folders,
    currentFolder,
    setCurrentFolder,
    currentFolderFiles,
    photoFiles,
    videoFiles,
    subscription,
    hasSubscription,
    freeAccessActive,
    loading: galleryLoading,
    error,
    downloadFile,
    downloadAllFiles,
    downloadingAll,
    formatFileSize,
  } = useWeddingGallery();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const getFreeAccessMessage = () => {
    if (freeAccessActive && files.length > 0) {
      const earliestUpload = files.reduce((earliest, file) => {
        const uploadDate = new Date(file.upload_date);
        return uploadDate < new Date(earliest) ? file.upload_date : earliest;
      }, files[0].upload_date);
      const freePeriodEnd = addDays(new Date(earliestUpload), 15);
      const daysLeft = differenceInDays(freePeriodEnd, new Date());
      return `${daysLeft} days left in your free access period`;
    } else if (freeAccessActive) {
      return '15 days left in your free access period (no files uploaded yet)';
    }
    return 'Your 15-day free access has expired. Subscribe to continue accessing your gallery.';
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Wedding Gallery</h3>
            <p className="text-gray-600 mt-1">Your photos and videos from vendors</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              icon={Download}
              onClick={() => {
                if (!freeAccessActive && !hasSubscription) {
                  setShowPaymentModal(true);
                  return;
                }
                downloadAllFiles();
              }}
              disabled={files.length === 0 || downloadingAll}
              loading={downloadingAll}
            >
              {currentFolder ? `Download All (${currentFolderFiles.length})` : 'Download All'}
            </Button>
            <Button variant="outline" icon={Share2}>Share Gallery</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{files.length}</div>
            <div className="text-blue-800 text-sm">Total Files</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-600">{photoFiles.length}</div>
            <div className="text-emerald-800 text-sm">Photos</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{videoFiles.length}</div>
            <div className="text-purple-800 text-sm">Videos</div>
          </div>
        </div>
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {!freeAccessActive && !hasSubscription ? (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900">Gallery Access Expired</h4>
                <p className="text-red-700 text-sm">{getFreeAccessMessage()}</p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowPaymentModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Subscribe Now
              </Button>
            </div>
          </div>
        ) : freeAccessActive && !hasSubscription ? (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-amber-900">Free Access Period</h4>
                <p className="text-amber-700 text-sm">{getFreeAccessMessage()}</p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowPaymentModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Secure Access
              </Button>
            </div>
          </div>
        ) : subscription && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">Active Subscription</h4>
                <p className="text-green-700 text-sm">You have full access to your gallery.</p>
              </div>
            </div>
          </div>
        )}
      </Card>
      {currentFolder && (freeAccessActive || hasSubscription) ? (
        <>
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setCurrentFolder(null)}
              className="flex items-center space-x-2"
            >
              <span>← Back to Folders</span>
            </Button>
          </div>
          {currentFolderFiles.length === 0 ? (
            <Card className="p-12 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files in this folder</h3>
              <p className="text-gray-600 mb-6">
                This folder appears to be empty or files are still being uploaded.
              </p>
              <Button
                variant="outline"
                onClick={() => setCurrentFolder(null)}
              >
                Back to Folders
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentFolderFiles.map((file) => (
                <Card key={file.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {file.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={file.public_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Video File</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 truncate">{file.file_name}</h4>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                    </div>
                    {file.vendors && (
                      <p className="text-xs text-gray-500 mt-1">By {file.vendors.name}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        if (!freeAccessActive && !hasSubscription) {
                          setShowPaymentModal(true);
                          return;
                        }
                        downloadFile(file);
                      }}
                      icon={Download}
                    >
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Browse by Folder</h4>
            <p className="text-gray-600">{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
          </div>
          {galleryLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your gallery...</p>
            </div>
          ) : folders.length === 0 ? (
            <Card className="p-12 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
              <p className="text-gray-600 mb-6">
                Your vendors will upload photos and videos here after your events.
              </p>
            </Card>
          ) : currentFolder && !freeAccessActive && !hasSubscription ? (
            <Card className="p-12 text-center">
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden mb-4">
                {folders.find(f => f.path === currentFolder)?.previewImage ? (
                  <img
                    src={folders.find(f => f.path === currentFolder)?.previewImage}
                    alt={folders.find(f => f.path === currentFolder)?.name}
                    className="w-full h-full object-cover opacity-50"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Folder</p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {folders.find(f => f.path === currentFolder)?.fileCount || 0} files
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {folders.find(f => f.path === currentFolder)?.name || 'Folder'} - Access Restricted
              </h3>
              <p className="text-gray-600 mb-6">
                Your 15-day free access has expired. Subscribe to view the contents of this folder.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowPaymentModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Subscribe Now
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentFolder(null)}
                className="mt-4"
              >
                Back to Folders
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folders.map((folder) => (
                <div
                  key={folder.path}
                  onClick={() => {
                    if (!freeAccessActive && !hasSubscription) {
                      setCurrentFolder(folder.path);
                      setShowPaymentModal(true);
                      return;
                    }
                    setCurrentFolder(folder.path);
                  }}
                  className="cursor-pointer"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {folder.previewImage ? (
                        <img
                          src={folder.previewImage}
                          alt={folder.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Folder</p>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {folder.fileCount} files
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 truncate mb-2">{folder.name}</h4>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>{formatFileSize(folder.totalSize)}</span>
                        <span>{new Date(folder.lastModified).toLocaleDateString()}</span>
                      </div>
                      {folder.vendor && (
                        <div className="flex items-center space-x-2">
                          {folder.vendor.profile_photo ? (
                            <img
                              src={folder.vendor.profile_photo}
                              alt={folder.vendor.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <Camera className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                          <p className="text-xs text-gray-500 truncate">
                            By {folder.vendor.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          window.location.reload();
        }}
        planId="Couple_Capsule"
        planName="Wedding Gallery"
        amount={499}
      />
    </div>
  );
};