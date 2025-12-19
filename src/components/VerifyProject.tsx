import React, { useState } from 'react';
import { Plus, Edit3, Eye, MapPin } from 'lucide-react';

const VerifyProject: React.FC = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);

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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status}
                </span>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit3 className="h-4 w-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="h-4 w-4 text-gray-600" />
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
    </div>
  );
};

export default VerifyProject;