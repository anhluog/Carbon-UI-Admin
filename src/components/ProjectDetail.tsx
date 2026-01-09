// components/ProjectDetailPage.tsx - Trang chi tiết project đầy đủ (fetch data tự động)
import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, CheckCircle, Leaf, Users, Share2, Download, ArrowLeft, ArrowRight, FileText, ExternalLink } from 'lucide-react';
import api from '../utils/axiosInstance';  // Import API instance

interface ProjectAPI {
  id: string;
  name: string;
  vintage: number;
  ownerId: string;
  type: string;
  location: string;
  verifierRoleId: string;
  description: string;
  ipfsHash: string;
  onchainHash: string | null;
  nftTokenId: number;
  verifiedBy: string;
  approvedBy: string;
  expectedCredits: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Thêm fields khác nếu API có
}

interface Project {
  projectName: string;
  location: string;
  vintage: string;
  status: 'Approved' | 'Pending' | string;
  images: string[];
  documents: string[];  // Thêm array documents từ IPFS
  projectDescription: string;
  amount: number;
  date: string; // ISO date string
  totalValue: number;  // Có thể tính toán hoặc default (ví dụ: expectedCredits * price)
  certificateId: string;
  projectDeveloper: string;  // ownerId
  verificationStandard: string;  // Có thể map từ type hoặc default
  additionalCertifications: string[];
  environmentalBenefits: string[];
  socialBenefits: string[];
}

interface ProjectDetailPageProps {
  projectId: string | null;  // Nhận ID thay vì full project
  onBack: () => void;  // Handler quay lại tab project
}

const fetchIpfsMetadata = async (ipfsHash: string) => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch IPFS metadata failed:', ipfsHash, err);
    return null;
  }
};

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);  // State cho slider images

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchProjectDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch project từ API bằng ID
        const res = await api.get(`/projects/${projectId}`);
        const apiProject: ProjectAPI = res.data;

        // Fetch metadata từ IPFS nếu có
        let metadata = null;
        let imageUrls: string[] = ['/placeholder-image.jpg'];  // Default single placeholder
        let documentUrls: string[] = [];  // Default empty array cho documents
        let environmentalBenefits: string[] = [];  // Default empty
        let socialBenefits: string[] = [];  // Default empty
        if (apiProject.ipfsHash) {
          metadata = await fetchIpfsMetadata(apiProject.ipfsHash);
          // Xử lý multiple images: ưu tiên array images, fallback về single image
          if (metadata?.images && Array.isArray(metadata.images) && metadata.images.length > 0) {
            imageUrls = metadata.images.map((img: string) => 
              img.startsWith('ipfs://') ? img.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") : img
            );
          } else if (metadata?.image) {
            imageUrls = [metadata.image.startsWith('ipfs://') ? metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") : metadata.image];
          }
          // Xử lý multiple documents: array documents từ metadata
          if (metadata?.documents && Array.isArray(metadata.documents) && metadata.documents.length > 0) {
            documentUrls = metadata.documents.map((doc: string) => 
              doc.startsWith('ipfs://') ? doc.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") : doc
            );
          }
          // Giả sử metadata có attributes cho benefits (tùy cấu trúc IPFS của bạn)
          if (metadata?.attributes) {
            environmentalBenefits = metadata.attributes.filter((attr: any) => attr.trait_type === 'environmentalBenefits')?.map((attr: any) => attr.value) || [];
            socialBenefits = metadata.attributes.filter((attr: any) => attr.trait_type === 'socialBenefits')?.map((attr: any) => attr.value) || [];
          }
        }

        // Map API data sang interface Project
        const mappedProject: Project = {
          projectName: apiProject.name,
          location: apiProject.location,
          vintage: apiProject.vintage.toString(),
          status: apiProject.status === 'APPROVED' ? 'Approved' : 'Pending',  // Map status
          images: imageUrls,  // Array of images (multiple or single)
          documents: documentUrls,  // Array of document URLs từ IPFS
          projectDescription: apiProject.description || metadata?.description || 'No description available.',
          amount: apiProject.expectedCredits,
          date: apiProject.createdAt,
          totalValue: apiProject.expectedCredits * 10,  // Ví dụ: expectedCredits * price (10$/tCO2), chỉnh theo logic thật
          certificateId: apiProject.onchainHash || apiProject.nftTokenId.toString(),
          projectDeveloper: apiProject.ownerId,
          verificationStandard: mapProjectStandard(apiProject.type),  // Map từ type
          additionalCertifications: [apiProject.verifiedBy, apiProject.approvedBy].filter(Boolean),  // Từ verifiedBy/approvedBy
          environmentalBenefits,
          socialBenefits,
        };

        setProject(mappedProject);
        // Reset slider index khi load project mới
        setCurrentImageIndex(0);
      } catch (err: any) {
        console.error('Fetch project detail failed:', err);
        setError(err.response?.data?.message || 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetail();
  }, [projectId]);

  // Functions cho slider
  const nextImage = () => {
    if (project && project.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    }
  };

  const prevImage = () => {
    if (project && project.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    }
  };

  // Function để tạo Google Docs viewer URL cho View
  const getViewerUrl = (docUrl: string) => {
    return `https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=false`;
  };

  const mapProjectStandard = (type: string) => {
    switch (type) {
      case 'FOREST_AND_GREENRY': return 'Forest And Greenery';
      case 'RENEWABLE_ENERGY': return 'Renewable Energy';
      case 'ENERGY_EFFICIENCY': return 'Energy Efficiency';
      default: return 'General Standard';
    }
  };

  if (!projectId) {
    return (
      <div className="text-center pt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Project Selected</h2>
        <p className="text-gray-600 mb-8">Please select a project from the Projects tab.</p>
        <button 
          onClick={onBack} 
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center pt-16">
        <h2 className="text-2xl font-bold text-red-900 mb-4">Error Loading Project</h2>
        <p className="text-red-600 mb-8">{error}</p>
        <button 
          onClick={onBack} 
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  // Thêm guard để TypeScript biết project không null (dù logic đảm bảo)
  if (!project) {
    return (
      <div className="text-center pt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Data Unavailable</h2>
        <p className="text-gray-600 mb-8">Unable to load project details at this time.</p>
        <button 
          onClick={onBack} 
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Projects</span>
        </button>
      </div>
    );
  }

  // Render project nếu có data (TypeScript biết project không null ở đây)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-green-50 via-white to-emerald-50 min-h-screen">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Back to Projects</span>
      </button>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.projectName}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Vintage {project.vintage}</span>
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {project.status}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            {/* Slider cho multiple images */}
            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
              <img
                src={project.images[currentImageIndex] || '/placeholder-image.jpg'}
                alt={`${project.projectName} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain bg-gray-100"  // object-contain để fit vua khung, không crop
              />
              {project.images.length > 1 && (
                <>
                  {/* Navigation arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {/* Dots indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                    {project.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Project Description</h4>
              <p className="text-sm text-gray-600">{project.projectDescription}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Amount:</span>
                  <span className="font-medium text-green-900">{project.amount} tCO₂</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Date:</span>
                  <span className="font-medium text-green-900">
                    {new Date(project.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Total Value:</span>
                  <span className="font-medium text-green-900">${project.totalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Certificate ID:</span>
                  <span className="font-medium text-green-900 text-xs">{project.certificateId}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-3">Project Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Developer:</span>
                  <span className="font-medium text-blue-900">{project.projectDeveloper}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Standard:</span>
                  <span className="font-medium text-blue-900">{project.verificationStandard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Additional Certs:</span>
                  <span className="font-medium text-blue-900">{project.additionalCertifications.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Section cho Documents */}
        {project.documents.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Verification Documents</span>
            </h4>
            <ul className="space-y-2">
              {project.documents.map((docUrl: string, index: number) => {
                // Tạo Google Docs viewer URL cho View (hỗ trợ PDF, DOC, DOCX)
                const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(docUrl)}&embedded=false`;
                return (
                  <li key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600 flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>Document {index + 1}</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      {/* Preview nếu là PDF (iframe) */}
                      {docUrl.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={docUrl}
                          className="w-32 h-20 rounded border"
                          title={`Preview Document ${index + 1}`}
                        />
                      ) : null}
                      {/* Nút View riêng (mở Google Docs viewer trong new tab) */}
                      <a
                        href={viewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View</span>
                      </a>
                      {/* Nút Download riêng */}
                      <a
                        href={docUrl}
                        download
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <span>Environmental Benefits</span>
            </h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {project.environmentalBenefits.length > 0 ? (
                project.environmentalBenefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{benefit}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No environmental benefits listed.</li>
              )}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Social Benefits</span>
            </h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {project.socialBenefits.length > 0 ? (
                project.socialBenefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>{benefit}</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No social benefits listed.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {/* Logic share */ console.log('Share:', project.projectName); }}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Information</span>
          </button>
          <button
            onClick={() => {/* Logic download */ console.log('Download:', project.certificateId); }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;