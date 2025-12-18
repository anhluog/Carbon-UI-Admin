import React, { useState } from 'react';
import { Building2, Users, Award, Settings, Plus, Edit3, Eye, BarChart3, MapPin } from 'lucide-react';

interface ManageOrgProps {
  walletAddress: string;
}

const ManageOrg: React.FC<ManageOrgProps> = ({ walletAddress }) => {
  const [activeView, setActiveView] = useState('overview');
  const [showCreateProject, setShowCreateProject] = useState(false);

  const organization = {
    name: 'Green Future Solutions',
    type: 'Carbon Project Developer',
    established: '2020',
    location: 'São Paulo, Brazil',
    certification: 'VCS Verified',
    totalCredits: '12,450 tCO₂',
    activeProjects: 8,
    revenue: '$287,350'
  };

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

  const teamMembers = [
    {
      name: 'Maria Santos',
      role: 'Project Director',
      email: 'maria@greenfuture.com',
      permissions: 'Full Access'
    },
    {
      name: 'João Silva',
      role: 'Environmental Analyst',
      email: 'joao@greenfuture.com',
      permissions: 'Project Management'
    },
    {
      name: 'Ana Costa',
      role: 'Finance Manager',
      email: 'ana@greenfuture.com',
      permissions: 'Financial Access'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="h-8 w-8 text-green-600" />
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
              Active
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{organization.activeProjects}</h3>
          <p className="text-sm text-gray-600">Active Projects</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <Award className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{organization.totalCredits}</h3>
          <p className="text-sm text-gray-600">Total Credits</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{organization.revenue}</h3>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{teamMembers.length}</h3>
          <p className="text-sm text-gray-600">Team Members</p>
        </div>
      </div>

      {/* Organization Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Organization Name:</span>
              <span className="font-medium text-gray-900">{organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900">{organization.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Established:</span>
              <span className="font-medium text-gray-900">{organization.established}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium text-gray-900">{organization.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Certification:</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                {organization.certification}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New project created</p>
                <p className="text-xs text-gray-500">Wind Power Mexico - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Award className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Credits verified</p>
                <p className="text-xs text-gray-500">Amazon Project - 1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Team member added</p>
                <p className="text-xs text-gray-500">Ana Costa joined - 3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
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

  const renderTeam = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Team Management</h3>
        <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Member</span>
        </button>
      </div>

      <div className="grid gap-4">
        {teamMembers.map((member, index) => (
          <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.role}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {member.permissions}
                </span>
                <div className="flex items-center space-x-2 mt-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit3 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const views = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'projects', name: 'Projects', icon: Building2 },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Management</h2>
        <p className="text-gray-600">Manage your organization, projects, and team members.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-green-200">
        <div className="flex space-x-2">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === view.id
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{view.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeView === 'overview' && renderOverview()}
      {activeView === 'projects' && renderProjects()}
      {activeView === 'team' && renderTeam()}
      {activeView === 'settings' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h3>
          <p className="text-gray-600">Settings panel coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default ManageOrg;