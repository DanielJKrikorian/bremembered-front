import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useCouple } from '../../hooks/useCouple';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FileText, Eye, Download, CheckCircle, AlertCircle, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { parse, format, isValid } from 'date-fns';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  onDownload: (contract: any) => void;
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, contract, onDownload }) => {
  const safeFormatDate = (dateString: string | null | undefined, formatString: string = 'PPPP'): string => {
    if (!dateString) return 'Not set';
    try {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (!isValid(parsedDate)) return 'Invalid date';
      return format(parsedDate, formatString);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  if (!isOpen || !contract) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {contract.bookings?.service_packages?.name || contract.bookings?.service_type}
        </h3>
        <p className="text-gray-600 mb-4">Contract with {contract.bookings?.vendors?.name}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <span className="text-gray-600">Contract ID:</span>
            <div className="font-medium">{contract.id.substring(0, 8).toUpperCase()}</div>
          </div>
          <div>
            <span className="text-gray-600">Service Type:</span>
            <div className="font-medium">{contract.bookings?.service_type}</div>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <div className="font-medium">{safeFormatDate(contract.created_at)}</div>
          </div>
          {contract.signed_at && (
            <>
              <div>
                <span className="text-gray-600">Signed By:</span>
                <div className="font-medium">{contract.signature}</div>
              </div>
              <div>
                <span className="text-gray-600">Signed On:</span>
                <div className="font-medium">{safeFormatDate(contract.signed_at)}</div>
              </div>
            </>
          )}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Contract Content</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {contract.content}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {contract.signature && (
            <Button
              variant="primary"
              icon={Download}
              onClick={() => onDownload(contract)}
            >
              Download PDF
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export const ContractsSection: React.FC = () => {
  const { couple } = useCouple();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!couple?.id) {
        setContractsLoading(false);
        return;
      }
      if (!supabase || !isSupabaseConfigured()) {
        setContracts([]);
        setContractsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            *,
            bookings!inner(
              id,
              service_type,
              vendors!inner(
                name
              ),
              service_packages(
                name
              )
            )
          `)
          .eq('bookings.couple_id', couple.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setContracts(data || []);
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setContracts([]);
      } finally {
        setContractsLoading(false);
      }
    };
    if (couple?.id) fetchContracts();
  }, [couple]);

  const safeFormatDate = (dateString: string | null | undefined, formatString: string = 'PPPP'): string => {
    if (!dateString) return 'Not set';
    try {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (!isValid(parsedDate)) return 'Invalid date';
      return format(parsedDate, formatString);
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const handleDownloadContract = (contract: any) => {
    if (!contract || !contract.bookings) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const logoUrl = 'https://eecbrvehrhrvdzuutliq.supabase.co/storage/v1/object/public/public-1/B_Logo.png';
      const logoSize = 30;
      doc.addImage(logoUrl, 'PNG', 90, 10, logoSize, logoSize, undefined, 'FAST');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SERVICE CONTRACT', 105, 50, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('B. Remembered', 105, 60, { align: 'center' });
      doc.text('The Smarter Way to Book Your Big Day!', 105, 67, { align: 'center' });
      let yPos = 80;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRACT DETAILS', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Contract ID: ${contract.id.substring(0, 8).toUpperCase()}`, 20, yPos);
      yPos += 7;
      doc.text(`Service: ${contract.bookings.service_packages?.name || contract.bookings.service_type}`, 20, yPos);
      yPos += 7;
      doc.text(`Vendor: ${contract.bookings.vendors.name}`, 20, yPos);
      yPos += 7;
      doc.text(`Created: ${safeFormatDate(contract.created_at)}`, 20, yPos);
      yPos += 7;
      if (contract.signed_at) {
        doc.text(`Signed: ${safeFormatDate(contract.signed_at)}`, 20, yPos);
        yPos += 7;
      }
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRACT TERMS', 20, yPos);
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = contract.content.split('\n');
      lines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        if (line.trim() === '') {
          yPos += 4;
          return;
        }
        if (line.includes(':') && line.length < 50) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        const wrappedLines = doc.splitTextToSize(line, 170);
        doc.text(wrappedLines, 20, yPos);
        yPos += 5 * wrappedLines.length;
      });
      if (contract.signature) {
        yPos += 20;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('DIGITAL SIGNATURE', 20, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Signed by: ${contract.signature}`, 20, yPos);
        yPos += 6;
        doc.text(`Date: ${safeFormatDate(contract.signed_at)}`, 20, yPos);
      }
      yPos = Math.max(yPos + 20, 260);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Thank you for choosing B. Remembered for your special day!', 105, yPos, { align: 'center' });
      doc.text('For questions about this contract, contact hello@bremembered.io', 105, yPos + 7, { align: 'center' });
      const fileName = `Contract_${contract.bookings.vendors.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating contract PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Contracts</h3>
            <p className="text-gray-600">
              View and download your signed service contracts
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-rose-500">{contracts.length}</div>
            <div className="text-sm text-gray-600">Total Contracts</div>
          </div>
        </div>
      </Card>
      {contractsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your contracts...</p>
          </div>
        </div>
      ) : contracts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No contracts yet</h3>
          <p className="text-gray-600 mb-6">
            Contracts will appear here once you complete bookings with vendors
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/search')}
          >
            Browse Services
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {contract.bookings?.service_packages?.name || contract.bookings?.service_type}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      contract.signature
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {contract.signature ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Signed
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending Signature
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">
                    Contract with {contract.bookings?.vendors?.name}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Service Type:</span>
                      <div className="font-medium">{contract.bookings?.service_type}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <div className="font-medium">{safeFormatDate(contract.created_at)}</div>
                    </div>
                    {contract.signed_at && (
                      <>
                        <div>
                          <span className="text-gray-600">Signed By:</span>
                          <div className="font-medium">{contract.signature}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Signed On:</span>
                          <div className="font-medium">{safeFormatDate(contract.signed_at)}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-gray-900 mb-2">Contract Preview</h5>
                <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                  {contract.content.split('\n').slice(0, 6).map((line: string, index: number) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                  {contract.content.split('\n').length > 6 && (
                    <p className="text-gray-500 italic">... (view full contract)</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Eye}
                  onClick={() => setSelectedContract(contract)}
                >
                  View Full Contract
                </Button>
                {contract.signature && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => handleDownloadContract(contract)}
                  >
                    Download PDF
                  </Button>
                )}
                {!contract.signature && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/booking/${contract.booking_id}?tab=contract`)}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    Sign Contract
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <ContractModal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        contract={selectedContract}
        onDownload={handleDownloadContract}
      />
    </div>
  );
};