import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Shield, 
  Award, Leaf, Plus, Minus, X, AlertTriangle,
  Loader2, ChevronRight, Clock, ExternalLink,
  TreePine, RefreshCw, Eye, CheckCircle
} from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCredit from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';

interface User {
  id: string;
  userId: string;
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
  organizationName: string;
  description?: string;
  version?: number;
}

interface MyCreditResponse {
  creditId: string;
  tokenId: number;
  projectId: string;
  availableBalance: string;
}

interface RetireItem {
  tokenId: number;
  creditId: string;
  projectId: string;
  amount: number;
  maxAmount: number;
}

interface Certificate {
  certificateId: number;
  retiredBy: string;
  totalValue: number;
  timestamp: number;
  recordCount: number;
  txHash: string;
}

interface CertificateRecord {
  certificateId: number;
  creditTokenId: number;
  creditAmount: number;
}

const UserManagement: React.FC = () => {
  // Trạng thái quản lý người dùng
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
  
  // Đơn vị thẩm định
  const [verifierRoles, setVerifierRoles] = useState<VerifierRole[]>([]);
  const [verifierRolesLoading, setVerifierRolesLoading] = useState(false);
  const [selectedVerifierRole, setSelectedVerifierRole] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const roles = ['USER', 'OWNER', 'VERIFIER', 'GOVERNMENT', 'ADMIN'];

  // Trạng thái Thu hồi tín chỉ (Retire)
  const [activeSection, setActiveSection] = useState<'users' | 'retire' | 'certificates'>('users');
  const [myCredits, setMyCredits] = useState<MyCreditResponse[]>([]);
  const [retireItems, setRetireItems] = useState<RetireItem[]>([]);
  const [retireStep, setRetireStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [processing, setProcessing] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [certificateRecords, setCertificateRecords] = useState<CertificateRecord[]>([]);
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [retireError, setRetireError] = useState('');

  const CONTRACT_ADDRESS = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;

  // Tải tín chỉ của tôi
  const loadMyCredits = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      setLoadingCredits(true);
      setRetireError('');
      const response = await api.get('/wallet/my-credits');
      const credits: MyCreditResponse[] = response.data;
      const availableCredits = credits.filter(c => parseInt(c.availableBalance) > 0);
      setMyCredits(availableCredits);
    } catch (err: any) {
      showError('Không thể tải danh sách tín chỉ của bạn');
    } finally {
      setLoadingCredits(false);
    }
  }, [currentUser]);

  // Tải danh sách chứng nhận từ blockchain
  const loadMyCertificates = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, provider);
      const certs: Certificate[] = [];
      const filter = contract.filters.BatchCertificateRetired(null, currentUser.userId);
      const events = await contract.queryFilter(filter, -10000);

      for (const event of events) {
        const args = (event as any).args;
        const certId = Number(args.certificateId);
        const details = await contract.getCertificateDetails(certId);
        certs.push({
          certificateId: certId,
          retiredBy: details.userId,
          totalValue: Number(details.totalValue),
          timestamp: Number(details.timestamp),
          recordCount: Number(details.recordCount),
          txHash: event.transactionHash
        });
      }
      certs.sort((a, b) => b.timestamp - a.timestamp);
      setMyCertificates(certs);
    } catch (err) {
      console.warn('Không thể tải danh sách chứng nhận');
    }
  }, [currentUser, CONTRACT_ADDRESS]);

  useEffect(() => {
    if (activeSection === 'retire' && myCredits.length === 0) loadMyCredits();
    if (activeSection === 'certificates' && myCertificates.length === 0) loadMyCertificates();
  }, [activeSection, loadMyCredits, loadMyCertificates, myCredits.length, myCertificates.length]);

  const addRetireItem = (credit: MyCreditResponse) => {
    if (retireItems.find(item => item.tokenId === credit.tokenId)) return;
    if (retireItems.length >= 10) {
      showWarning('Chỉ được phép chọn tối đa 10 loại tín chỉ khác nhau');
      return;
    }
    setRetireItems(prev => [...prev, {
      tokenId: credit.tokenId,
      creditId: credit.creditId,
      projectId: credit.projectId,
      amount: 1,
      maxAmount: parseInt(credit.availableBalance)
    }]);
  };

  const removeRetireItem = (tokenId: number) => {
    setRetireItems(prev => prev.filter(item => item.tokenId !== tokenId));
  };

  const updateAmount = (tokenId: number, newAmount: number) => {
    setRetireItems(prev => prev.map(item => {
      if (item.tokenId === tokenId) {
        const clampedAmount = Math.max(1, Math.min(newAmount, item.maxAmount));
        return { ...item, amount: clampedAmount };
      }
      return item;
    }));
  };

  const getTotalAmount = () => retireItems.reduce((sum, item) => sum + item.amount, 0);

  const handleRetire = async () => {
    if (retireItems.length === 0) {
      showWarning('Vui lòng chọn ít nhất một tín chỉ để thu hồi');
      return;
    }
    setRetireStep('processing');
    setProcessing(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      showInfo("Vui lòng xác nhận thu hồi trên ví của bạn...");
      const tx = await contract.retireCreditBatch(retireItems.map(i => i.tokenId), retireItems.map(i => i.amount));
      const receipt = await tx.wait(1);

      let certificateId = 0;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed?.name === 'BatchCertificateRetired') {
            certificateId = Number(parsed.args.certificateId);
            break;
          }
        } catch { continue; }
      }

      if (certificateId > 0) {
        const details = await contract.getCertificateDetails(certificateId);
        const records = await contract.getCertificateRecords(certificateId);
        setCertificate({
          certificateId,
          retiredBy: details.userId,
          totalValue: Number(details.totalValue),
          timestamp: Number(details.timestamp),
          recordCount: Number(details.recordCount),
          txHash: tx.hash
        });
        setCertificateRecords(records.map((r: any) => ({
          certificateId: Number(r.certificateId),
          creditTokenId: Number(r.creditTokenId),
          creditAmount: Number(r.creditAmount)
        })));
      }
      showSuccess("Thu hồi tín chỉ thành công!");
      setRetireStep('success');
      loadMyCertificates();
      loadMyCredits();
    } catch (err: any) {
      setRetireStep('confirm');
      showError(err.reason || "Thu hồi thất bại");
    } finally {
      setProcessing(false);
    }
  };

  const viewCertificateDetails = async (certId: number) => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, provider);
      const details = await contract.getCertificateDetails(certId);
      const records = await contract.getCertificateRecords(certId);
      const cert = myCertificates.find(c => c.certificateId === certId);

      setCertificate({
        certificateId: certId,
        retiredBy: details.userId,
        totalValue: Number(details.totalValue),
        timestamp: Number(details.timestamp),
        recordCount: Number(details.recordCount),
        txHash: cert?.txHash || ''
      });
      setCertificateRecords(records.map((r: any) => ({
        certificateId: Number(r.certificateId),
        creditTokenId: Number(r.creditTokenId),
        creditAmount: Number(r.creditAmount)
      })));
      setRetireStep('success');
      setActiveSection('retire');
    } catch (err) {
      showError("Không thể tải chi tiết chứng nhận");
    }
  };

  const resetRetireFlow = () => {
    setRetireStep('select');
    setRetireItems([]);
    setCertificate(null);
    setCertificateRecords([]);
  };

  const fetchVerifierRoles = async () => {
    try {
      setVerifierRolesLoading(true);
      const response = await api.get('/verifier-role/all');
      setVerifierRoles(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setVerifierRoles([]);
    } finally {
      setVerifierRolesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (!currentUser || currentUser.role !== 'ADMIN') {
        setError('Truy cập bị từ chối: Yêu cầu quyền Quản trị viên.');
        setLoading(false);
        return;
      }
      const promises = roles.map(role => api.get(`/user/all?roleId=${role}`).catch(() => ({ data: [] })));
      const responses = await Promise.all(promises);
      const processedData: Record<string, User[]> = {};
      roles.forEach((role, index) => {
        processedData[role] = (responses[index].data || [])
          .filter((u: any) => u && u.isActive)
          .map((u: any) => ({ id: u.id, userId: u.id, role: u.roleId, email: u.email, createdAt: u.createdAt }));
      });
      setUsersByRole(processedData);
    } catch (err: any) {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    const trimmedUserId = newUserId.trim();
    if (!trimmedUserId || !ethers.isAddress(trimmedUserId)) return showError('Địa chỉ ví không hợp lệ.');
    if (!newRoleName) return showError('Vui lòng chọn một vai trò.');

    setSubmitting(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      let tx;
      showInfo("Đang khởi tạo giao dịch trên blockchain...");
      if (newRoleName === 'VERIFIER') {
        if (!selectedVerifierRole) return showError('Vui lòng chọn Tổ chức Thẩm định');
        const orgName = verifierRoles.find(r => r.id === selectedVerifierRole)?.organizationName;
        tx = await contract.verifyOrganization(trimmedUserId, orgName);
      } else if (newRoleName === 'GOVERNMENT') {
        tx = await contract.addGovernment(trimmedUserId);
      } else if (newRoleName === 'ADMIN') {
        tx = await contract.addAdmin(trimmedUserId);
      } else {
        throw new Error(`Vai trò không được hỗ trợ: ${newRoleName}`);
      }

      await tx.wait();
      await api.put('/role-request/add-role', { userId: trimmedUserId, roleName: newRoleName, verifierRoleId: newRoleName === 'VERIFIER' ? selectedVerifierRole : null });
      
      showSuccess(`Thêm thành viên thành công với vai trò ${newRoleName}!`);
      setShowAddMemberPopup(false);
      setNewUserId('');
      setNewRoleName('');
      fetchUsers();
    } catch (err: any) {
      showError(err.reason || "Giao dịch thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser({ ...user, role: user.roleId || user.role });
    }
    fetchVerifierRoles();
  }, []);

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [currentUser]);

  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString('vi-VN');
  const shortenWallet = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';

  const mapRoleName = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'GOVERNMENT': return 'Chính phủ';
      case 'VERIFIER': return 'Thẩm định viên';
      case 'OWNER': return 'Doan nghiệp phát triển';
      case 'USER': return 'Người dùng';
      default: return role;
    }
  };

  if (loading && !currentUser) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-green-600" /></div>;
  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="flex flex-col justify-center items-center h-64 space-y-4"><Shield className="h-12 w-12 text-red-500" /><h3 className="text-lg font-bold">Truy cập bị từ chối</h3></div>;

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl"><Users className="h-6 w-6 text-white" /></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quản lý Hệ thống</h2>
            </div>
          </div>
        </div>
      </div>

      {activeSection === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Danh sách người dùng</h3>
            <div className="flex space-x-2">
              <button onClick={fetchUsers} className="px-4 py-2 border rounded-xl hover:bg-gray-50 flex items-center space-x-2"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span>Làm mới</span></button>
              <button onClick={() => setShowAddMemberPopup(true)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium flex items-center space-x-2"><Plus className="h-5 w-5" /><span>Thêm thành viên</span></button>
            </div>
          </div>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {roles.map((role) => (
              <button key={role} onClick={() => setActiveRole(role)} className={`px-4 py-2 rounded-lg font-medium flex-1 min-w-fit transition-all ${activeRole === role ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>
                {mapRoleName(role)} <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{usersByRole[role]?.length || 0}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {usersByRole[activeRole]?.map((user) => (
              <div key={user.id} className="bg-white rounded-2xl p-6 border border-gray-100 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">{user.userId.slice(2, 4).toUpperCase()}</div>
                  <div>
                    <h4 className="font-bold">Ví: {shortenWallet(user.userId)}</h4>
                    <p className="text-sm text-gray-500">Vai trò: {mapRoleName(user.role)} {user.email && `| Email: ${user.email}`}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(user)} className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"><Eye className="h-4 w-4" /><span>Chi tiết</span></button>
              </div>
            ))}
          </div>

          {showAddMemberPopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold mb-6">Thêm thành viên mới</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Địa chỉ ví</label>
                    <input type="text" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="0x..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vai trò hệ thống</label>
                    <select value={newRoleName} onChange={(e) => {setNewRoleName(e.target.value); setSelectedVerifierRole('');}} className="w-full p-3 border rounded-xl outline-none">
                      <option value="">-- Chọn vai trò --</option>
                      <option value="VERIFIER">Thẩm định viên (Verifier)</option>
                      <option value="GOVERNMENT">Chính phủ (Government)</option>
                      <option value="ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                  {newRoleName === 'VERIFIER' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-sm font-medium mb-1">Tổ chức Thẩm định</label>
                      <select value={selectedVerifierRole} onChange={(e) => setSelectedVerifierRole(e.target.value)} className="w-full p-3 border rounded-xl outline-none">
                        <option value="">-- Chọn tổ chức --</option>
                        {verifierRoles.map((vr) => <option key={vr.id} value={vr.id}>{vr.organizationName}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={() => setShowAddMemberPopup(false)} className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium">Hủy</button>
                    <button onClick={handleAddMember} disabled={submitting} className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold disabled:opacity-50 flex items-center space-x-2">
                      {submitting && <Loader2 className="animate-spin h-4 w-4" />}<span>Xác nhận</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold">Thông tin người dùng</h3>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X /></button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-bold">Địa chỉ ví</p>
                    <p className="font-mono text-sm break-all">{selectedUser.userId}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-bold">Vai trò</p>
                      <p className="font-bold text-green-600">{mapRoleName(selectedUser.role)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-bold">Ngày tham gia</p>
                      <p className="font-bold">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'retire' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex border-b border-gray-100 bg-gray-50">
            {[
              { id: 'select', label: 'Chọn tín chỉ' },
              { id: 'confirm', label: 'Xác nhận' },
              { id: 'processing', label: 'Đang xử lý' },
              { id: 'success', label: 'Thành công' }
            ].map((step, index) => (
              <div key={step.id} className={`flex-1 py-4 text-center text-sm font-bold flex items-center justify-center gap-2 ${retireStep === step.id ? 'bg-white text-green-700 border-b-2 border-green-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${retireStep === step.id ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>{index + 1}</div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            ))}
          </div>

          <div className="p-6">
            {retireStep === 'select' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Tín chỉ khả dụng</h3>
                  <button onClick={loadMyCredits} className="text-green-600 font-bold flex items-center gap-1"><RefreshCw className={loadingCredits ? 'animate-spin' : ''} />Làm mới</button>
                </div>
                {loadingCredits ? (
                  <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-green-600" /></div>
                ) : myCredits.length === 0 ? (
                  <div className="text-center py-12">
                    <TreePine className="h-12 w-12 text-gray-200 mx-auto" />
                    <p className="text-gray-500 mt-2">Bạn không có tín chỉ nào khả dụng</p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {myCredits.map(c => (
                      <div key={c.tokenId} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${retireItems.some(i => i.tokenId === c.tokenId) ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${retireItems.some(i => i.tokenId === c.tokenId) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}><TreePine /></div>
                          <div>
                            <p className="font-bold">Dự án: {c.projectId.slice(0, 8)}...</p>
                            <p className="text-xs text-gray-500">Mã Token: #{c.tokenId} | Số dư: {c.availableBalance}</p>
                          </div>
                        </div>
                        <button onClick={() => retireItems.some(i => i.tokenId === c.tokenId) ? removeRetireItem(c.tokenId) : addRetireItem(c)} className={`p-2 rounded-xl ${retireItems.some(i => i.tokenId === c.tokenId) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {retireItems.some(i => i.tokenId === c.tokenId) ? <Minus /> : <Plus />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {retireItems.length > 0 && (
                  <div className="border-t pt-6 space-y-4 animate-in slide-in-from-bottom-4">
                    <h4 className="font-bold">Đã chọn ({retireItems.length}/10)</h4>
                    {retireItems.map(item => (
                      <div key={item.tokenId} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                        <div><p className="font-bold">Mã Token: #{item.tokenId}</p><p className="text-xs text-gray-500">Dự án: {item.projectId.slice(0, 8)}...</p></div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
                            <button onClick={() => updateAmount(item.tokenId, item.amount - 1)} disabled={item.amount <= 1} className="p-1 hover:bg-gray-100 rounded"><Minus className="w-4 h-4" /></button>
                            <input type="number" value={item.amount} onChange={(e) => updateAmount(item.tokenId, parseInt(e.target.value) || 1)} className="w-12 text-center font-bold outline-none" />
                            <button onClick={() => updateAmount(item.tokenId, item.amount + 1)} disabled={item.amount >= item.maxAmount} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeRetireItem(item.tokenId)} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                      <p className="font-bold">Tổng thu hồi: <span className="text-2xl text-green-600">{getTotalAmount()} tCO₂e</span></p>
                      <button onClick={() => setRetireStep('confirm')} className="w-full sm:w-auto bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100">Tiếp tục <ChevronRight /></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {retireStep === 'confirm' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">Xác nhận Thu hồi</h3>
                <div className="bg-green-600 rounded-2xl p-8 text-white text-center shadow-xl shadow-green-100">
                  <p className="text-green-100 uppercase font-bold tracking-widest text-xs">Tổng lượng tín chỉ tiêu hủy</p>
                  <p className="text-5xl font-black mt-2">{getTotalAmount()} <span className="text-xl font-normal">tCO₂e</span></p>
                  <p className="text-green-100 mt-2 text-sm opacity-80">Các tín chỉ này sẽ vĩnh viễn bị xóa khỏi lưu thông.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800">
                  <AlertTriangle className="flex-shrink-0" />
                  <p className="text-sm font-medium">Lưu ý: Hành động này không thể hoàn tác. Một chứng nhận thu hồi (Retirement Certificate) sẽ được phát hành sau khi hoàn tất.</p>
                </div>
                <div className="flex justify-between pt-6">
                  <button onClick={() => setRetireStep('select')} className="px-8 py-3 border rounded-xl font-bold hover:bg-gray-50">Quay lại</button>
                  <button onClick={handleRetire} disabled={processing} className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors">
                    {processing ? <Loader2 className="animate-spin" /> : <Leaf />} Xác nhận & Thu hồi
                  </button>
                </div>
              </div>
            )}

            {retireStep === 'processing' && (
              <div className="text-center py-16 space-y-4">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner"><Loader2 className="w-12 h-12 text-green-600 animate-spin" /></div>
                <h3 className="text-2xl font-bold">Đang xử lý giao dịch</h3>
                <p className="text-gray-500">Vui lòng xác nhận trên ví và đợi mạng lưới blockchain xác thực...</p>
              </div>
            )}

            {retireStep === 'success' && certificate && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  <h3 className="text-3xl font-black mt-4">Thu hồi thành công!</h3>
                </div>
                <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-3xl p-8 border-2 border-green-200 shadow-2xl shadow-green-100">
                   <div className="text-center border-b pb-6 mb-6 border-green-100">
                      <p className="text-green-600 uppercase font-black tracking-widest text-xs">Chứng nhận Thu hồi Tín chỉ Carbon</p>
                      <h4 className="text-4xl font-black mt-2">Mã số: #{certificate.certificateId}</h4>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-center">
                      <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Tổng giá trị</p><p className="text-3xl font-black text-green-700">{certificate.totalValue} tCO₂e</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Ngày phát hành</p><p className="font-bold">{formatDate(certificate.timestamp)}</p></div>
                   </div>
                   <div className="text-center">
                      <a href={`https://sepolia.etherscan.io/tx/${certificate.txHash}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold inline-flex items-center gap-1 hover:underline decoration-2 underline-offset-4"><ExternalLink className="w-4 h-4" /> Xem giao dịch trên Etherscan</a>
                   </div>
                </div>
                <button onClick={resetRetireFlow} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 transition-transform active:scale-95">Tiếp tục thu hồi thêm</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'certificates' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Lịch sử thu hồi của tôi</h3>
            <button onClick={loadMyCertificates} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><RefreshCw className="h-4 w-4 text-gray-400" /></button>
          </div>
          {myCertificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-200 mx-auto" />
              <p className="text-gray-500 mt-2">Chưa có chứng nhận nào được phát hành</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCertificates.map(cert => (
                <div key={cert.certificateId} onClick={() => viewCertificateDetails(cert.certificateId)} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-green-100 group">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Award /></div>
                      <div>
                         <p className="font-bold text-lg">Chứng nhận #{cert.certificateId}</p>
                         <div className="flex gap-4 text-xs text-gray-400 font-bold">
                            <span className="flex items-center gap-1"><TreePine className="w-3 h-3" /> {cert.totalValue} tCO₂e</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(cert.timestamp)}</span>
                         </div>
                      </div>
                   </div>
                   <ChevronRight className="text-gray-300 group-hover:text-green-600 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;