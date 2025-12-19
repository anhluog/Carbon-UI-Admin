import React, { useState } from 'react';
import { Users, Plus, Edit3, Eye, CheckCircle } from 'lucide-react';

const VerifyRole: React.FC = () => {
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [roleToVerify, setRoleToVerify] = useState<any>(null);

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

  const handleOpenRejectionPopup = (member: any) => {
    setRoleToVerify(member);
    setShowRejectionPopup(true);
  };

  const handleCloseRejectionPopup = () => {
    setRoleToVerify(null);
    setShowRejectionPopup(false);
    setRejectionReason('');
  };

  const handleReject = () => {
    if (rejectionReason.trim() === '') return;
    console.log(`Role for ${roleToVerify.name} rejected with reason: ${rejectionReason}`);
    handleCloseRejectionPopup();
  };

  const handleAccept = (member: any) => {
    console.log(`Role for ${member.name} accepted`);
  };

  const handleViewRole = (member: any) => {
    setSelectedRole(member);
  };

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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAccept(member)}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => handleOpenRejectionPopup(member)}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4 text-red-600" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleViewRole(member)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showRejectionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
                <h2 className="text-xl font-bold mb-4">Reject Role</h2>
                <p className="mb-4">Please provide a reason for rejecting this role.</p>
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

      {selectedRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedRole.name}</h3>
                  <p className="text-sm text-gray-600">{selectedRole.role}</p>
                  <p className="text-sm text-gray-500">{selectedRole.email}</p>
                </div>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Permissions</h4>
                  <p className="text-sm text-gray-600">{selectedRole.permissions}</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyRole;