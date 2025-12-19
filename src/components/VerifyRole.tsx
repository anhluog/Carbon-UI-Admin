import React from 'react';
import { Users, Plus, Edit3, Settings } from 'lucide-react';

const VerifyRole: React.FC = () => {
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

  return (
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
};

export default VerifyRole;