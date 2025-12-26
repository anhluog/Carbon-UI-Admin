import React, { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Award,
  X,
  Leaf,
  Users,
  CheckCircle,
  Download,
  Share2
} from "lucide-react";
import CryptoMarket from "./CryptoMarket";

interface MarketplaceProps {
  walletAddress: string;
  setActiveTab: (tab: string) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ walletAddress, setActiveTab }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [showCryptoMarket, setShowCryptoMarket] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
        const mockRetiredProjects = [
            {
              id: 1,
              projectName: 'Amazon Rainforest Conservation',
              projectType: 'Forest Protection',
              location: 'Brazil',
              methodology: 'VCS',
              vintage: 2024,
              retiredAmount: 50.5,
              retiredDate: '2024-01-15',
              retiredPrice: 2.31,
              totalValue: 116.66,
              certificateId: 'VCS-2024-001-BR-50.5',
              retirementReason: 'Corporate Carbon Neutrality Program',
              beneficiary: 'Green Future Solutions',
              serialNumbers: 'BR-VCS-2024-001-001 to BR-VCS-2024-001-050',
              projectDescription: 'Protection of 10,000 hectares of Amazon rainforest from deforestation through community-based conservation programs.',
              projectDeveloper: 'Amazon Conservation Alliance',
              verificationStandard: 'Verified Carbon Standard (VCS)',
              additionalCertifications: ['CCBS', 'SD VISta'],
              environmentalBenefits: [
                'Biodiversity conservation',
                'Watershed protection',
                'Soil conservation',
                'Air quality improvement'
              ],
              socialBenefits: [
                'Local community employment',
                'Indigenous rights protection',
                'Education programs',
                'Healthcare access'
              ],
              images: [
                'https://images.pexels.com/photos/975771/pexels-photo-975771.jpeg',
                'https://images.pexels.com/photos/1632790/pexels-photo-1632790.jpeg'
              ]
            },
            {
                id: 2,
                projectName: 'African Wind Energy',
                projectType: 'Renewable Energy',
                location: 'Kenya',
                methodology: 'Gold Standard',
                vintage: 2023,
                retiredAmount: 120,
                retiredDate: '2024-02-20',
                retiredPrice: 3.10,
                totalValue: 372.00,
                certificateId: 'GS-2023-002-KE-120',
                retirementReason: 'Offsetting Travel Emissions',
                beneficiary: 'Eco-Warriors Inc.',
                serialNumbers: 'KE-GS-2023-002-001 to KE-GS-2023-002-120',
                projectDescription: 'A 50 MW wind farm providing clean energy to the national grid and reducing reliance on fossil fuels.',
                projectDeveloper: 'WindPower Africa',
                verificationStandard: 'Gold Standard',
                additionalCertifications: ['Fair Trade'],
                environmentalBenefits: ['Reduced GHG emissions', 'Improved air quality'],
                socialBenefits: ['Job creation', 'Energy independence'],
                images: ['https://images.pexels.com/photos/220326/pexels-photo-220326.jpeg', 'https://images.pexels.com/photos/414837/pexels-photo-414837.jpeg']
            },
            {
                id: 3,
                projectName: 'Community Reforestation Initiative',
                projectType: 'Afforestation',
                location: 'India',
                methodology: 'Plan Vivo',
                vintage: 2023,
                retiredAmount: 75,
                retiredDate: '2024-03-10',
                retiredPrice: 1.85,
                totalValue: 138.75,
                certificateId: 'PV-2023-003-IN-75',
                retirementReason: 'Personal Carbon Footprint Offset',
                beneficiary: 'Jane Doe',
                serialNumbers: 'IN-PV-2023-003-001 to IN-PV-2023-003-075',
                projectDescription: 'Reforestation of degraded lands by local communities, promoting biodiversity and creating sustainable livelihoods.',
                projectDeveloper: 'Green India Project',
                verificationStandard: 'Plan Vivo',
                additionalCertifications: [],
                environmentalBenefits: ['Carbon sequestration', 'Habitat restoration'],
                socialBenefits: ['Poverty alleviation', 'Community empowerment'],
                images: ['https://images.pexels.com/photos/957024/pexels-photo-957024.jpeg', 'https://images.pexels.com/photos/142497/pexels-photo-142497.jpeg']
            },
            {
                id: 4,
                projectName: 'Efficient Cookstoves Program',
                projectType: 'Energy Efficiency',
                location: 'Guatemala',
                methodology: 'VCS',
                vintage: 2024,
                retiredAmount: 30,
                retiredDate: '2024-04-05',
                retiredPrice: 2.50,
                totalValue: 75.00,
                certificateId: 'VCS-2024-004-GT-30',
                retirementReason: 'Corporate Social Responsibility',
                beneficiary: 'Global Tech Corp',
                serialNumbers: 'GT-VCS-2024-004-001 to GT-VCS-2024-004-030',
                projectDescription: 'Distribution of high-efficiency cookstoves to rural households, reducing fuelwood consumption and indoor air pollution.',
                projectDeveloper: 'CleanAir Solutions',
                verificationStandard: 'Verified Carbon Standard (VCS)',
                additionalCertifications: ['SD VISta'],
                environmentalBenefits: ['Reduced deforestation', 'Lower black carbon emissions'],
                socialBenefits: ['Improved health outcomes', 'Reduced fuel costs for families'],
                images: ['https://images.pexels.com/photos/326874/pexels-photo-326874.jpeg', 'https://images.pexels.com/photos/207455/pexels-photo-207455.jpeg']
            }
        ];
      setProjects(mockRetiredProjects);
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "forest" && project.projectType === "Forest Protection") ||
      (activeFilter === "renewable" && project.projectType === "Renewable Energy") ||
      (activeFilter === "afforestation" && project.projectType === "Afforestation") ||
      (activeFilter === "efficiency" && project.projectType === "Energy Efficiency");

    const matchesSearch =
      project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.retiree?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleViewProjectDetails = (project: any) => {
    setSelectedProject(project);
  };

  const handleNavigateToCryptoMarket = () => {
    setShowCryptoMarket(true);
  };

  const handleDownloadCertificate = (project: any) => {
    console.log(`Downloading certificate for ${project.projectName}`);
  };

  const handleShareRetirement = (project: any) => {
    console.log(`Sharing retirement for ${project.projectName}`);
  };


  return (
    <div className="space-y-8">
        {showCryptoMarket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-100 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Crypto Market</h3>
                    <button
                    onClick={() => setShowCryptoMarket(false)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                    <X className="h-6 w-6" />
                    </button>
                </div>
                <CryptoMarket projects={projects} />
            </div>
            </div>
      </div>
      )}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🌍 Carbon Credits Marketplace
        </h2>
        <p className="text-gray-600">
          Browse and verify retired carbon credits from environmental projects.
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by project, location, or retiree..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setActiveFilter("all")} className={`px-4 py-2 rounded-lg text-sm ${activeFilter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>All Projects</button>
          <button onClick={() => setActiveFilter("forest")} className={`px-4 py-2 rounded-lg text-sm ${activeFilter === 'forest' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Forest Protection</button>
          <button onClick={() => setActiveFilter("renewable")} className={`px-4 py-2 rounded-lg text-sm ${activeFilter === 'renewable' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Renewable Energy</button>
          <button onClick={() => setActiveFilter("afforestation")} className={`px-4 py-2 rounded-lg text-sm ${activeFilter === 'afforestation' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Afforestation</button>
          <button onClick={() => setActiveFilter("efficiency")} className={`px-4 py-2 rounded-lg text-sm ${activeFilter === 'efficiency' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Energy Efficiency</button>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Retired Projects</h3>
        <div className="overflow-x-auto">
          {filteredProjects.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retiree</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Retired</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vintage</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retirement Date</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Certificate</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <button onClick={() => handleViewProjectDetails(project)} className="text-left hover:text-green-600">
                        {project.projectName}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.projectType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                        {project.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{project.retiree}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.retiredAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.vintage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        {project.retiredDate}
                      </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={handleNavigateToCryptoMarket} className="text-green-600 hover:text-green-900">
                        View Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No retired projects found</p>
              <p className="text-gray-400">Try adjusting your filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.projectName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedProject.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Vintage {selectedProject.vintage}</span>
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {selectedProject.methodology}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedProject(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
      
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div>
                        <img 
                          src={selectedProject.images[0]} 
                          alt={selectedProject.projectName}
                          className="w-full h-64 rounded-xl object-cover mb-4"
                        />
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Project Description</h4>
                          <p className="text-sm text-gray-600">{selectedProject.projectDescription}</p>
                        </div>
                      </div>
      
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <h4 className="font-semibold text-green-900 mb-3">Retirement Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Amount Retired:</span>
                              <span className="font-medium text-green-900">{selectedProject.retiredAmount} tCO₂</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Retirement Date:</span>
                              <span className="font-medium text-green-900">
                                {new Date(selectedProject.retiredDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Total Value:</span>
                              <span className="font-medium text-green-900">${selectedProject.totalValue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Certificate ID:</span>
                              <span className="font-medium text-green-900 text-xs">{selectedProject.certificateId}</span>
                            </div>
                          </div>
                        </div>
      
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-900 mb-3">Project Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Developer:</span>
                              <span className="font-medium text-blue-900">{selectedProject.projectDeveloper}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Standard:</span>
                              <span className="font-medium text-blue-900">{selectedProject.verificationStandard}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Additional Certs:</span>
                              <span className="font-medium text-blue-900">{selectedProject.additionalCertifications.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
      
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <Leaf className="h-5 w-5 text-green-600" />
                          <span>Environmental Benefits</span>
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {selectedProject.environmentalBenefits.map((benefit: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
      
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span>Social Benefits</span>
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {selectedProject.socialBenefits.map((benefit: string, index: number) => (
                            <li key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
      
                    <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => handleShareRetirement(selectedProject)}
                        className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share Impact</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCertificate(selectedProject)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Certificate</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
};

export default Marketplace;
