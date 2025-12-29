import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Eye, User, Shield, CheckCircle, Calendar, X } from 'lucide-react';

interface RoleRequest {
  id: string;
  userId: string;
  userName?: string;
  requestedRole: string;
  reason?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

const VerifyRoleRequest: React.FC = () => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  const [requestToVerify, setRequestToVerify] = useState<RoleRequest | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/role-request/request-confirm');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: RoleRequest[] = await response.json();
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching role requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleOpenRejectionPopup = (request: RoleRequest) => {
    setRequestToVerify(request);
    setShowRejectionPopup(true);
  };

  const handleCloseRejectionPopup = () => {
    setRequestToVerify(null);
    setShowRejectionPopup(false);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (rejectionReason.trim() === '' || !requestToVerify) return;
    try {
      // TODO: Implement actual rejection API call, e.g., POST to /api/role-request/{id}/reject with { reason: rejectionReason }
      console.log(`Role request ${requestToVerify.id} for ${requestToVerify.userName || requestToVerify.userId} rejected with reason: ${rejectionReason}`);
      // Optionally refetch requests after rejection
      // await fetchRequests(); // Uncomment if refetch needed
    } catch (err) {
      console.error('Rejection failed:', err);
    }
    handleCloseRejectionPopup();
  };

  const handleAccept = async (request: RoleRequest) => {
    try {
      // TODO: Implement actual acceptance API call, e.g., POST to /api/role-request/{id}/confirm
      console.log(`Role request ${request.id} for ${request.userName || request.userId} accepted for role: ${request.requestedRole}`);
      // Optionally refetch requests after acceptance
      // await fetchRequests(); // Uncomment if refetch needed
    } catch (err) {
      console.error('Acceptance failed:', err);
    }
  };

  const handleViewRequest = (request: RoleRequest) => {
    setSelectedRequest(request);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Role Requests Management</h3>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading role requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Role Requests Management</h3>
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
      <h3 className="text-xl font-semibold text-gray-900">Role Requests Management</h3>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No pending role requests found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {request.userName || request.userId} - {request.requestedRole}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{request.userId}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      {request.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAccept(request)}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleOpenRejectionPopup(request)}
                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4 text-red-600" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleViewRequest(request)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              {request.reason && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 italic">Reason: {request.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showRejectionPopup && requestToVerify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reject Role Request</h2>
              <button onClick={handleCloseRejectionPopup} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-gray-600">
              Please provide a reason for rejecting the request for "{requestToVerify.requestedRole}" by {requestToVerify.userName || requestToVerify.userId}.
            </p>
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

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedRequest.userName || selectedRequest.userId} - {selectedRequest.requestedRole}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>User ID: {selectedRequest.userId}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Requested: {new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Request Details</h4>
                  {selectedRequest.reason ? (
                    <p className="text-sm text-gray-700">{selectedRequest.reason}</p>
                  ) : (
                    <p className="text-sm text-gray-600">No reason provided.</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Request Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Requested Role:</span>
                      <span className="font-medium text-blue-900">
                        <Shield className="h-4 w-4 inline mr-1" />
                        {selectedRequest.requestedRole}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Status:</span>
                      <span className="font-medium text-blue-900">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          {selectedRequest.status}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Created:</span>
                      <span className="font-medium text-blue-900">
                        {new Date(selectedRequest.createdAt).toLocaleString()}
                      </span>
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

export default VerifyRoleRequest;