import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Search,
  FileText,
  Shield,
  Calendar,
  Clock,
  HardDrive,
  Key
} from 'lucide-react';
import { verifyCertificateById, verifyCertificateByFile, CertificateVerification } from '../services/api';

export const VerifyPage: React.FC = () => {
  const [verificationMethod, setVerificationMethod] = useState<'id' | 'file'>('id');
  const [certificateId, setCertificateId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a PDF file');
        setSelectedFile(null);
      }
    }
  };

  const handleVerifyById = async () => {
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const result = await verifyCertificateById(certificateId.trim());
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyByFile = async () => {
    if (!selectedFile) {
      setError('Please select a certificate file');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      // For file verification, we need the certificate ID from the user
      // In a real implementation, this might be extracted from the PDF
      const result = await verifyCertificateByFile(selectedFile, certificateId);
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (verificationMethod === 'id') {
      handleVerifyById();
    } else {
      handleVerifyByFile();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verify Certificate
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity and integrity of your secure data erasure certificate. 
            Our tamper-proof certificates use digital signatures to ensure validity.
          </p>
        </div>

        {/* Verification Method Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Choose Verification Method
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setVerificationMethod('id')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                verificationMethod === 'id'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Search className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">By Certificate ID</h3>
              <p className="text-sm text-gray-600 mt-1">
                Enter the certificate ID to verify online
              </p>
            </button>

            <button
              onClick={() => setVerificationMethod('file')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                verificationMethod === 'file'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Upload className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">By File Upload</h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload the PDF certificate file
              </p>
            </button>
          </div>

          {/* Certificate ID Input */}
          {verificationMethod === 'id' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="certificateId" className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate ID
                </label>
                <input
                  type="text"
                  id="certificateId"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Enter certificate ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          {verificationMethod === 'file' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="certificateFile" className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="certificateFile"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="certificateFile" className="cursor-pointer">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to select PDF certificate file'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PDF files only, max 10MB
                    </p>
                  </label>
                </div>
              </div>

              {verificationMethod === 'file' && (
                <div>
                  <label htmlFor="fileVerificationId" className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate ID (Optional)
                  </label>
                  <input
                    type="text"
                    id="fileVerificationId"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="Enter certificate ID if known"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Providing the certificate ID helps with verification
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Verify Button */}
          <div className="mt-6">
            <button
              onClick={handleVerify}
              disabled={isVerifying || (verificationMethod === 'id' && !certificateId.trim()) || (verificationMethod === 'file' && !selectedFile)}
              className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Verify Certificate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              {verificationResult.valid ? (
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {verificationResult.valid ? 'Certificate Valid' : 'Certificate Invalid'}
                </h2>
                <p className="text-gray-600">
                  {verificationResult.valid 
                    ? 'This certificate is authentic and has not been tampered with'
                    : 'This certificate could not be verified or has been tampered with'
                  }
                </p>
              </div>
            </div>

            {verificationResult.valid && verificationResult.wipeDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Certificate Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Certificate Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Key className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Certificate ID</p>
                        <p className="font-mono text-sm">{verificationResult.certificateId}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Issued</p>
                        <p className="text-sm">{formatDate(verificationResult.timestamp || '')}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Verified</p>
                        <p className="text-sm">{formatDate(verificationResult.verifiedAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Issuer</p>
                        <p className="text-sm">{verificationResult.issuer}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wipe Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Wipe Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <HardDrive className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Device ID</p>
                        <p className="text-sm font-mono">{verificationResult.wipeDetails.deviceId}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Algorithm</p>
                        <p className="text-sm uppercase">{verificationResult.wipeDetails.algorithm}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="h-5 w-5 text-gray-400 mr-3 flex items-center justify-center">
                        <span className="text-xs font-bold">#</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Passes</p>
                        <p className="text-sm">{verificationResult.wipeDetails.passes}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="text-sm">{verificationResult.wipeDetails.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verificationResult.wipeDetails.status === 'success' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {verificationResult.wipeDetails.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How Certificate Verification Works
          </h3>
          <div className="space-y-2 text-blue-800">
            <p>• Each certificate is digitally signed using cloud-based Key Management Service (KMS)</p>
            <p>• Signatures are cryptographically verified against our public key</p>
            <p>• Data integrity is checked using SHA-256 hashing</p>
            <p>• Tampered certificates will fail verification</p>
            <p>• All verification attempts are logged for audit purposes</p>
          </div>
        </div>
      </div>
    </div>
  );
};
