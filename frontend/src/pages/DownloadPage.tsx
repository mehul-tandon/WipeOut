import React, { useState, useEffect } from 'react';
import {
  Download,
  Monitor,
  HardDrive,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { getAvailableTools, getInstructions, ToolsResponse, Tool } from '../services/api';

export const DownloadPage: React.FC = () => {
  const [tools, setTools] = useState<ToolsResponse | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comingSoonPlatform, setComingSoonPlatform] = useState<string | null>(null);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const toolsData = await getAvailableTools();
        setTools(toolsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load tools');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, []);

  const handleShowInstructions = async (platform: string) => {
    try {
      const instructionsData = await getInstructions(platform);
      setInstructions(instructionsData);
      setSelectedPlatform(platform);
    } catch (err: any) {
      console.error('Failed to load instructions:', err);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows':
        return <Monitor className="h-12 w-12 text-blue-600" />;
      case 'linux':
        return <HardDrive className="h-12 w-12 text-orange-600" />;
      case 'macos':
        return <HardDrive className="h-12 w-12 text-gray-600" />;
      default:
        return <Monitor className="h-12 w-12 text-gray-600" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'windows':
        return 'border-blue-200 bg-blue-50';
      case 'linux':
        return 'border-orange-200 bg-orange-50';
      case 'macos':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available tools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tools</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Download Secure Wiper Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the right tool for your platform. All tools provide NIST SP 800-88 
            compliant data erasure with tamper-proof certification.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {tools && Object.entries(tools.tools).map(([platform, tool]: [string, Tool]) => (
            <div
              key={platform}
              className={`bg-white rounded-lg shadow-sm border-2 ${getPlatformColor(platform)} p-6 hover:shadow-md transition-shadow`}
            >
              <div className="text-center mb-6">
                {getPlatformIcon(platform)}
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                  {tool.displayName}
                </h3>
                <p className="text-gray-600 text-sm">
                  {tool.description}
                </p>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Version:</span>
                  <span className="font-medium">{tool.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Size:</span>
                  <span className="font-medium">{tool.actualSize || tool.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Architecture:</span>
                  <span className="font-medium">{tool.architecture}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium flex items-center ${
                    tool.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tool.available ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Available
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Not Available
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {tool.available ? (
                  <a
                    href={`${process.env.REACT_APP_API_URL}${tool.downloadUrl}`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                ) : (
                  <button
                    onClick={() => setComingSoonPlatform(platform)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                )}
                
                <button
                  onClick={() => handleShowInstructions(platform)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Info className="h-4 w-4 mr-2" />
                  View Instructions
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <strong>Requirements:</strong> {tool.requirements}
                </p>
              </div>
            </div>
          ))}
        </div>



        {/* Instructions Modal */}
        {instructions && selectedPlatform && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {instructions.title}
                  </h2>
                  <button
                    onClick={() => {
                      setInstructions(null);
                      setSelectedPlatform(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Installation Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Installation Steps</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {instructions.steps.map((step: string, index: number) => (
                        <li key={index} className="text-gray-700">{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {instructions.requirements.map((req: string, index: number) => (
                        <li key={index} className="text-gray-700">{req}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Warnings */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Important Warnings
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {instructions.warnings.map((warning: string, index: number) => (
                        <li key={index} className="text-red-700">{warning}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Support Contact */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Need help? Contact us at{' '}
                      <a 
                        href={`mailto:${instructions.supportContact}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {instructions.supportContact}
                      </a>
                      {instructions.documentationUrl && (
                        <>
                          {' '}or visit our{' '}
                          <a 
                            href={instructions.documentationUrl}
                            className="text-primary-600 hover:text-primary-700 inline-flex items-center"
                          >
                            documentation <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coming Soon Modal */}
        {comingSoonPlatform && (
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

                <button
                  onClick={() => setComingSoonPlatform(null)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
