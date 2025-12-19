import React, { useState } from 'react';
import { Plus, Edit3, Eye, MapPin, CheckCircle, Calendar } from 'lucide-react';

const VerifyProject: React.FC = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectToVerify, setProjectToVerify] = useState<any>(null);

  const projects = [
    {
      id: 1,
      name: 'Amazon Rainforest Conservation',
      type: 'Forest Protection',
      status: 'Active',
      credits: '5,240 tCO₂',
      sold: '3,890 tCO₂',
      price: '$2.31',
      location: 'Brazil',
      vintage: 2024
    },
    {
      id: 2,
      name: 'Solar Energy Farm Thailand',
      type: 'Renewable Energy',
      status: 'Active',
      credits: '3,120 tCO₂',
      sold: '2,150 tCO₂',
      price: '$2.45',
      location: 'Thailand',
      vintage: 2024
    },
    {
      id: 3,
      name: 'Wind Power Mexico',
      type: 'Renewable Energy',
      status: 'Pending',
      credits: '2,890 tCO₂',
      sold: '0 tCO₂',
      price: '$2.28',
      location: 'Mexico',
      vintage: 2024
    }
  ];

  const handleOpenRejectionPopup = (project: any) => {
    setProjectToVerify(project);
    setShowRejectionPopup(true);
  };

  const handleCloseRejectionPopup = () => {
    setProjectToVerify(null);
    setShowRejectionPopup(false);
    setRejectionReason('');
  };

  const handleReject = () => {
    if (rejectionReason.trim() === '') return;
    // Handle rejection logic here
    console.log(`Project ${projectToVerify.name} rejected with reason: ${rejectionReason}`);
    handleCloseRejectionPopup();
  };

  const handleAccept = (project: any) => {
    // Handle acceptance logic here
    console.log(`Project ${project.name} accepted`);
  };

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
  };

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
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="font-semibold text-gray-900">{project.credits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Sold</p>
                <p className="font-semibold text-gray-900">{project.sold}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price per CCT</p>
                <p className="font-semibold text-gray-900">{project.price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="font-semibold text-gray-900">
                  ${(parseFloat(project.sold.replace(/[^\d.]/g, '')) * parseFloat(project.price.replace('$', ''))).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showRejectionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
                <h2 className="text-xl font-bold mb-4">Reject Project</h2>
                <p className="mb-4">Please provide a reason for rejecting this project.</p>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason"
                    className="w-full p-2 border rounded mb-4"
                />
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={handleReject}
                        disabled={rejectionReason.trim() === ''}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400"
                    >
                        Reject
                    </button>
                    <button onClick={handleCloseRejectionPopup} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
                        Cancel
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
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Project Details</h4>
                  <p className="text-sm text-gray-600">No description available for this project. Details are shown as available.</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-3">Credit Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Total Credits:</span>
                        <span className="font-medium text-green-900">{selectedProject.credits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Sold:</span>
                        <span className="font-medium text-green-900">{selectedProject.sold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Price per CCT:</span>
                        <span className="font-medium text-green-900">{selectedProject.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Status:</span>
                        <span className="font-medium text-green-900">{selectedProject.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyProject;