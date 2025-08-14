import React, { useState } from 'react';
import { Download, Eye, Calendar, User, Clock, AlertCircle, CreditCard, Shield, Check, Play, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useWeddingGallery } from '../../hooks/useWeddingGallery';
import { StripePaymentModal } from '../payment/StripePaymentModal';

export const WeddingGalleryTab: React.FC = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const {
    files,
    photoFiles,
    videoFiles,
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

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    // Refresh the page or refetch data
    window.location.reload();
  };

  const handleFileClick = (file: any) => {
    if (isAccessExpired()) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    setSelectedFile(file);
    if (getFileType(file.file_name) === 'image') {
      setShowImageModal(true);
    } else {
      downloadFile(file);
    }
  };

  const handleDownloadAll = async () => {
    if (isAccessExpired()) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    try {
      await downloadAllFiles();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your wedding gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Gallery</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Card>
    );
  }

  const accessExpired = isAccessExpired();
  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="space-y-6">
      {/* Gallery Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wedding Gallery</h2>
          <p className="text-gray-600">
            {files.length > 0 
              ? `${photoFiles.length} photos and ${videoFiles.length} videos from your vendors`
              : 'Your wedding photos and videos will appear here'
            }
          </p>
        </div>
        {files.length > 0 && !accessExpired && (
          <Button
            variant="primary"
            icon={Download}
            onClick={handleDownloadAll}
            loading={downloadingAll}
            disabled={downloadingAll}
          >
            {downloadingAll ? 'Downloading...' : 'Download All'}
          </Button>
        )}
      </div>

      {/* Access Status */}
      {subscription && (
        <Card className={`p-4 ${accessExpired ? 'bg-red-50 border-red-200' : daysUntilExpiry <= 7 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                accessExpired ? 'bg-red-100' : daysUntilExpiry <= 7 ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                {accessExpired ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : daysUntilExpiry <= 7 ? (
                  <Clock className="w-4 h-4 text-yellow-600" />
                ) : (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  accessExpired ? 'text-red-900' : daysUntilExpiry <= 7 ? 'text-yellow-900' : 'text-green-900'
                }`}>
                  {accessExpired 
                    ? 'Gallery Access Expired' 
                    : daysUntilExpiry <= 7 
                      ? `${daysUntilExpiry} days remaining` 
                      : 'Gallery Access Active'
                  }
                </p>
                <p className={`text-sm ${
                  accessExpired ? 'text-red-700' : daysUntilExpiry <= 7 ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  {accessExpired 
                    ? 'Subscribe to access your wedding photos and videos'
                    : subscription.payment_status === 'active' 
                      ? 'Your subscription is active'
                      : `Free access expires ${subscription.free_period_expiry ? new Date(subscription.free_period_expiry).toLocaleDateString() : 'soon'}`
                  }
                </p>
              </div>
            </div>
            {(accessExpired || daysUntilExpiry <= 7) && (
              <Button
                variant="primary"
                size="sm"
                icon={CreditCard}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                {accessExpired ? 'Subscribe Now' : 'Extend Access'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Gallery Content */}
      {files.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Photos or Videos Yet</h3>
          <p className="text-gray-600 mb-6">
            Your wedding photos and videos from vendors will appear here after your event.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/search'}>
            Book Wedding Services
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Photos Section */}
          {photoFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Photos ({photoFiles.length})
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photoFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group cursor-pointer"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={file.file_path}
                        alt={file.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {accessExpired && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <CreditCard className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-xs">Subscribe to view</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black/70 text-white text-xs p-2 rounded">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <p className="text-gray-300">
                          {file.vendors?.name} • {formatFileSize(file.file_size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {videoFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Videos ({videoFiles.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden group cursor-pointer" onClick={() => handleFileClick(file)}>
                    <div className="aspect-video bg-gray-200 relative">
                      <video
                        src={file.file_path}
                        className="w-full h-full object-cover"
                        poster={file.file_path}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-gray-900 ml-1" />
                        </div>
                      </div>
                      {accessExpired && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <div className="text-white text-center">
                            <CreditCard className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Subscribe to view</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">{file.file_name}</h4>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{file.vendors?.name}</span>
                        <span>{formatFileSize(file.file_size)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* File List */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Files</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {files.map((file) => {
                const fileType = getFileType(file.file_name);
                const FileIcon = fileType === 'image' ? ImageIcon : fileType === 'video' ? Video : FileText;
                
                return (
                  <div key={file.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{file.file_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{file.vendors?.name}</span>
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>{new Date(file.upload_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleFileClick(file)}
                          disabled={accessExpired}
                        >
                          {fileType === 'image' ? 'View' : 'Play'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => downloadFile(file)}
                          disabled={accessExpired}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      <StripePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        planId="Couple_Capsule"
        planName="Wedding Gallery Access"
        amount={999} // $9.99 in cents
      />

      {/* Image Modal */}
      {showImageModal && selectedFile && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedFile.file_path}
              alt={selectedFile.file_name}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/70 text-white p-3 rounded-lg">
                <h4 className="font-medium">{selectedFile.file_name}</h4>
                <p className="text-sm text-gray-300">{selectedFile.vendors?.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-black/70 border-white/30 text-white hover:bg-black/90"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(false);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};