import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Download,
  CheckCircle,
  AlertTriangle,
  Monitor,
  HardDrive,
  Award,
  Lock,
  FileCheck
} from 'lucide-react';
import { detectOS, OSDetection } from '../services/api';



export const HomePage: React.FC = () => {
  const [osDetection, setOSDetection] = useState<OSDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    const detectUserOS = async () => {
      try {
        const detection = await detectOS();
        setOSDetection(detection);
      } catch (error) {
        console.error('Failed to detect OS:', error);
      } finally {
        setIsLoading(false);
      }
    };

    detectUserOS();
  }, []);

  const getOSIcon = (os: string) => {
    switch (os) {
      case 'windows':
        return <Monitor className="h-8 w-8" />;
      case 'linux':
        return <HardDrive className="h-8 w-8" />;
      case 'macos':
        return <HardDrive className="h-8 w-8" />;
      default:
        return <Monitor className="h-8 w-8" />;
    }
  };

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-primary-600" />,
      title: 'NIST SP 800-88 Compliant',
      description: 'Meets the highest standards for secure data sanitization as defined by NIST Special Publication 800-88 Revision 1.'
    },
    {
      icon: <Lock className="h-8 w-8 text-primary-600" />,
      title: 'Tamper-Proof Certificates',
      description: 'Digitally signed certificates with cloud KMS provide verifiable proof of secure data erasure.'
    },
    {
      icon: <FileCheck className="h-8 w-8 text-primary-600" />,
      title: 'Multiple Algorithms',
      description: 'Support for NIST, DoD 5220.22-M, Gutmann, and custom wiping algorithms with configurable passes.'
    },
    {
      icon: <Award className="h-8 w-8 text-primary-600" />,
      title: 'Cross-Platform',
      description: 'Available for Windows, Linux, and macOS with consistent security standards across all platforms.'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure Data Wiping
              <span className="block text-primary-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional-grade data erasure with NIST SP 800-88 compliance. 
              One-click secure wiping with tamper-proof certification for complete peace of mind.
            </p>

            {/* OS Detection and Download */}
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto mb-8">
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  <span className="text-gray-600">Detecting your system...</span>
                </div>
              ) : osDetection ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="text-primary-600">
                      {getOSIcon(osDetection.detectedOS)}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {osDetection.toolInfo?.displayName || 'Secure Wiper Tool'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Detected: {osDetection.detectedOS.charAt(0).toUpperCase() + osDetection.detectedOS.slice(1)}
                    {osDetection.toolInfo && (
                      <span className="block">
                        Version {osDetection.toolInfo.version} • {osDetection.toolInfo.size}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => setShowComingSoon(true)}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Now
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600 mb-4">Unable to detect your system</p>
                  <button
                    onClick={() => setShowComingSoon(true)}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Now
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/verify"
                className="inline-flex items-center px-6 py-3 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Verify Certificate
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose WipeOut?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for security professionals, compliance officers, and organizations 
              that require verifiable data destruction with the highest security standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Secure Your Data?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Download our secure wiping tool and get started with professional-grade 
              data erasure in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/download"
                className="inline-flex items-center px-8 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Tools
              </Link>
              <Link
                to="/verify"
                className="inline-flex items-center px-8 py-3 border border-white text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Verify Certificate
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <Download className="h-6 w-6 text-primary-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Coming Soon
              </h2>

              <p className="text-gray-600 mb-6">
                We're working on this. Check back soon to see what we've been building!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowComingSoon(false)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Got it
                </button>
                <Link
                  to="/download"
                  onClick={() => setShowComingSoon(false)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                >
                  View All Platforms
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
