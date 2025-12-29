import React from 'react';
import { Eye } from 'lucide-react';

interface ReviewProjectProps {
  project: any;
  onClose: () => void;
}

const ReviewProject: React.FC<ReviewProjectProps> = ({ project, onClose }) => {

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.projectName}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <span>{project.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>Vintage {project.vintage}</span>
                </span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  Pending Review
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
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
                src={project.images[0]}
                alt={project.projectName}
                className="w-full h-64 rounded-xl object-cover mb-4"
              />
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Project Description</h4>
                <p className="text-sm text-gray-600">{project.projectDescription}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-900 mb-3">Investment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Total Investment:</span>
                    <span className="font-medium text-yellow-900">${project.totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Status:</span>
                    <span className="font-medium text-yellow-900">Pending Review</span>
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
                    <span className="text-blue-700">Type Project:</span>
                    <span className="font-medium text-blue-900">{project.methodology}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Additional Certs:</span>
                    <span className="font-medium text-blue-900">{project.additionalCertifications.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>View Project Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewProject;
