import React, { useState, useEffect } from 'react';
import { Users, Plus, Eye, Loader2, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCreditExchange.json';


interface User {
  id: string;
  userId: string;  // wallet address
  role: string;
  email?: string;
  createdAt?: string;
}

interface CurrentUser {
  id: string;
  userId: string;
  role: string;
  email?: string;
  name?: string;
}

interface VerifierRole {
  id: string;
  organizationName: string;  // Sửa từ 'name' thành 'organizationName' dựa trên API response
  description?: string;
  version?: number;
  // Thêm các field khác nếu cần
}

const UserManagement: React.FC = () => {
  const [usersByRole, setUsersByRole] = useState<Record<string, User[]>>({
    'USER': [],
    'OWNER': [],
    'VERIFIER': [],
    'GOVERNMENT': [],
    'ADMIN': []
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRole, setActiveRole] = useState('USER');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedVerifierRole, setSelectedVerifierRole] = useState('');  // State cho verifier role
  const [verifierRoles, setVerifierRoles] = useState<VerifierRole[]>([]);  // Danh sách verifier roles
  const [verifierRolesLoading, setVerifierRolesLoading] = useState(true);  // Loading cho verifier roles
  const [submitting, setSubmitting] = useState(false);

  const roles = ['USER', 'OWNER', 'VERIFIER', 'GOVERNMENT', 'ADMIN'];

  const getCurrentUserFromLocalStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const role = user.roleId || user.role;
        setCurrentUser({
          ...user,
          role: role
        });
        console.log('✅ Current user from localStorage:', { ...user, role });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error parsing current user from localStorage:', err);
      return false;
    }
  };

  // Fetch danh sách verifier roles
  const fetchVerifierRoles = async () => {
    try {
      setVerifierRolesLoading(true);
      const response = await api.get('/verifier-role/all');
      const rolesData = Array.isArray(response.data) ? response.data : [];
      setVerifierRoles(rolesData);
      console.log('✅ Fetched verifier roles:', rolesData);
    } catch (err: any) {
      console.error('❌ Failed to fetch verifier roles:', err);
      setVerifierRoles([]);
    } finally {
      setVerifierRolesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching users... Current role:', currentUser?.role);

      if (!currentUser || currentUser.role !== 'ADMIN') {
        setError('Access denied: Admin role required.');
        setLoading(false);
        return;
      }

      // Gọi API song song cho từng role với param ?roleId=${role}
      const promises = roles.map(role => 
        api.get(`/user/all?roleId=${role}`).catch(err => {
          console.warn(`⚠️ Failed to fetch for role ${role}:`, err.response?.status);
          return { data: [] }; // Fallback empty array nếu fail
        })
      );
      const responses = await Promise.all(promises);

      const processedData: Record<string, User[]> = {};
      roles.forEach((role, index) => {
        const users = Array.isArray(responses[index].data) ? responses[index].data : [];
        processedData[role] = users
          .filter((u: any) => u && u.isActive)
          .map((u: any) => ({
            id: u.id,
            userId: u.id,  // id chính là wallet address
            role: u.roleId,
            email: u.email,
            createdAt: u.createdAt
          }));
      });
      console.log('✅ Processed users by role:', processedData);
      setUsersByRole(processedData);
    } catch (err: any) {
      console.error('❌ Overall fetch error:', err.response?.status, err.response?.data);
      if (err.response?.status === 403) {
        setError('Failed to load users (403). Check backend permissions.');
      } else if (err.response?.status === 400) {
        setError('Invalid request (400). Ensure roleId param is correct.');
      } else {
        setError('Failed to load users: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUserFromLocalStorage();
    fetchVerifierRoles();  // Fetch verifier roles ngay khi component mount
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    } else {
      setLoading(false);
      setError('No user data found. Please login again.');
    }
  }, [currentUser]);

   const handleAddMember = async () => {
      const trimmedUserId = newUserId.trim();
      if (!trimmedUserId || !newRoleName || !ethers.isAddress(trimmedUserId)) {
        alert('Invalid wallet address or role selected.');
        return;
      }
      setSubmitting(true);
      let txHash = null;
      try {
        // Validate env
        // const contractAddress = import.meta.env.ADDRESS_CARBONCREDIT;
        const contractAddress = '0x7C96A93a6278308191b607BDd26fadE0efCc6809';
        console.log('🔑 CONTRACT ADDR:', contractAddress || '❌ UNDEFINED!');
        if (!contractAddress || !ethers.isAddress(contractAddress)) {
          throw new Error('Contract address not configured. Check ADDRESS_CARBONCREDIT in .env.');
        }
  
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, CarbonCreditEx.abi, signer);
  
        // Execute on-chain based on role
        let tx;
        if (newRoleName === 'VERIFIER') {
          tx = await contract.verifyOrganization(trimmedUserId);
        } else if (newRoleName === 'GOVERNMENT') {
          tx = await contract.addGovernment(trimmedUserId);
        } else if (newRoleName === 'ADMIN') {
          tx = await contract.addAdmin(trimmedUserId);
        } else {
          throw new Error(`Unsupported role: ${newRoleName}`);
        }
  
        // Wait for confirmation (optional: add gas limit nếu cần)
        console.log('Tx sent:', tx.hash);
        const receipt = await tx.wait(1); // Wait 1 confirmation
        txHash = tx.hash;
        console.log('Tx confirmed:', receipt);
  
        // Now call API to add role (only if on-chain success)
        await api.post('/role-request/add-role', { userId: trimmedUserId, roleName: newRoleName });
        setShowAddMemberPopup(false);
        setNewUserId('');
        setNewRoleName('');
        fetchVerifierRoles();
        alert(`Member added successfully! Tx hash: ${txHash.slice(0, 10)}...`);
      } catch (err: any) {
        console.error('Add member error:', err);
        if (err.code === 'INVALID_ARGUMENT') {
          alert('Contract setup error: Invalid address. Check console.');
        } else if (err.code === 'ACTION_REJECTED') {
          alert('User rejected the transaction.');
        } else if (err.reason || err.message) {
          alert(`Blockchain failed: ${err.reason || err.message}`);
        } else {
          alert(`Add failed: ${err.message}`);
        }
        // Revert API if tx partial success (optional, tùy logic)
      } finally {
        setSubmitting(false);
      }
    };

  // Reset verifier role khi thay đổi newRoleName
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewRoleName(e.target.value);
    if (e.target.value !== 'VERIFIER') {
      setSelectedVerifierRole('');  // Reset nếu không phải VERIFIER
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
  };

  const shortenWallet = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';

  if (loading && !currentUser) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64 space-y-4">
        <Shield className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">No User Data</h3>
          <p className="text-sm text-gray-500">Please login again.</p>
        </div>
      </div>
    );
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="flex justify-center items-center h-64 space-y-4">
        <Shield className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-sm text-gray-500">Admin role required.</p>
          <p className="text-sm text-gray-500">Your role: {currentUser.role}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  }

  const currentUsers = usersByRole[activeRole] || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setShowAddMemberPopup(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex-1 ${
              activeRole === role
                ? 'bg-white shadow-sm text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {role}
            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {usersByRole[role]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
          <button onClick={fetchUsers} className="ml-2 text-red-600 hover:underline">Retry</button>
        </div>
      )}

      {currentUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No users in {activeRole} role.
        </div>
      ) : (
        <div className="grid gap-4">
          {currentUsers.map((user) => (
            <div key={user.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.userId ? user.userId.slice(0, 2).toUpperCase() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Wallet: {shortenWallet(user.userId)}</h4>
                    <p className="text-sm text-gray-600">Role: {user.role}</p>
                    {user.email && <p className="text-sm text-gray-500">Email: {user.email}</p>}
                    {user.createdAt && <p className="text-sm text-gray-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewUser(user)}
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
      )}

      {/* Add Member Popup */}
      {showAddMemberPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Member</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
              <input
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={newRoleName}
                onChange={handleRoleChange}  // Sử dụng handler tùy chỉnh
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Role</option>
                <option value="VERIFIER">Verifier</option>
                <option value="GOVERNMENT">Government</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {/* Sub-select cho Verifier Role - chỉ hiện khi chọn VERIFIER */}
            {newRoleName === 'VERIFIER' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Verifier Role</label>
                {verifierRolesLoading ? (
                  <div className="flex justify-center p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="ml-2 text-sm text-gray-500">Loading verifier roles...</span>
                  </div>
                ) : verifierRoles.length === 0 ? (
                  <p className="text-sm text-red-500">No verifier roles available.</p>
                ) : (
                  <select
                    value={selectedVerifierRole}
                    onChange={(e) => setSelectedVerifierRole(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Verifier Role</option>
                    {verifierRoles.map((vr) => (
                      <option key={vr.id} value={vr.id}>
                        {vr.organizationName}  {/* Sửa từ vr.name thành vr.organizationName */}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleAddMember}
                disabled={!newUserId.trim() || !newRoleName || (newRoleName === 'VERIFIER' && !selectedVerifierRole) || submitting || verifierRolesLoading}
                className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 flex items-center space-x-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Add</span>
              </button>
              <button 
                onClick={() => {
                  setShowAddMemberPopup(false);
                  setNewUserId('');
                  setNewRoleName('');
                  setSelectedVerifierRole('');
                }} 
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Wallet: {shortenWallet(selectedUser.userId)}</h3>
                  <p className="text-sm text-gray-600">Role: {selectedUser.role}</p>
                  {selectedUser.email && <p className="text-sm text-gray-500">Email: {selectedUser.email}</p>}
                  {selectedUser.createdAt && <p className="text-sm text-gray-500">Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>}
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;