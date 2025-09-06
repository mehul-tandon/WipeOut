import React from 'react';
import { Shield, Github, Mail, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">WipeOut</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Professional-grade secure data erasure solution with NIST SP 800-88 
              compliance and tamper-proof certification. Trusted by organizations 
              worldwide for complete data sanitization.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/secure-data-solutions/secure-wiper"
                className="text-gray-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@securedatasolutions.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/download" className="text-gray-300 hover:text-white transition-colors">
                  Download Tools
                </a>
              </li>
              <li>
                <a href="/verify" className="text-gray-300 hover:text-white transition-colors">
                  Verify Certificate
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="/docs" className="text-gray-300 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Compliance</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <a
                  href="https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  NIST SP 800-88
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <a
                  href="https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodm/522022m.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  DoD 5220.22-M
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <a
                  href="https://www.iso.org/isoiec-27001-information-security.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  ISO 27001
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <a
                  href="https://gdpr-info.eu/art-17-gdpr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  GDPR Compliant
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <a
                  href="https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  HIPAA Compliant
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Secure Data Solutions. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="/security" className="text-gray-400 hover:text-white text-sm transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
