import React, { useState } from 'react';
import { Building2, Users, Award, Settings, BarChart3 } from 'lucide-react';

interface ManageOrgProps {
  walletAddress: string;
}

const ManageOrg: React.FC<ManageOrgProps> = ({ walletAddress }) => {
  const [activeView, setActiveView] = useState('overview');

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
    </div>
  );

  const views = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
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
