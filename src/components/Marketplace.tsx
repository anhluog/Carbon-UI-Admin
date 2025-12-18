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
import { ethers } from "ethers";
import CarbonCredit from "../abi/CarbonCredit.json";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MarketplaceProps {
  walletAddress: string;
  setActiveTab: (tab: string) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ walletAddress, setActiveTab }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Mock data for the chart
  const chartData = [
    { name: 'Jan', price: 4000 },
    { name: 'Feb', price: 3000 },
    { name: 'Mar', price: 5000 },
    { name: 'Apr', price: 4500 },
    { name: 'May', price: 6000 },
    { name: 'Jun', price: 5500 },
    { name: 'Jul', price: 7000 },
    { name: 'Aug', price: 6800 },
    { name: 'Sep', price: 7200 },
    { name: 'Oct', price: 7500 },
    { name: 'Nov', price: 7300 },
    { name: 'Dec', price: 8000 },
  ];

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
              projectName: 'Solar Energy Farm Thailand',
              projectType: 'Renewable Energy',
              location: 'Thailand',
              methodology: 'CDM',
              vintage: 2024,
              retiredAmount: 25.0,
              retiredDate: '2024-01-10',
              retiredPrice: 2.45,
              totalValue: 61.25,
              certificateId: 'CDM-2024-002-TH-25.0',
              retirementReason: 'Annual Carbon Offset Initiative',
              beneficiary: 'EcoTech Corporation',
              serialNumbers: 'TH-CDM-2024-002-001 to TH-CDM-2024-002-025',
              projectDescription: '50MW solar photovoltaic power plant providing clean electricity to the national grid.',
              projectDeveloper: 'Thai Solar Power Co.',
              verificationStandard: 'Clean Development Mechanism (CDM)',
              additionalCertifications: ['ISO 14001'],
              environmentalBenefits: [
                'GHG emissions reduction',
                'Air pollution reduction',
                'Renewable energy generation'
              ],
              socialBenefits: [
                'Job creation',
                'Technology transfer',
                'Energy security'
              ],
              images: [
                'https://images.pexels.com/photos/433308/pexels-photo-433308.jpeg'
              ]
            },
            {
              id: 3,
              projectName: 'Wind Power Project Mexico',
              projectType: 'Renewable Energy',
              location: 'Mexico',
              methodology: 'GS',
              vintage: 2023,
              retiredAmount: 75.2,
              retiredDate: '2023-12-20',
              retiredPrice: 2.28,
              totalValue: 171.46,
              certificateId: 'GS-2023-003-MX-75.2',
              retirementReason: 'Supply Chain Carbon Neutrality',
              beneficiary: 'Manufacturing Corp Ltd',
              serialNumbers: 'MX-GS-2023-003-001 to MX-GS-2023-003-075',
              projectDescription: '100MW wind farm generating clean electricity for 50,000 homes annually.',
              projectDeveloper: 'Wind Energy Mexico',
              verificationStandard: 'Gold Standard (GS)',
              additionalCertifications: ['SD VISta'],
              environmentalBenefits: [
                'Clean energy generation',
                'GHG emissions avoidance',
                'Land use efficiency'
              ],
              socialBenefits: [
                'Rural development',
                'Local employment',
                'Infrastructure development'
              ],
              images: [
                'https://images.pexels.com/photos/414837/pexels-photo-414837.jpeg'
              ]
            },
            {
              id: 4,
              projectName: 'Cookstove Efficiency Program',
              projectType: 'Energy Efficiency',
              location: 'India',
              methodology: 'GS',
              vintage: 2023,
              retiredAmount: 30.8,
              retiredDate: '2023-11-15',
              retiredPrice: 1.85,
              totalValue: 56.98,
              certificateId: 'GS-2023-004-IN-30.8',
              retirementReason: 'Event Carbon Neutrality',
              beneficiary: 'Global Conference 2023',
              serialNumbers: 'IN-GS-2023-004-001 to IN-GS-2023-004-030',
              projectDescription: 'Distribution of efficient cookstoves to rural households reducing wood consumption and indoor air pollution.',
              projectDeveloper: 'Clean Energy India',
              verificationStandard: 'Gold Standard (GS)',
              additionalCertifications: ['Women+ Standard'],
              environmentalBenefits: [
                'Deforestation reduction',
                'Air quality improvement',
                'Fuel efficiency'
              ],
              socialBenefits: [
                'Women empowerment',
                'Health improvement',
                'Time savings',
                'Cost reduction'
              ],
              images: [
                'https://images.pexels.com/photos/6194401/pexels-photo-6194401.jpeg'
              ]
            }
          ];
      setProjects(mockRetiredProjects);
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "forest" && project.type === "Forest Protection") ||
      (activeFilter === "renewable" && project.type === "Renewable Energy") ||
      (activeFilter === "afforestation" && project.type === "Afforestation") ||
      (activeFilter === "efficiency" && project.type === "Energy Efficiency");

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
    setActiveTab('crypto');
  };

  const handleDownloadCertificate = (project: any) => {
    // Simulate certificate download
    console.log(`Downloading certificate for ${project.projectName}`);
  };

  const handleShareRetirement = (project: any) => {
    // Simulate sharing retirement
    console.log(`Sharing retirement for ${project.projectName}`);
  };


  return (
    <div className="space-y-8">
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
