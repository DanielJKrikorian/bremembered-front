// src/components/checkout/CheckoutContracts.tsx
import React, { useEffect, useState } from 'react';
import { FileText, Check, Edit, ArrowRight, Download, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCheckout } from './CheckoutContext';
import { supabase } from '../../lib/supabase';

interface ContractTemplate {
  id: string;
  content: string;
  service_type: string;
}

export const CheckoutContracts: React.FC<{ cartItems: any[]; onNext: () => void }> = ({ cartItems, onNext }) => {
  const { 
    signatures, 
    tempSignatures, 
    setTempSignature, 
    confirmSignature, 
    error, 
    setError,
    formData,
    setCurrentStep
  } = useCheckout();

  const [contracts, setContracts] = useState<{ template: ContractTemplate; packageId: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);

      try {
        const packageIds = cartItems.map(item => item.package.id);
        if (!packageIds.length) {
          setContracts([]);
          setLoading(false);
          return;
        }

        const { data: packages, error: pkgError } = await supabase
          .from('service_packages')
          .select('id, contract_template_id, service_type')
          .in('id', packageIds);

        if (pkgError || !packages) throw pkgError;

        const templateIds = packages
          .map(p => p.contract_template_id)
          .filter(id => id);

        if (!templateIds.length) {
          setError('No contract templates linked to selected packages.');
          setContracts([]);
          setLoading(false);
          return;
        }

        const { data: templates, error: tmplError } = await supabase
          .from('contract_templates')
          .select('id, content, service_type')
          .in('id', templateIds);

        if (tmplError || !templates) throw tmplError;

        const matched = packages.map(pkg => {
          const tmpl = templates.find(t => t.id === pkg.contract_template_id);
          return tmpl ? { template: tmpl, packageId: pkg.id } : null;
        }).filter(Boolean) as { template: ContractTemplate; packageId: string }[];

        setContracts(matched);
      } catch (err) {
        console.error('Contract fetch error:', err);
        setError('Failed to load contracts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [cartItems]);

  const allSigned = contracts.every(c => signatures[c.template.service_type]?.trim());

  const handleNext = () => {
    if (allSigned) {
      setError(null);
      onNext();
    } else {
      setError('Please sign all contracts before proceeding');
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const generatePDF = async (template: ContractTemplate, item: any, signature: string) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const content = template.content
      .replace('{{client_name}}', formData.partner1Name + (formData.partner2Name ? ` & ${formData.partner2Name}` : ''))
      .replace('{{vendor_name}}', item?.vendor.name || 'Vendor')
      .replace('{{package_name}}', item?.package.name || 'Service')
      .replace('{{event_date}}', item?.eventDate || 'N/A')
      .replace('{{event_time}}', `${item?.eventTime || ''} to ${item?.endTime || ''}`)
      .replace('{{venue}}', item?.venue?.name || 'N/A')
      .replace('{{price}}', `$${(item?.package.price / 100).toFixed(2)}`);

    const lines = doc.splitTextToSize(content, 190);
    doc.setFontSize(12);
    doc.text(lines, 10, 10);

    doc.setFontSize(10);
    const y = doc.lastAutoTable?.finalY || 10 + lines.length * 5;
    doc.text(`Signed by: ${signature}`, 10, y + 10);
    doc.text(`Date: ${new Date().toLocaleString()}`, 10, y + 20);

    doc.save(`${item?.package.name.replace(/\s+/g, '_')}_Contract.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* WHITE BOX */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Service Contracts</h3>
        </div>

        <p className="text-gray-600 mb-6">
          Please review and sign the contracts for each service before proceeding to payment.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No contracts available for selected services.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {contracts.map(({ template, packageId }) => {
              const serviceType = template.service_type;
              const isSigned = signatures[serviceType]?.trim();
              const item = cartItems.find(i => i.package.id === packageId);

              return (
                <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 ${isSigned ? 'bg-green-50 border-b border-green-200' : 'bg-gray-50 border-b border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{serviceType} Service Agreement</h4>
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${isSigned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {isSigned ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Signed</span>
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4" />
                            <span>Signature Required</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                      <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {template.content
                          .replace('{{client_name}}', formData.partner1Name + (formData.partner2Name ? ` & ${formData.partner2Name}` : ''))
                          .replace('{{vendor_name}}', item?.vendor.name || 'Vendor')
                          .replace('{{package_name}}', item?.package.name || 'Service')
                          .replace('{{event_date}}', item?.eventDate || 'N/A')
                          .replace('{{event_time}}', `${item?.eventTime || ''} to ${item?.endTime || ''}`)
                          .replace('{{venue}}', item?.venue?.name || 'N/A')
                          .replace('{{price}}', `$${(item?.package.price / 100).toFixed(2)}`)
                        }
                      </div>
                    </div>

                    {!isSigned ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature</label>
                        <input
                          type="text"
                          placeholder="Type your full legal name to sign"
                          value={tempSignatures[serviceType] || ''}
                          onChange={(e) => setTempSignature(serviceType, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          By typing your name, you agree to be legally bound by this contract
                        </p>
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => confirmSignature(serviceType)}
                            disabled={!tempSignatures[serviceType]?.trim()}
                          >
                            Confirm Signature
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center space-x-2 text-green-800">
                            <Check className="w-4 h-4" />
                            <span className="font-medium">Signed by: {signatures[serviceType]}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => generatePDF(template, item, signatures[serviceType])}
                        >
                          Download PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* BUTTON ROW — SAME SIZE, PERFECTLY ALIGNED */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={handleBack}
          className="min-w-[180px] border-red-500 text-red-500 bg-white hover:bg-red-50 hover:border-red-600 hover:text-red-600 px-6 py-3 text-base font-medium"
        >
          Back to Details
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          icon={ArrowRight}
          disabled={!allSigned}
          className={`min-w-[180px] px-6 py-3 text-base font-medium ${
            !allSigned 
              ? 'opacity-50 cursor-not-allowed bg-gray-400' 
              : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};