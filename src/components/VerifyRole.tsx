import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Edit3, Eye, CheckCircle, Loader2, 
  AlertTriangle, RefreshCw, X, Shield, ExternalLink 
} from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo } from '../utils/toast';

interface RoleRequest {
  id: string;
  userId: string;
  requestedRole: string;
  reason?: string;
  status: string;
  // Giả sử backend trả về thêm thông tin verifier
  verifierRoleId?: string;
  verifierOrganizationName?: string;
}

const VerifyRole: React.FC = () => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RoleRequest | null>(null);
  
  // Rejection State
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestToVerify, setRequestToVerify] = useState<RoleRequest | null>(null);

  const CONTRACT_ADDRESS = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/role-request/request-confirm');
      const safeData = Array.isArray(response.data) 
        ? response.data.filter((r: any) => r && r.id) 
        : [];
      setRequests(safeData);
    } catch (err: any) {
      showError('Không thể tải danh sách yêu cầu phê duyệt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // --- LOGIC: TỪ CHỐI (REJECT) ---
  const handleReject = async () => {
    if (!requestToVerify || !rejectionReason.trim()) {
      showError('Vui lòng nhập lý do từ chối');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.put(`/role-request/reject/${requestToVerify.id}?reason=${encodeURIComponent(rejectionReason)}`);
      setRequests(prev => prev.filter(r => r.id !== requestToVerify.id));
      setShowRejectionPopup(false);
      showSuccess('Đã từ chối yêu cầu và gửi email thông báo.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Từ chối thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // --- LOGIC: CHẤP THUẬN (ACCEPT) ---
  const handleAccept = async (request: RoleRequest) => {
    if (!request.userId) return showError('Địa chỉ ví không hợp lệ');

    setSubmitting(true);
    
    try {
      // 1. Nếu là OWNER: Chỉ xử lý qua API (Không cần Blockchain)
      if (request.requestedRole === 'OWNER') {
        showInfo('Đang phê duyệt quyền Owner...');
        await api.put(`/role-request/approve/${request.id}`);
        showSuccess('Đã cấp quyền Owner thành công!');
        setRequests(prev => prev.filter(r => r.id !== request.id));
        setSubmitting(false);
        return;
      }

      // 2. Các Role khác: Yêu cầu Blockchain
      if (!CONTRACT_ADDRESS || !ethers.isAddress(CONTRACT_ADDRESS)) {
        throw new Error('Địa chỉ Smart Contract không hợp lệ. Vui lòng kiểm tra .env');
      }

      showInfo(`Đang khởi tạo giao dịch cấp quyền ${request.requestedRole} trên Blockchain...`);
      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCreditEx.abi, signer);

      let tx;
      if (request.requestedRole === 'VERIFIER') {
        // Cần truyền Organization Name nếu logic contract yêu cầu
        const orgName = request.verifierOrganizationName || "Authorized Verifier";
        tx = await contract.verifyOrganization(request.userId, orgName);
      } else if (request.requestedRole === 'GOVERNMENT') {
        tx = await contract.addGovernment(request.userId);
      } else if (request.requestedRole === 'ADMIN') {
        tx = await contract.addAdmin(request.userId);
      } else {
        throw new Error(`Quyền ${request.requestedRole} không hỗ trợ trên Blockchain`);
      }

      showInfo('Đang chờ xác nhận từ mạng lưới...');
      const receipt = await tx.wait();
      console.log('Blockchain Receipt:', receipt);

      // 3. Sau khi Blockchain thành công -> Cập nhật API
      showInfo('Blockchain xác nhận thành công. Đang cập nhật hệ thống...');
      await api.put(`/role-request/approve/${request.id}`);
      
      showSuccess(`Phê duyệt quyền ${request.requestedRole} thành công!`);
      setRequests(prev => prev.filter(r => r.id !== request.id));
      
    } catch (err: any) {
      console.error('Accept Error:', err);
      if (err.code === 'ACTION_REJECTED') {
        showError('Người dùng đã hủy giao dịch trên ví');
      } else {
        showError(err.reason || err.message || 'Phê duyệt thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shortenWallet = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
        <p className="text-gray-500 font-medium">Đang tải danh sách yêu cầu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-100 p-3 rounded-2xl">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">Phê duyệt quyền</h3>
            <p className="text-sm text-gray-500">Xem xét và xác nhận các yêu cầu cấp quyền hệ thống</p>
          </div>
        </div>
        <button
          onClick={fetchRequests}
          disabled={submitting}
          className="flex items-center space-x-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${submitting ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Hiện không có yêu cầu nào đang chờ xử lý.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-green-100">
                    {request.requestedRole[0]}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-gray-900">{shortenWallet(request.userId)}</h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-md tracking-wider">
                        {request.requestedRole}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Trạng thái: 
                      <span className="ml-1 text-amber-600 font-bold uppercase text-[10px] bg-amber-50 px-2 py-0.5 rounded">
                        {request.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleAccept(request)}
                    disabled={submitting}
                    className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span>Chấp thuận</span>
                  </button>
                  
                  <button
                    onClick={() => { setRequestToVerify(request); setShowRejectionPopup(true); }}
                    disabled={submitting}
                    className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span>Từ chối</span>
                  </button>

                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Chi tiết</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: TỪ CHỐI */}
      {showRejectionPopup && requestToVerify && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black mb-2">Từ chối yêu cầu</h2>
            <p className="text-gray-500 text-sm mb-6">Lý do từ chối sẽ được gửi qua email cho người dùng.</p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm min-h-[120px] resize-none"
            />

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowRejectionPopup(false)}
                disabled={submitting}
                className="flex-1 py-3.5 font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
                className="flex-2 bg-red-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-red-100 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Xác nhận từ chối</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHI TIẾT */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">Chi tiết yêu cầu</h3>
                  <p className="text-gray-500 font-mono text-xs">{selectedRequest.userId}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Quyền yêu cầu</p>
                    <p className="font-bold text-blue-600">{selectedRequest.requestedRole}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Trạng thái</p>
                    <p className="font-bold text-amber-600">{selectedRequest.status}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Lý do yêu cầu</p>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    "{selectedRequest.reason || 'Không có lý do được cung cấp.'}"
                  </p>
                </div>

                {selectedRequest.verifierOrganizationName && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Tổ chức đại diện</p>
                    <p className="font-bold text-emerald-900">{selectedRequest.verifierOrganizationName}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col space-y-3">
                <a 
                  href={`https://sepolia.etherscan.io/address/${selectedRequest.userId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-2 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Xem ví trên Etherscan</span>
                </a>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="py-3 font-bold text-gray-500"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyRole;