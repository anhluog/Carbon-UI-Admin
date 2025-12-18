import React, { useState } from 'react';
import { Award, Calendar, MapPin, Leaf, TrendingUp, Filter, Download, Share2, Eye, BarChart3, Globe, Users, CheckCircle } from 'lucide-react';

interface RetiredProjectsProps {
  walletAddress: string;
}

const RetiredProjects: React.FC<RetiredProjectsProps> = ({ walletAddress }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const retiredProjects = [
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

  const totalStats = {
    totalRetired: retiredProjects.reduce((sum, project) => sum + project.retiredAmount, 0),
    totalValue: retiredProjects.reduce((sum, project) => sum + project.totalValue, 0),
    totalProjects: retiredProjects.length,
    averagePrice: retiredProjects.reduce((sum, project) => sum + project.retiredPrice, 0) / retiredProjects.length
  };

  const projectTypes = [
    { id: 'all', name: 'All Projects', count: retiredProjects.length },
    { id: 'forest', name: 'Forest Protection', count: retiredProjects.filter(p => p.projectType === 'Forest Protection').length },
    { id: 'renewable', name: 'Renewable Energy', count: retiredProjects.filter(p => p.projectType === 'Renewable Energy').length },
    { id: 'efficiency', name: 'Energy Efficiency', count: retiredProjects.filter(p => p.projectType === 'Energy Efficiency').length }
  ];

  const filteredProjects = retiredProjects.filter(project => {
    const matchesType = activeFilter === 'all' || 
      (activeFilter === 'forest' && project.projectType === 'Forest Protection') ||
      (activeFilter === 'renewable' && project.projectType === 'Renewable Energy') ||
      (activeFilter === 'efficiency' && project.projectType === 'Energy Efficiency');
    
    const matchesTime = timeFilter === 'all-time' ||
      (timeFilter === '2024' && project.vintage === 2024) ||
      (timeFilter === '2023' && project.vintage === 2023);
    
    return matchesType && matchesTime;
  });

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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Retired Carbon Credits</h2>
        <p className="text-gray-600">Track your environmental impact through retired carbon credit projects.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <Award className="h-8 w-8 text-green-600" />
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
              Total
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalStats.totalRetired.toFixed(1)} tCO₂</h3>
          <p className="text-sm text-gray-600">Credits Retired</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">${totalStats.totalValue.toFixed(2)}</h3>
          <p className="text-sm text-gray-600">Total Investment</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <Globe className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalStats.totalProjects}</h3>
          <p className="text-sm text-gray-600">Projects Supported</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">${totalStats.averagePrice.toFixed(2)}</h3>
          <p className="text-sm text-gray-600">Avg. Price/tCO₂</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-wrap gap-2">
            {projectTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveFilter(type.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeFilter === type.id
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                {type.name} ({type.count})
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all-time">All Time</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-green-100 hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-4">
                  <img 
                    src={project.images[0]} 
                    alt={project.projectName}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.projectName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{project.location}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Vintage {project.vintage}</span>
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {project.methodology}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{project.projectType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Retired</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(project.retiredDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Amount Retired</p>
                  <p className="font-semibold text-gray-900">{project.retiredAmount} tCO₂</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Retirement Price</p>
                  <p className="font-semibold text-gray-900">${project.retiredPrice}/tCO₂</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="font-semibold text-gray-900">${project.totalValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Certificate ID</p>
                  <p className="font-semibold text-gray-900 text-xs">{project.certificateId}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-green-900 mb-2">Retirement Details</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p><span className="font-medium">Reason:</span> {project.retirementReason}</p>
                  <p><span className="font-medium">Beneficiary:</span> {project.beneficiary}</p>
                  <p><span className="font-medium">Serial Numbers:</span> {project.serialNumbers}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Environmental Impact: {project.retiredAmount} tCO₂ offset</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleShareRetirement(project)}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCertificate(project)}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Certificate</span>
                  </button>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No retired projects found</p>
          <p className="text-gray-400">Try adjusting your filters or retire some carbon credits to see them here.</p>
        </div>
      )}

      {/* Project Detail Modal */}
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
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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

export default RetiredProjects;