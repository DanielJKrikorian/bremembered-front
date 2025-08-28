import React, { useState } from 'react';
import { Camera, Video, Download, Eye, Folder, Calendar, User, Lock, Crown, AlertCircle, Play, Image, FileText, Clock, Shield, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useWeddingGallery } from '../../hooks/useWeddingGallery';
import { StripePaymentModal } from '../payment/StripePaymentModal';

export const WeddingGallery: React.FC = () => {
  const {
    files,
    folders,
    currentFolder,
    setCurrentFolder,
    currentFolderFiles,
    photoFiles,
    videoFiles,
    currentFolderPhotoFiles,
    currentFolderVideoFiles,
    subscription,
    loading,
    error,
    downloadingAll,
    downloadFile,
    downloadAllFiles,
    isAccessExpired,
    getDaysUntilExpiry,
    getFileType,
    formatFileSize
  } = useWeddingGallery();

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleFolderClick = (folder: any) => {
    if (isAccessExpired()) {
      setShowSubscriptionModal(true);
      return;
    }
    setCurrentFolder(folder.path);
  };

  const handleFileClick = (file: any) => {
    if (isAccessExpired()) {
      setShowSubscriptionModal(true);
      return;
    }
    setSelectedFile(file);
  };

  const handleDownloadClick = async (file: any) => {
    if (isAccessExpired()) {
      setShowSubscriptionModal(true);
      return;
    }
    
    try {
      await downloadFile(file);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadAllClick = async () => {
    if (isAccessExpired()) {
      setShowSubscriptionModal(true);
      return;
    }
    
    try {
      await downloadAllFiles();
    } catch (error) {
      console.error('Download all failed:', error);
    }
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    // Refresh the page to update subscription status
    window.location.reload();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wedding gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Gallery</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wedding Gallery</h3>
            <p className="text-gray-600">
              Your photos and videos from vendors
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Storage Status */}
            <div className="text-right">
              <div className="text-2xl font-bold text-rose-500">{files.length}</div>
              <div className="text-sm text-gray-600">Files</div>
            </div>
            {files.length > 0 && !isAccessExpired() && (
              <Button
                variant="primary"
                icon={Download}
                onClick={handleDownloadAllClick}
                loading={downloadingAll}
                disabled={downloadingAll}
              >
                Download All
              </Button>
            )}
          </div>
        </div>

        {/* Access Status */}
        {isAccessExpired() ? (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-900">Gallery Access Expired</h4>
                  <p className="text-red-700 text-sm">
                    Your free access period has ended. Subscribe to continue viewing and downloading your photos.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                icon={Crown}
                onClick={() => setShowSubscriptionModal(true)}
              >
                Subscribe Now
              </Button>
            </div>
          </div>
        ) : subscription?.free_period_expiry && getDaysUntilExpiry() <= 7 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-amber-600" />
                <div>
                  <h4 className="font-medium text-amber-900">Free Access Ending Soon</h4>
                  <p className="text-amber-700 text-sm">
                    Your free access expires in {getDaysUntilExpiry()} day{getDaysUntilExpiry() !== 1 ? 's' : ''}. 
                    Subscribe to keep your memories forever.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                icon={Crown}
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Subscribe
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      {currentFolder && (
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentFolder(null)}
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              All Files
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">
              {folders.find(f => f.path === currentFolder)?.name || currentFolder}
            </span>
          </div>
        </Card>
      )}

      {/* Gallery Content */}
      {isAccessExpired() ? (
        /* Subscription Required */
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Required</h3>
          <p className="text-gray-600 mb-6">
            Subscribe to access your wedding photos and videos. Your memories are safely stored and waiting for you.
          </p>
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h4 className="font-semibold text-rose-900 mb-3">What you'll get:</h4>
            <ul className="text-sm text-rose-800 space-y-2 text-left">
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-rose-600" />
                Unlimited access to all your photos & videos
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-rose-600" />
                HD streaming and full-resolution downloads
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-rose-600" />
                Secure cloud storage forever
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-rose-600" />
                Share with family and friends
              </li>
            </ul>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={Crown}
            onClick={() => setShowSubscriptionModal(true)}
            className="px-8"
          >
            Subscribe for $4.99/month
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Cancel anytime. Your photos are always safe with us.
          </p>
        </Card>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos or videos yet</h3>
          <p className="text-gray-600 mb-6">
            Your vendors will upload photos and videos here after your event
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="font-semibold text-blue-900 mb-2">What to expect:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Photos typically arrive within 2-4 weeks</li>
              <li>• Videos may take 4-8 weeks for editing</li>
              <li>• You'll get email notifications when files are uploaded</li>
              <li>• Free access for 30 days after first upload</li>
            </ul>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Folder View */}
          {!currentFolder && folders.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Folders by Vendor</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <Card 
                    key={folder.path} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={folder.previewImage || 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={folder.name}
                        className="w-full h-full object-cover"
                      />
                      {isAccessExpired() && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Lock className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Subscription Required</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <div className="bg-black/70 text-white px-2 py-1 rounded text-sm">
                          {folder.fileCount} files
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <Folder className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                      </div>
                      {folder.vendor && (
                        <div className="flex items-center space-x-2 mb-2">
                          {folder.vendor.profile_photo ? (
                            <img
                              src={folder.vendor.profile_photo}
                              alt={folder.vendor.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm text-gray-600">{folder.vendor.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{formatFileSize(folder.totalSize)}</span>
                        <span>{formatDate(folder.lastModified)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* File Grid/List View */}
          {(currentFolder || folders.length === 0) && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  {currentFolder 
                    ? `${folders.find(f => f.path === currentFolder)?.name || 'Folder'} (${currentFolderFiles.length} files)`
                    : `All Files (${files.length})`
                  }
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {currentFolderFiles.length === 0 ? (
                <Card className="p-8 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No files in this folder</h4>
                  <p className="text-gray-600">Files will appear here when your vendors upload them</p>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentFolderFiles.map((file) => {
                    const fileType = getFileType(file.file_name);
                    
                    return (
                      <Card 
                        key={file.id} 
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="aspect-square relative">
                          {fileType === 'image' ? (
                            <img
                              src={file.public_url}
                              alt={file.file_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : fileType === 'video' ? (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                              <video
                                src={file.public_url}
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          
                          {isAccessExpired() && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Lock className="w-6 h-6 mx-auto mb-1" />
                                <p className="text-xs font-medium">Subscribe to View</p>
                              </div>
                            </div>
                          )}

                          <div className="absolute top-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadClick(file);
                              }}
                              className="p-1.5 bg-black/70 text-white rounded-full hover:bg-black/80 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-gray-900 text-sm truncate mb-1">
                            {file.file_name}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{formatDate(file.upload_date)}</span>
                          </div>
                          {file.vendors && (
                            <div className="flex items-center space-x-1 mt-2">
                              {file.vendors.profile_photo ? (
                                <img
                                  src={file.vendors.profile_photo}
                                  alt={file.vendors.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-2 h-2 text-gray-400" />
                                </div>
                              )}
                              <span className="text-xs text-gray-600 truncate">
                                {file.vendors.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3">
                  {currentFolderFiles.map((file) => {
                    const fileType = getFileType(file.file_name);
                    
                    return (
                      <Card 
                        key={file.id} 
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {fileType === 'image' ? (
                              <img
                                src={file.public_url}
                                alt={file.file_name}
                                className="w-full h-full object-cover"
                              />
                            ) : fileType === 'video' ? (
                              <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                                <video
                                  src={file.public_url}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Play className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            
                            {isAccessExpired() && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Lock className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate mb-1">
                              {file.file_name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{formatFileSize(file.file_size)}</span>
                              <span>{formatDate(file.upload_date)}</span>
                              {file.vendors && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{file.vendors.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Download}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadClick(file);
                            }}
                          >
                            Download
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {currentFolder ? currentFolderPhotoFiles.length : photoFiles.length}
              </div>
              <div className="text-sm text-gray-600">Photos</div>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {currentFolder ? currentFolderVideoFiles.length : videoFiles.length}
              </div>
              <div className="text-sm text-gray-600">Videos</div>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Folder className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mb-1">{folders.length}</div>
              <div className="text-sm text-gray-600">Vendors</div>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600 mb-1">
                {isAccessExpired() ? 'Expired' : getDaysUntilExpiry()}
              </div>
              <div className="text-sm text-gray-600">
                {isAccessExpired() ? 'Access' : 'Days Left'}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {selectedFile && !isAccessExpired() && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {getFileType(selectedFile.file_name) === 'image' ? (
              <img
                src={selectedFile.public_url}
                alt={selectedFile.file_name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={selectedFile.public_url}
                controls
                className="max-w-full max-h-full"
                autoPlay
              />
            )}
            
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
              <h4 className="font-medium mb-2">{selectedFile.file_name}</h4>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span>{formatFileSize(selectedFile.file_size)}</span>
                  <span>{formatDate(selectedFile.upload_date)}</span>
                  {selectedFile.vendors && (
                    <span>by {selectedFile.vendors.name}</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={() => handleDownloadClick(selectedFile)}
                  className="border-white text-white hover:bg-white hover:text-gray-900"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <StripePaymentModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSuccess={handleSubscriptionSuccess}
        planId="Couple_Capsule"
        planName="Wedding Gallery"
        amount={499}
      />
    </div>
  );
};