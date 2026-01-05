import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Eye, MapPin, CheckCircle, Calendar, X } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  vintage: number;
  ownerId: string;
  type: string;
  location: string;
  description: string;
  ipfsHash: string;
  verifiedBy: string | null;
  approvedBy: string | null;
  expectedCredits: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

<<<<<<< HEAD
const VerifyProject: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToVerify, setProjectToVerify] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/projects/ProjectSubmited');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Project[] = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleOpenRejectionPopup = (project: Project) => {
    setProjectToVerify(project);
    setShowRejectionPopup(true);
  };

  const handleCloseRejectionPopup = () => {
    setProjectToVerify(null);
    setShowRejectionPopup(false);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (rejectionReason.trim() === '' || !projectToVerify) return;
    try {
      // TODO: Implement actual rejection API call, e.g., POST to /api/projects/{id}/reject
      // with { reason: rejectionReason }
      console.log(`Project ${projectToVerify.name} rejected with reason: ${rejectionReason}`);
      // Optionally refetch projects after rejection
      // await fetchProjects(); // Uncomment if refetch needed
    } catch (err) {
      console.error('Rejection failed:', err);
    }
    handleCloseRejectionPopup();
  };

  const handleAccept = async (project: Project) => {
    try {
      // TODO: Implement actual acceptance API call, e.g., POST to /api/projects/{id}/accept
      console.log(`Project ${project.name} accepted`);
      // Optionally refetch projects after acceptance
      // await fetchProjects(); // Uncomment if refetch needed
    } catch (err) {
      console.error('Acceptance failed:', err);
    }
=======
const Projects: React.FC<ProjectsProps> = ({ walletAddress }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectStatus, setProjectStatus] = useState('Approved');

  const projects = [
    {
      id: 1,
      projectName: 'Amazon Rainforest Conservation',
      projectType: 'Forest Protection',
      location: 'Brazil',
      methodology: 'VCS',
      vintage: 2024,
      amount: 50.5,
      date: '2024-01-15',
      price: 2.31,
      totalValue: 116.66,
      certificateId: 'VCS-2024-001-BR-50.5',
      reason: 'Corporate Carbon Neutrality Program',
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
      ],
      status: 'Approved'
    },
    {
      id: 2,
      projectName: 'Solar Energy Farm Thailand',
      projectType: 'Renewable Energy',
      location: 'Thailand',
      methodology: 'CDM',
      vintage: 2024,
      amount: 25.0,
      date: '2024-01-10',
      price: 2.45,
      totalValue: 61.25,
      certificateId: 'CDM-2024-002-TH-25.0',
      reason: 'Annual Carbon Offset Initiative',
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
      ],
      status: 'Approved'
    },
    {
      id: 3,
      projectName: 'Wind Power Project Mexico',
      projectType: 'Renewable Energy',
      location: 'Mexico',
      methodology: 'GS',
      vintage: 2023,
      amount: 75.2,
      date: '2023-12-20',
      price: 2.28,
      totalValue: 171.46,
      certificateId: 'GS-2023-003-MX-75.2',
      reason: 'Supply Chain Carbon Neutrality',
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
      ],
      status: 'Pending Approval'
    },
    {
      id: 4,
      projectName: 'Cookstove Efficiency Program',
      projectType: 'Energy Efficiency',
      location: 'India',
      methodology: 'GS',
      vintage: 2023,
      amount: 30.8,
      date: '2023-11-15',
      price: 1.85,
      totalValue: 56.98,
      certificateId: 'GS-2023-004-IN-30.8',
      reason: 'Event Carbon Neutrality',
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
      ],
      status: 'Approved'
    }
  ];

  const approvedAmount = projects
    .filter(p => p.status === 'Approved')
    .reduce((sum, project) => sum + project.amount, 0);

  const pendingValue = projects
    .filter(p => p.status === 'Pending Approval')
    .reduce((sum, project) => sum + project.amount, 0);

  const projectTypes = [
    { id: 'all', name: 'All Projects', count: projects.length },
    { id: 'forest', name: 'Forest Protection', count: projects.filter(p => p.projectType === 'Forest Protection').length },
    { id: 'renewable', name: 'Renewable Energy', count: projects.filter(p => p.projectType === 'Renewable Energy').length },
    { id: 'efficiency', name: 'Energy Efficiency', count: projects.filter(p => p.projectType === 'Energy Efficiency').length }
  ];

  const filteredProjects = projects.filter(project => {
    const matchesStatus = project.status === projectStatus;
    const matchesType = activeFilter === 'all' || 
      (activeFilter === 'forest' && project.projectType === 'Forest Protection') ||
      (activeFilter === 'renewable' && project.projectType === 'Renewable Energy') ||
      (activeFilter === 'efficiency' && project.projectType === 'Energy Efficiency');
    
    const matchesTime = timeFilter === 'all-time' ||
      (timeFilter === '2024' && project.vintage === 2024) ||
      (timeFilter === '2023' && project.vintage === 2023);
    
    return matchesStatus && matchesType && matchesTime;
  });

  const handleDownloadCertificate = (project: any) => {
    // Simulate certificate download
    console.log(`Downloading certificate for ${project.projectName}`);
>>>>>>> 60205b23b5897d3f2c7f7fce0bba19fe24d6e706
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Projects Management</h3>
          <button
            onClick={() => setShowCreateProject(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Projects Management</h3>
          <button
            onClick={() => setShowCreateProject(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Projects Management</h3>
        <button
          onClick={() => setShowCreateProject(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Project</span>
        </button>
      </div>

<<<<<<< HEAD
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No submitted projects found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}</span>
                    </span>
                    <span>{project.type}</span>
                    <span>Vintage {project.vintage}</span>
=======
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div onClick={() => setProjectStatus('Approved')} className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border cursor-pointer ${projectStatus === 'Approved' ? 'border-green-400' : 'border-green-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{approvedAmount.toFixed(1)} tCO₂</h3>
          <p className="text-sm text-gray-600">Approved</p>
        </div>

        <div onClick={() => setProjectStatus('Pending Approval')} className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border cursor-pointer ${projectStatus === 'Pending Approval' ? 'border-blue-400' : 'border-blue-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{pendingValue.toFixed(2)} tCO₂</h3>
          <p className="text-sm text-gray-600">Pending Approval</p>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{project.projectType}</p>
>>>>>>> 60205b23b5897d3f2c7f7fce0bba19fe24d6e706
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAccept(project)}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleOpenRejectionPopup(project)}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4 text-red-600" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleViewProject(project)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Expected Credits</p>
                  <p className="font-semibold text-gray-900">{project.expectedCredits}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sold</p>
                  <p className="font-semibold text-gray-900">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price per CCT</p>
                  <p className="font-semibold text-gray-900">$0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="font-semibold text-gray-900">$0</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRejectionPopup && projectToVerify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reject Project</h2>
              <button onClick={handleCloseRejectionPopup} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-gray-600">Please provide a reason for rejecting "{projectToVerify.name}".</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-vertical focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseRejectionPopup}
                className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectionReason.trim() === ''}
                className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedProject.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedProject.location}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Vintage {selectedProject.vintage}</span>
                    </span>
<<<<<<< HEAD
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedProject.type}
=======
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedProject.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {selectedProject.status}
>>>>>>> 60205b23b5897d3f2c7f7fce0bba19fe24d6e706
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
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Project Details</h4>
                  <p className="text-sm text-gray-600">{selectedProject.description || 'No description available for this project.'}</p>
                  {selectedProject.ipfsHash && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">IPFS Hash:</p>
                      <p className="text-xs font-mono break-all text-gray-700">{selectedProject.ipfsHash}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-3">Credit Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Expected Credits:</span>
                        <span className="font-medium text-green-900">{selectedProject.expectedCredits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Sold:</span>
                        <span className="font-medium text-green-900">0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Price per CCT:</span>
                        <span className="font-medium text-green-900">$0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Status:</span>
                        <span className="font-medium text-green-900 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          {selectedProject.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Owner:</span>
                        <span className="font-medium text-green-900 text-xs break-all">{selectedProject.ownerId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TODO: Implement Create Project modal if showCreateProject is true */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Create New Project</h3>
              <p className="text-gray-600 mb-6">Project creation form goes here.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyProject;