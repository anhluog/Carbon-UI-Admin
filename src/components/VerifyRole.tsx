import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Eye, CheckCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCreditExchange.json';

interface RoleRequest {
  id: string;
  userId: string;  
  requestedRole: string;
  reason?: string;
  status: string;
}

const VerifyRole: React.FC = () => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [requestToVerify, setRequestToVerify] = useState<RoleRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      console.log("🚀 Calling API with token:", localStorage.getItem("token"));
      const response = await api.get('/role-request/request-confirm');
      // Safe: Đảm bảo array, filter item undefined
      const safeData = Array.isArray(response.data) ? response.data.filter((r: any) => r && r.id && r.requestedRole) : [];
      setRequests(safeData as RoleRequest[]);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Access denied: Admin role required.');
      } else if (err.response?.status === 404) {
        setError('Endpoint not found – Check backend.');
      } else {
        setError('Failed to load: ' + (err.response?.data?.message || err.message));
      }
      setRequests([]);  // Safe: Set empty array on error
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenRejectionPopup = (request: RoleRequest) => {
    setRequestToVerify(request);
    setRejectionReason('');
    setShowRejectionPopup(true);
  };

  const handleCloseRejectionPopup = () => {
    setRequestToVerify(null);
    setShowRejectionPopup(false);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!requestToVerify || rejectionReason.trim() === '') return;
    setSubmitting(true);
    try {
      await api.put(`/role-request/reject/${requestToVerify.id}?reason=${encodeURIComponent(rejectionReason)}`);
      setRequests(prev => prev.filter(r => r.id !== requestToVerify.id));
      handleCloseRejectionPopup();
      alert('Rejected! Email sent.');
    } catch (err: any) {
      alert('Reject failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    const trimmedUserId = newUserId.trim();
    if (!trimmedUserId || !newRoleName || !ethers.isAddress(trimmedUserId)) {
      alert('Invalid wallet address or role selected.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/role-request/add-role', { userId: trimmedUserId, roleName: newRoleName });
      setShowAddMemberPopup(false);
      setNewUserId('');
      setNewRoleName('');
      fetchRequests();
      alert('Member added successfully!');
    } catch (err: any) {
      alert('Add failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (request: RoleRequest) => {
  if (!request.userId) {
    alert('Invalid user ID (wallet address).');
    setSubmitting(false);
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
    if (request.requestedRole === 'VERIFIER') {
      tx = await contract.verifyOrganization(request.userId);
    } else if (request.requestedRole === 'GOVERNMENT') {
      tx = await contract.addGovernment(request.userId);
    }else if (request.requestedRole === 'ADMIN') {
      tx = await contract.addAdmin(request.userId);
    }
     else  {
      throw new Error(`Unsupported role: ${request.requestedRole}`);
    }

    // Wait for confirmation (optional: add gas limit nếu cần)
    console.log('Tx sent:', tx.hash);
    const receipt = await tx.wait(1); // Wait 1 confirmation
    txHash = tx.hash;
    console.log('Tx confirmed:', receipt);

    // Now call API to approve (only if on-chain success)
    await api.put(`/role-request/approve/${request.id}`);
    setRequests(prev => prev.filter(r => r.id !== request.id));
    alert(`Approved! Tx hash: ${txHash.slice(0, 10)}... | Email sent.`);
  } catch (err: any) {
    console.error('Accept error:', err);
    if (err.code === 'INVALID_ARGUMENT') {
      alert('Contract setup error: Invalid address. Check console.');
    } else if (err.code === 'ACTION_REJECTED') {
      alert('User rejected the transaction.');
    } else if (err.reason || err.message) {
      alert(`Blockchain failed: ${err.reason || err.message}`);
    } else {
      alert(`Accept failed: ${err.message}`);
    }
    // Revert API if tx partial success (optional, tùy logic)
  } finally {
    setSubmitting(false);
  }
};

  const handleViewRequest = (request: RoleRequest) => {
    setSelectedRequest(request);
  };

  // Shorten wallet address for display
  const shortenWallet = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Verify Role Requests</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {/* <button 
            onClick={() => setShowAddMemberPopup(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Member</span>
          </button> */}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending role requests.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {request.userId ? request.userId.slice(0, 2).toUpperCase() : 'N/A'}  {/* Use first 2 chars from wallet */}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Wallet: {shortenWallet(request.userId)}</h4>
                    <p className="text-sm text-gray-600">Requested: {request.requestedRole}</p>
                    <p className="text-sm text-gray-500">Status: {request.status}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAccept(request)}
                    disabled={submitting || request.status !== 'CONFIRMED'}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleOpenRejectionPopup(request)}
                    disabled={submitting || request.status !== 'CONFIRMED'}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Edit3 className="h-4 w-4 text-red-600" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleViewRequest(request)}
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
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Role</option>
                <option value="VERIFIER">Verifier</option>
                <option value="GOVERNMENT">Government</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleAddMember}
                disabled={!newUserId.trim() || !newRoleName || submitting}
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

      {/* Rejection Popup */}
      {showRejectionPopup && requestToVerify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Reject Role Request</h2>
            <p className="mb-4 text-sm text-gray-600">
              Reason for rejecting request for {requestToVerify.requestedRole}:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleReject}
                disabled={rejectionReason.trim() === '' || submitting}
                className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 flex items-center space-x-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Reject</span>
              </button>
              <button onClick={handleCloseRejectionPopup} disabled={submitting} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Wallet: {shortenWallet(selectedRequest.userId)}</h3>
                  <p className="text-sm text-gray-600">Requested: {selectedRequest.requestedRole}</p>
                  <p className="text-sm text-gray-500">Status: {selectedRequest.status}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Reason</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedRequest.reason || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyRole;