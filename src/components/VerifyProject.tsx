import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Eye, MapPin, CheckCircle, Calendar, X } from 'lucide-react';
import api from '../utils/axiosInstance';  // Import axios instance từ utils

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

const VerifyProject: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToVerify, setProjectToVerify] = useState<Project | null>(null);
  const [showAcceptPopup, setShowAcceptPopup] = useState(false);
  const [acceptCredits, setAcceptCredits] = useState<number | ''>('');
  const [projectToAccept, setProjectToAccept] = useState<Project | null>(null);
  const [approvedProjects, setApprovedProjects] = useState<boolean>(false);
  


const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/projects/ProjectSubmited'); 
      console.log('Fetched projects for verification:', response.data);
      // Safe: Đảm bảo array, filter item undefined
    
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access denied: Admin role required.');
      } else if (err.response?.status === 404) {
        setError('Endpoint not found – Check backend.');
      } else {
        setError('Failed to load: ' + (err.response?.data?.message || err.message));
      }
      setProjects([]);  // Safe: Set empty array on error
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
       await api.post(`/projects/${projectToVerify.id}/verify`, {
        approved: false,
        reason: rejectionReason
      });
      
      console.log(`Project ${projectToVerify.name} rejected with reason: ${rejectionReason}`);
      fetchRequests();
      // Optionally refetch projects after rejection
      // await fetchProjects(); // Uncomment if refetch needed
    } catch (err) {
      console.error('Rejection failed:', err);
    }
    handleCloseRejectionPopup();
  };

  const handleConfirmAccept = async () => {
    if (!projectToAccept || !acceptCredits) return;
    try {
      await api.post(`/projects/${projectToAccept.id}/verify`, {
        approved: true,
        expectedCredits: acceptCredits,
      });

      setShowAcceptPopup(false);
      setProjectToAccept(null);
      setAcceptCredits('');

      // reload danh sách
      fetchRequests();
    } catch (err) {
      console.error('Accept failed:', err);
      alert('Accept project failed');
    }
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
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setProjectToAccept(project);
                      setAcceptCredits(project.expectedCredits); // gợi ý mặc định
                      setShowAcceptPopup(true);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center space-x-2"
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
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedProject.type}
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
          {showAcceptPopup && projectToAccept && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Accept Project</h2>
            <button
              onClick={() => setShowAcceptPopup(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Enter issued credits for <b>{projectToAccept.name}</b>
          </p>

          <input
            type="number"
            min={1}
            max={projectToAccept.expectedCredits}
            value={acceptCredits}
            onChange={(e) => setAcceptCredits(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-green-500"
            placeholder="Issued credits"
          />

          <p className="text-sm text-gray-500 mb-4">
            Expected credits: {projectToAccept.expectedCredits}
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowAcceptPopup(false)}
              className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAccept}
              disabled={!acceptCredits || acceptCredits <= 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Confirm Accept
            </button>
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