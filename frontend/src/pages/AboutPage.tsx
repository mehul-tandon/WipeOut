import React from 'react';
import { 
  Shield, 
  Award, 
  Lock, 
  FileCheck, 
  Users, 
  Globe,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <Shield className="h-8 w-8 text-primary-600" />,
      title: 'NIST SP 800-88 Compliance',
      description: 'Fully compliant with NIST Special Publication 800-88 Revision 1 guidelines for media sanitization, ensuring the highest standards of data destruction.'
    },
    {
      icon: <Lock className="h-8 w-8 text-primary-600" />,
      title: 'Tamper-Proof Certificates',
      description: 'Digital certificates signed with cloud KMS provide cryptographic proof of data erasure that cannot be forged or tampered with.'
    },
    {
      icon: <FileCheck className="h-8 w-8 text-primary-600" />,
      title: 'Multiple Algorithms',
      description: 'Support for industry-standard wiping algorithms including NIST Clear/Purge, DoD 5220.22-M, Gutmann 35-pass, and custom patterns.'
    },
    {
      icon: <Globe className="h-8 w-8 text-primary-600" />,
      title: 'Cross-Platform Support',
      description: 'Available for Windows, Linux, and macOS platforms with consistent security standards and user experience across all systems.'
    }
  ];

  const standards = [
    {
      name: 'NIST SP 800-88 Rev. 1',
      description: 'Guidelines for Media Sanitization',
      link: 'https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final'
    },
    {
      name: 'DoD 5220.22-M',
      description: 'National Industrial Security Program Operating Manual',
      link: 'https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/522022m.pdf'
    },
    {
      name: 'ISO/IEC 27001',
      description: 'Information Security Management Systems',
      link: 'https://www.iso.org/isoiec-27001-information-security.html'
    },
    {
      name: 'GDPR Article 17',
      description: 'Right to Erasure (Right to be Forgotten)',
      link: 'https://gdpr-info.eu/art-17-gdpr/'
    },
    {
      name: 'HIPAA Security Rule',
      description: 'Health Insurance Portability and Accountability Act',
      link: 'https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html'
    }
  ];

  const useCases = [
    {
      icon: <Users className="h-6 w-6 text-primary-600" />,
      title: 'Enterprise IT',
      description: 'Secure decommissioning of corporate devices and storage media with audit trails for compliance reporting.'
    },
    {
      icon: <Shield className="h-6 w-6 text-primary-600" />,
      title: 'Government Agencies',
      description: 'Meet strict data sanitization requirements for classified and sensitive government information systems.'
    },
    {
      icon: <Award className="h-6 w-6 text-primary-600" />,
      title: 'Healthcare Organizations',
      description: 'HIPAA-compliant data destruction for medical devices and systems containing protected health information.'
    },
    {
      icon: <FileCheck className="h-6 w-6 text-primary-600" />,
      title: 'Financial Services',
      description: 'Secure erasure of financial data with regulatory compliance for banking and financial institutions.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-50 to-blue-100 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About WipeOut
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade secure data erasure solution designed for organizations 
              that require verifiable, compliant, and tamper-proof data destruction.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-8">
              To provide organizations with the most secure, compliant, and verifiable data 
              erasure solution available. We believe that data security doesn't end with 
              encryption – it ends with complete, verifiable destruction.
            </p>
            <div className="bg-primary-50 rounded-lg p-6">
              <p className="text-primary-800 font-medium">
                "In an age where data breaches can destroy organizations, secure data erasure 
                isn't just a best practice – it's a business imperative."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">
              Built with security, compliance, and usability in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Standards Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Compliance Standards</h2>
            <p className="text-xl text-gray-600">
              Meets or exceeds industry and government standards for data sanitization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {standards.map((standard, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {standard.name}
                    </h3>
                    <p className="text-gray-600">
                      {standard.description}
                    </p>
                  </div>
                  <a
                    href={standard.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 ml-4"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Use Cases</h2>
            <p className="text-xl text-gray-600">
              Trusted by organizations across industries for secure data destruction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {useCase.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-gray-600">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Details Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Technical Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Wiping Algorithms</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">NIST Clear (1 pass)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">NIST Purge (3 passes)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">DoD 5220.22-M (3 passes)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">Gutmann (35 passes)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">Random (configurable)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Features</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">Cloud KMS digital signatures</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">SHA-256 data integrity</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">Tamper-evident certificates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">Cryptographic verification</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-700">Audit trail logging</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Contact us to learn more about implementing WipeOut in your organization
            or to discuss custom enterprise solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:sales@securedatasolutions.com"
              className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contact Sales
            </a>
            <a
              href="mailto:support@securedatasolutions.com"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Technical Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
