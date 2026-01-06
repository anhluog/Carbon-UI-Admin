import { Award, Calendar, MapPin, Leaf, TrendingUp, Filter, Share2, Eye, BarChart3, Globe, Users, CheckCircle, X, Clock, Plus } from 'lucide-react';
import api from '../utils/axiosInstance';
import React, { useEffect, useState } from 'react';

interface ProjectsProps {
  walletAddress: string;
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


const Projects: React.FC<ProjectsProps> = ({ walletAddress }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectStatus, setProjectStatus] = useState('Approved');
  const [projects, setProjects] = useState<Array<any>>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects/MyProject');

        const mappedProjects = await Promise.all(
          res.data.map(async (p: any) => {
            let imageUrl =
              'https://via.placeholder.com/400x300?text=No+Image';

            if (p.ipfsHash) {
              const metadata = await fetchIpfsMetadata(p.ipfsHash);
              if (metadata?.image) {
                imageUrl = metadata.image;
              }
            }

            return {
              id: p.id,
              projectName: p.name,
              projectType: mapProjectType(p.type),
              location: p.location,
              vintage: p.vintage,
              amount: p.expectedCredits ?? 0,
              date: p.createdAt,
              certificateId: p.onchainHash,
              projectDescription: p.description,
              images: [imageUrl], // 🔥 IPFS IMAGE
              status: mapStatus(p.status)
            };
          })
        );

        setProjects(mappedProjects);
      } catch (e) {
        console.error('Load projects failed', e);
      }
    };

    fetchProjects();
  }, []);


  const mapProjectType = (type: string) => {
    switch (type) {
      case 'FOREST_AND_GREENRY':
        return 'Forest Protection';
      case 'RENEWABLE_ENERGY':
        return 'Renewable Energy';
      case 'ENERGY_EFFICIENCY':
        return 'Energy Efficiency';
      default:
        return 'Other';
    }
  };

  const mapStatus = (status: string) => {
    if (status === 'APPROVED') return 'Approved';
    if (status === 'PENDING') return 'Pending Approval';
    return 'Pending Approval';
  };

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
    console.log(`Downloading certificate for ${project.projectName}`);
  };

  const handleShare = (project: any) => {
    console.log(`Sharing project for ${project.projectName}`);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='flex justify-between items-center mb-12'>
          <div className='flex items-center space-x-3'>
            <div className='h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg'>
              <Leaf className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-4xl font-bold text-gray-900'>My Projects</h1>
              <p className='text-lg text-gray-600 mt-1'>Track and manage your carbon credit projects</p>
            </div>
          </div>
          <button className='flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium'>
            <Plus className='h-5 w-5' />
            <span>New Project</span>
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-10'>
          <div
            onClick={() => setProjectStatus('Approved')}
            className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${projectStatus === 'Approved'
              ? 'shadow-lg'
              : 'shadow-md hover:shadow-lg'
              }`}
          >
            <div className='flex items-center justify-between mb-6'>
              <div className='h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center'>
                <CheckCircle className='h-7 w-7 text-green-600' />
              </div>
              {projectStatus === 'Approved' && (
                <div className='px-3 py-1 bg-green-100 rounded-full'>
                  <span className='text-xs font-semibold text-green-700'>Active</span>
                </div>
              )}
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Approved Credits</p>
              <h3 className='text-4xl font-bold text-gray-900 mb-1'>
                {approvedAmount.toFixed(1)} tCO₂
              </h3>
              <p className='text-sm text-gray-600 flex items-center space-x-1'>
                <TrendingUp className='h-4 w-4 text-green-500' />
                <span>Certified and verified</span>
              </p>
            </div>
          </div>

          <div
            onClick={() => setProjectStatus('Pending Approval')}
            className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${projectStatus === 'Pending Approval'
              ? 'shadow-lg'
              : 'shadow-md hover:shadow-lg'
              }`}
          >
            <div className='flex items-center justify-between mb-6'>
              <div className='h-14 w-14 rounded-2xl bg-yellow-100 flex items-center justify-center'>
                <Clock className='h-7 w-7 text-yellow-600' />
              </div>
              {projectStatus === 'Pending Approval' && (
                <div className='px-3 py-1 bg-yellow-100 rounded-full'>
                  <span className='text-xs font-semibold text-yellow-700'>Active</span>
                </div>
              )}
            </div>
            <div>
              <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Pending Approval</p>
              <h3 className='text-4xl font-bold text-gray-900 mb-1'>
                {pendingValue.toFixed(2)} tCO₂
              </h3>
              <p className='text-sm text-gray-600 flex items-center space-x-1'>
                <BarChart3 className='h-4 w-4 text-yellow-500' />
                <span>Under verification</span>
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-3xl p-6 shadow-md mb-10'>
          <div className='flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center'>
            <div className='w-full lg:w-auto'>
              <div className='flex flex-wrap gap-3'>
                {projectTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setActiveFilter(type.id)}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeFilter === type.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <span>{type.name}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeFilter === type.id ? 'bg-green-600' : 'bg-gray-200'
                      }`}>
                      {type.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className='flex items-center space-x-4 w-full lg:w-auto'>
              <input type='text' placeholder='Search projects...' className='flex-1 lg:flex-none px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium text-gray-700' />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className='flex-1 lg:flex-none px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium text-gray-700'
              >
                <option value='all-time'>All Time</option>
                <option value='2024'>2024</option>
                <option value='2023'>2023</option>
              </select>
            </div>
          </div>
        </div>

        <div className='grid gap-6'>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className='group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-500'
            >
              <div className='flex flex-col lg:flex-row'>
                <div className="lg:w-80 h-64 lg:h-auto relative bg-gray-100 overflow-hidden">
                  <img
                    src={project.images[0]}
                    alt={project.projectName}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* overlay nhẹ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>



                <div className='flex-1 p-8'>
                  <div className='flex justify-between items-start mb-6'>
                    <div>
                      <h3 className='text-2xl font-bold text-gray-900 mb-3'>
                        {project.projectName}
                      </h3>
                      <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                        <span className='flex items-center space-x-2'>
                          <MapPin className='h-4 w-4 text-gray-400' />
                          <span>{project.location}</span>
                        </span>
                        <span className='flex items-center space-x-2'>
                          <Calendar className='h-4 w-4 text-gray-400' />
                          <span>Vintage {project.vintage}</span>
                        </span>
                        <span className='flex items-center space-x-2'>
                          <Leaf className='h-4 w-4 text-gray-400' />
                          <span>{project.projectType}</span>
                        </span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-500 font-medium'>
                        {new Date(project.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6'>
                    <div className='bg-gray-50 rounded-2xl p-5'>
                      <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Carbon Credits</p>
                      <p className='text-3xl font-bold text-gray-900'>{project.amount} <span className='text-lg'>tCO₂</span></p>
                    </div>
                    <div className='bg-gray-50 rounded-2xl p-5'>
                      <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Certificate ID</p>
                      <p className='text-xs font-mono text-gray-900 break-all leading-relaxed'>{project.certificateId}</p>
                    </div>
                  </div>

                  <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-100'>
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <div className='h-2 w-2 bg-green-500 rounded-full' />
                      <span className='font-medium'>Environmental Impact: <span className='text-green-700 font-semibold'>{project.amount} tCO₂</span> offset</span>
                    </div>
                    <div className='flex items-center space-x-3 w-full sm:w-auto'>
                      <button
                        onClick={() => handleShare(project)}
                        className='flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-all text-sm font-medium'
                      >
                        <Share2 className='h-4 w-4' />
                        <span>Share</span>
                      </button>
                      <button
                        onClick={() => handleDownloadCertificate(project)}
                        className='flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-100 transition-all text-sm font-medium'
                      >
                        <Eye className='h-4 w-4' />
                        <span>BlockChain Detail</span>
                      </button>
                      <button
                        onClick={() => setSelectedProject(project)}
                        className='flex-1 sm:flex-none bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-600 transition-all flex items-center justify-center space-x-2'
                      >
                        <Eye className='h-4 w-4' />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className='bg-white rounded-3xl p-16 text-center shadow-md'>
            <div className='h-24 w-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
              <Award className='h-12 w-12 text-gray-400' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-3'>No projects found</h3>
            <p className='text-gray-600'>There are no projects that match your current filters.</p>
          </div>
        )}

        {selectedProject && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
            <div className='bg-white rounded-3xl shadow-2xl max-w-4xl w-full m-4'>
              <div className='p-8 relative'>
                <button
                  onClick={() => setSelectedProject(null)}
                  className='absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-all'
                >
                  <X className='h-6 w-6' />
                </button>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  <div className='space-y-6'>
                    <div className='h-80 bg-gray-100 rounded-2xl'>
                      <div className="h-80 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                        <img
                          src={selectedProject.images[0]}
                          alt={selectedProject.projectName}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/600x400?text=No+Image";
                          }}
                          className="max-w-full max-h-full object-contain rounded-xl"
                        />
                      </div>

                    </div>
                    <div>
                      <h4 className='font-bold text-gray-900 mb-2 text-lg flex items-center'>
                        <Users className='h-5 w-5 mr-3' />
                        Project Description
                      </h4>
                      <p className='text-gray-700 leading-relaxed'>{selectedProject.projectDescription}</p>
                    </div>
                  </div>

                  <div className='space-y-6'>
                    <div className='bg-gray-50 rounded-2xl p-6'>
                      <h4 className='font-bold text-gray-900 mb-5 text-xl flex items-center'>
                        <CheckCircle className='h-6 w-6 mr-3' />
                        Project Summary
                      </h4>
                      <div className='space-y-4'>
                        <div className='flex justify-between items-center pb-4 border-b border-gray-200'>
                          <span className='text-gray-600 font-medium'>Carbon Credits</span>
                          <span className='text-2xl font-bold text-gray-900'>{selectedProject.amount} tCO₂</span>
                        </div>
                        <div className='flex justify-between items-center pb-4 border-b border-gray-200'>
                          <span className='text-gray-600 font-medium'>Project Date</span>
                          <span className='font-semibold text-gray-900'>
                            {new Date(selectedProject.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600 font-medium'>BlockChain Hash </span>
                          <span className='font-mono text-xs text-gray-900 bg-white px-3 py-1.5 rounded-lg'>
                            {selectedProject.certificateId.slice(0, 20)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='bg-gray-50 rounded-2xl p-6'>
                      <h4 className='font-bold text-gray-900 mb-4 text-lg flex items-center'>
                        <TrendingUp className='h-5 w-5 mr-3' />
                        Environmental Impact
                      </h4>
                      <div className='space-y-3'>
                        <div className='flex items-center space-x-3'>
                          <div className='h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center'>
                            <Globe className='h-5 w-5 text-white' />
                          </div>
                          <div>
                            <p className='text-sm text-gray-600 font-medium'>CO₂ Reduction</p>
                            <p className='text-xl font-bold text-gray-900'>{selectedProject.amount} tCO₂</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200'>
                  <button
                    onClick={() => handleShare(selectedProject)}
                    className='w-full sm:w-auto px-8 py-3.5 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center space-x-2 font-medium text-gray-700'
                  >
                    <Share2 className='h-5 w-5' />
                    <span>Share Project</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCertificate(selectedProject)}
                    className='w-full sm:w-auto bg-green-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center justify-center space-x-2'
                  >
                    <Eye className='h-5 w-5' />
                    <span>Project Verification</span>
                  </button>
                </div>
              </div>
            </div>
          </div >
        )}
      </div >
    </div >
  );
};

export default Projects;