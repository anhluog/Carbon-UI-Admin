// components/VerifyProject.tsx - Tối ưu load API: Fetch all data một lần ban đầu, cache theo tab, switch nhanh
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Leaf, TrendingUp, Filter, Share2, Eye, BarChart3, Globe, Users, CheckCircle, X, Clock, Edit3 } from 'lucide-react';
import api from '../utils/axiosInstance';

const fetchIpfsMetadata = async (ipfsHash: string) => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch IPFS metadata failed:', ipfsHash, err);
    return null;
  }
};

interface VerifyProjectProps {
  onOpenProjectDetail?: (projectId: string) => void;
}

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
  issueAmount?: number; // Thêm để tương thích với Projects
  status: string;
  createdAt: string;
  updatedAt: string;
  nftTokenId?: string; // Thêm nếu cần
}

const VerifyProject: React.FC<VerifyProjectProps> = ({ onOpenProjectDetail }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');
  const [processingProjects, setProcessingProjects] = useState<Array<any>>([]); // Cache cho processing
  const [processedProjects, setProcessedProjects] = useState<Array<any>>([]); // Cache cho processed
  const [projects, setProjects] = useState<Array<any>>([]); // Thêm state cho projects hiện tại
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true); // Để phân biệt load ban đầu

  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [projectToVerify, setProjectToVerify] = useState<Project | null>(null);
  const [showAcceptPopup, setShowAcceptPopup] = useState(false);
  const [acceptCredits, setAcceptCredits] = useState<number | ''>('');
  const [projectToAccept, setProjectToAccept] = useState<Project | null>(null);

  // Add Member states
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [userId, setUserId] = useState('');
  const [roleName, setRoleName] = useState('');

  // Helper: Map project data
  const mapProjectData = async (projectsData: any[]) => {
    return await Promise.all(
      projectsData.map(async (p: any) => {
        let thumbnailUrl = 'https://via.placeholder.com/400x300?text=No+Image';
        if (p.ipfsHash) {
          const metadata = await fetchIpfsMetadata(p.ipfsHash);
          if (metadata?.images && Array.isArray(metadata.images) && metadata.images.length > 0) {
            thumbnailUrl = metadata.images[0].replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
          } else if (metadata?.image) {
            thumbnailUrl = metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
          }
        }

        return {
          id: p.id,
          nftTokenId: p.nftTokenId,
          projectName: p.name,
          projectType: mapProjectType(p.type),
          location: p.location,
          vintage: p.vintage,
          expectedCredits: p.expectedCredits ?? 0,
          issuedAmount: p.issueAmount ?? 0,
          availableToMint: (p.expectedCredits ?? 0) - (p.issueAmount ?? 0),
          date: p.createdAt,
          certificateId: p.onchainHash,
          projectDescription: p.description,
          images: [thumbnailUrl],
          status: mapStatus(p.status),
        };
      })
    );
  };

  // Fetch processing projects (SUBMITTED)
  const fetchProcessingProjects = async () => {
    try {
      const res = await api.get('/projects/verifier-project?status=SUBMITTED');
      const mapped = await mapProjectData(res.data || []);
      setProcessingProjects(mapped);
    } catch (e) {
      console.error('Load processing projects failed', e);
      setProcessingProjects([]);
    }
  };

  // Fetch processed projects (multiple statuses)
  const fetchProcessedProjects = async () => {
    try {
      const processedStatuses = ['VERIFIED', 'REJECTED_BY_VERIFIER', 'APPROVED', 'REJECTED_BY_GOV'];
      const responses = await Promise.all(
        processedStatuses.map(status => api.get(`/projects/verifier-project?status=${status}`))
      );
      const allData = responses.flatMap(res => res.data || []);
      const mapped = await mapProjectData(allData);
      setProcessedProjects(mapped);
    } catch (e) {
      console.error('Load processed projects failed', e);
      setProcessedProjects([]);
    }
  };

  // Load all data ban đầu (parallel để nhanh)
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchProcessingProjects(), fetchProcessedProjects()]);
    setInitialLoad(false);
    setLoading(false);
  };

  // useEffect: Load all data chỉ lần đầu
  useEffect(() => {
    loadAllData();
  }, []);

  // useEffect: Switch projects khi tab thay đổi (không refetch, chỉ switch cache)
  useEffect(() => {
    // Loại bỏ if (!initialLoad) để đảm bảo setProjects chạy cả khi load ban đầu (khi cache update)
    const currentProjects = activeTab === 'processing' ? processingProjects : processedProjects;
    setProjects(currentProjects);
  }, [activeTab, processingProjects, processedProjects]);

  // Refetch all khi cần (sau accept/reject)
  const refetchAll = async () => {
    setInitialLoad(true); // Trigger reload
    await loadAllData();
  };

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
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Waiting for Review';
      case 'VERIFIED':
        return 'Waiting for Approval';
      case 'REJECTED_BY_VERIFIER':
        return 'Rejected by Verifier';
      case 'REJECTED_BY_GOV':
        return 'Rejected by Government';
      case 'APPROVED':
        return 'Issued';
      default:
        return 'Unknown';
    }
  };

  // Tính tổng từ cache tương ứng
  const processingValue = processingProjects.reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);
  const processedValue = processedProjects.reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

  // projectTypes dựa trên projects hiện tại
  const projectTypes = [
    { id: 'all', name: 'All Projects', count: projects.length },
    { id: 'forest', name: 'Forest Protection', count: projects.filter(p => p.projectType === 'Forest Protection').length },
    { id: 'renewable', name: 'Renewable Energy', count: projects.filter(p => p.projectType === 'Renewable Energy').length },
    { id: 'efficiency', name: 'Energy Efficiency', count: projects.filter(p => p.projectType === 'Energy Efficiency').length },
  ];

  // filteredProjects chỉ filter type + time
  const filteredProjects = projects.filter(project => {
    const matchesType = activeFilter === 'all' ||
      (activeFilter === 'forest' && project.projectType === 'Forest Protection') ||
      (activeFilter === 'renewable' && project.projectType === 'Renewable Energy') ||
      (activeFilter === 'efficiency' && project.projectType === 'Energy Efficiency');

    const matchesTime = timeFilter === 'all-time' ||
      (timeFilter === '2024' && project.vintage === 2024) ||
      (timeFilter === '2023' && project.vintage === 2023);

    return matchesType && matchesTime;
  });

  const handleOpenRejectionPopup = (project: any) => {
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
      await api.post(`/projects/${projectToVerify.id}/verify`, {
        approved: false,
        reason: rejectionReason
      });
      console.log(`Project ${projectToVerify.projectName} rejected with reason: ${rejectionReason}`);
      await refetchAll(); // Refetch all và update cache
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Rejection failed');
    }
    handleCloseRejectionPopup();
  };

  const handleConfirmAccept = async () => {
    if (!projectToAccept || !acceptCredits || acceptCredits <= 0) return;
    try {
      await api.post(`/projects/${projectToAccept.id}/verify`, {
        approved: true,
        expectedCredits: acceptCredits,
      });
      setShowAcceptPopup(false);
      setProjectToAccept(null);
      setAcceptCredits('');
      await refetchAll(); // Refetch all và update cache
    } catch (err) {
      console.error('Accept failed:', err);
      alert('Accept project failed');
    }
  };

  const handleViewProject = (project: any) => {
    onOpenProjectDetail?.(project.id);
  };

  const handleAccept = (project: any) => {
    setProjectToAccept(project);
    setAcceptCredits(project.expectedCredits); // Gợi ý mặc định
    setShowAcceptPopup(true);
  };

  // Handle Add Member
  const handleAddMember = async () => {
    if (!userId.trim() || !roleName.trim()) {
      alert('Please enter both user address and role name');
      return;
    }
    try {
      await api.post('/api/role-request/add-role', {
        userId: userId.trim(),
        roleName: roleName.trim()
      });
      alert('Role added successfully');
      setShowAddMemberPopup(false);
      setUserId('');
      setRoleName('');
    } catch (err) {
      console.error('Add role failed:', err);
      alert('Failed to add role');
    }
  };

  const handleCloseAddMemberPopup = () => {
    setShowAddMemberPopup(false);
    setUserId('');
    setRoleName('');
  };

  if (loading && initialLoad) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <div className='flex justify-between items-center mb-12'>
          <div className='flex items-center space-x-3'>
            <div className='h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg'>
              <Leaf className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-4xl font-bold text-gray-900'>Project Verification</h1>
              <p className='text-lg text-gray-600 mt-1'>Manage and verify carbon credit projects</p>
            </div>
          </div>
          <div className='flex space-x-3'>
            <button className='flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium'>
              <Plus className='h-5 w-5' />
              <span>New Project</span>
            </button>
            <button
              onClick={() => setShowAddMemberPopup(true)}
              className='flex items-center space-x-2 px-5 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium'
            >
              <Users className='h-5 w-5' />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        {/* Summary Cards với nút tab tích hợp */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-10'>
          {/* Card Processing Total - Tab "Processing" (SUBMITTED) */}
          <div className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${activeTab === 'processing' ? 'shadow-lg border-2 border-yellow-200' : 'shadow-md hover:shadow-lg'}`}>
            <div className='flex items-center justify-between mb-6'>
              <div className='h-14 w-14 rounded-2xl bg-yellow-100 flex items-center justify-center'>
                <Clock className='h-7 w-7 text-yellow-600' />
              </div>
              <div className={`px-3 py-1 rounded-full ${activeTab === 'processing' ? 'bg-yellow-100 text-yellow-700 font-semibold' : 'bg-gray-100 text-gray-500 text-xs'}`}>
                Processing
              </div>
            </div>
            <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Processing Total</p>
            <h3 className='text-4xl font-bold text-gray-900 mb-1'>{processingValue.toFixed(0)} tCO₂</h3>
            <p className='text-sm text-gray-600 flex items-center space-x-1 mb-4'><BarChart3 className='h-4 w-4 text-yellow-500' /><span>Under review</span></p>
            <button
              onClick={() => setActiveTab('processing')}
              className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'processing' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
            >
              View Processing Projects
            </button>
          </div>

          {/* Card Processed Projects Total - Tab "Processed" (others) */}
          <div className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${activeTab === 'processed' ? 'shadow-lg border-2 border-green-200' : 'shadow-md hover:shadow-lg'}`}>
            <div className='flex items-center justify-between mb-6'>
              <div className='h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center'>
                <CheckCircle className='h-7 w-7 text-green-600' />
              </div>
              <div className={`px-3 py-1 rounded-full ${activeTab === 'processed' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-500 text-xs'}`}>
                Processed
              </div>
            </div>
            <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Processed Total</p>
            <h3 className='text-4xl font-bold text-gray-900 mb-1'>{processedValue.toFixed(0)} tCO₂</h3>
            <p className='text-sm text-gray-600 flex items-center space-x-1 mb-4'><TrendingUp className='h-4 w-4 text-green-500' /><span>Issued & Rejected</span></p>
            <button
              onClick={() => setActiveTab('processed')}
              className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'processed' ? 'bg-green-500 text-white shadow-lg' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            >
              View Processed Projects
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-3xl p-6 shadow-md mb-10'>
          <div className='flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center'>
            <div className='flex flex-wrap gap-3'>
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveFilter(type.id)}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeFilter === type.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {type.name} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeFilter === type.id ? 'bg-green-600' : 'bg-gray-200'}`}>{type.count}</span>
                </button>
              ))}
            </div>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className='px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 font-medium text-gray-700'>
              <option value='all-time'>All Time</option>
              <option value='2024'>2024</option>
              <option value='2023'>2023</option>
            </select>
          </div>
        </div>

        {/* Project List */}
        <div className='grid gap-6'>
          {filteredProjects.map((project) => (
            <div key={project.id} className='group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-500'>
              <div className='flex flex-col lg:flex-row'>
                <div className="lg:w-80 h-64 lg:h-auto relative bg-gray-100 overflow-hidden">
                  <img src={project.images[0]} alt={project.projectName} loading="lazy" onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>

                <div className='flex-1 p-8'>
                  <div className='flex justify-between items-start mb-6'>
                    <div>
                      <h3 className='text-2xl font-bold text-gray-900 mb-3'>{project.projectName}</h3>
                      <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                        <span className='flex items-center space-x-2'><MapPin className='h-4 w-4 text-gray-400' /><span>{project.location}</span></span>
                        <span className='flex items-center space-x-2'><Calendar className='h-4 w-4 text-gray-400' /><span>Vintage {project.vintage}</span></span>
                        <span className='flex items-center space-x-2'><Leaf className='h-4 w-4 text-gray-400' /><span>{project.projectType}</span></span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm text-gray-500 font-medium'>
                        {new Date(project.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6'>
                    <div className='bg-gray-50 rounded-2xl p-5'>
                      <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Expected Credits</p>
                      <p className='text-3xl font-bold text-gray-900'>{project.expectedCredits} <span className='text-lg'>tCO₂</span></p>
                    </div>
                    <div className='bg-gray-50 rounded-2xl p-5'>
                      <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Issued</p>
                      <p className='text-3xl font-bold text-gray-900'>{project.issuedAmount} <span className='text-lg'>tCO₂</span></p>
                    </div>
                  </div>

                  <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-100'>
                    <div className='flex items-center space-x-2 text-sm text-gray-600'>
                      <div className={`h-2 w-2 rounded-full ${project.status === 'Waiting for Review' ? 'bg-yellow-500' : project.status === 'Issued' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className='font-medium'>Status: <span className={`font-semibold ${project.status === 'Waiting for Review' ? 'text-yellow-700' : project.status === 'Issued' ? 'text-green-700' : 'text-red-700'}`}>{project.status}</span></span>
                    </div>
                    <div className='flex items-center space-x-3 w-full sm:w-auto'>
                      {/* Chỉ show Accept/Reject nếu SUBMITTED (Waiting for Review) */}
                      {project.status === 'Waiting for Review' && (
                        <>
                          <button onClick={() => handleAccept(project)} className="flex items-center space-x-2 px-4 py-2.5 border rounded-xl hover:bg-gray-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Accept</span>
                          </button>
                          <button onClick={() => handleOpenRejectionPopup(project)} className="flex items-center space-x-2 px-4 py-2.5 border rounded-xl hover:bg-gray-50">
                            <Edit3 className="h-4 w-4 text-red-600" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      <button onClick={() => handleViewProject(project)} className='bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-600 transition-all flex items-center justify-center space-x-2'>
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
              <CheckCircle className='h-12 w-12 text-gray-400' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-3'>No projects found</h3>
            <p className='text-gray-600'>There are no projects that match your current filters.</p>
          </div>
        )}

        {/* Rejection Popup */}
        {showRejectionPopup && projectToVerify && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Reject Project</h2>
                <button onClick={handleCloseRejectionPopup} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-4 text-gray-600">Please provide a reason for rejecting "{projectToVerify.projectName}".</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-gray-300 rounded-xl mb-4 resize-vertical focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
              <div className="flex justify-end space-x-3">
                <button onClick={handleCloseRejectionPopup} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  disabled={rejectionReason.trim() === ''}
                  onClick={handleReject}
                  className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accept Popup */}
        {showAcceptPopup && projectToAccept && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Accept Project</h2>
                <button onClick={() => setShowAcceptPopup(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">Enter issued credits for <b>{projectToAccept.projectName}</b></p>
              <input
                type="number"
                min={1}
                max={projectToAccept.expectedCredits}
                value={acceptCredits}
                onChange={(e) => setAcceptCredits(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none mb-4"
                placeholder="Issued credits"
              />
              <p className="text-sm text-gray-500 mb-4">Expected credits: {projectToAccept.expectedCredits}</p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowAcceptPopup(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  disabled={!acceptCredits || acceptCredits <= 0}
                  onClick={handleConfirmAccept}
                  className="px-6 py-2.5 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50"
                >
                  Confirm Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Popup */}
        {showAddMemberPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Member Role</h2>
                <button onClick={handleCloseAddMemberPopup} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User Address (e.g., 0xc7ba0ae66b3df7237562b5ba7d9b4210f0c0d79e)"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Role Name (e.g., ADMIN)"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseAddMemberPopup}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!userId.trim() || !roleName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  Add Role
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyProject;