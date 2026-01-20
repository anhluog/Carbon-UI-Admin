import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Shield, Leaf, Plus, Minus, X, AlertTriangle,
  Loader2, Check, ChevronRight, Clock, ExternalLink,
  TreePine, RefreshCw, FileText, Eye, Award
} from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCredit from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';

// Interfaces (Giữ nguyên các interface của bạn)
interface User { id: string; userId: string; role: string; email?: string; createdAt?: string; }
interface CurrentUser { id: string; userId: string; role: string; email?: string; name?: string; }
interface VerifierRole { id: string; organizationName: string; description?: string; version?: number; }
interface MyCreditResponse { creditId: string; tokenId: number; projectId: string; availableBalance: string; }
interface RetireItem { tokenId: number; creditId: string; projectId: string; amount: number; maxAmount: number; }
interface Certificate { certificateId: number; retiredBy: string; totalValue: number; timestamp: number; recordCount: number; txHash: string; }
interface CertificateRecord { certificateId: number; creditTokenId: number; creditAmount: number; }

const UserManagement: React.FC = () => {
  // States
  const [usersByRole, setUsersByRole] = useState<Record<string, User[]>>({
    'USER': [], 'OWNER': [], 'VERIFIER': [], 'GOVERNMENT': [], 'ADMIN': []
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState('USER');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [verifierRoles, setVerifierRoles] = useState<VerifierRole[]>([]);
  const [verifierRolesLoading, setVerifierRolesLoading] = useState(false);
  const [selectedVerifierRole, setSelectedVerifierRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Retire States
  const [activeSection, setActiveSection] = useState<'users' | 'retire' | 'certificates'>('users');
  const [myCredits, setMyCredits] = useState<MyCreditResponse[]>([]);
  const [retireItems, setRetireItems] = useState<RetireItem[]>([]);
  const [retireStep, setRetireStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const CONTRACT_ADDRESS = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;
  const roles = ['USER', 'OWNER', 'VERIFIER', 'GOVERNMENT', 'ADMIN'];

  // --- LOGIC FETCH DATA ---

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const promises = roles.map(role => api.get(`/user/all?roleId=${role}`).catch(() => ({ data: [] })));
      const responses = await Promise.all(promises);

      const processedData: Record<string, User[]> = {};
      roles.forEach((role, index) => {
        processedData[role] = (responses[index].data || [])
          .filter((u: any) => u && u.isActive)
          .map((u: any) => ({
            id: u.id, userId: u.id, role: u.roleId, email: u.email, createdAt: u.createdAt
          }));
      });
      setUsersByRole(processedData);
    } catch (err: any) {
      showError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyCredits = useCallback(async () => {
    try {
      setLoadingCredits(true);
      const response = await api.get('/wallet/my-credits');
      const availableCredits = response.data.filter((c: MyCreditResponse) => parseInt(c.availableBalance) > 0);
      setMyCredits(availableCredits);
    } catch (err) {
      showError('Không thể tải danh sách tín chỉ của bạn');
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  const loadMyCertificates = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, provider);
      const filter = contract.filters.BatchCertificateRetired(null, currentUser?.userId);
      const events = await contract.queryFilter(filter, -10000);

      const certs = await Promise.all(events.map(async (event: any) => {
        const details = await contract.getCertificateDetails(Number(event.args.certificateId));
        return {
          certificateId: Number(event.args.certificateId),
          retiredBy: details.userId,
          totalValue: Number(details.totalValue),
          timestamp: Number(details.timestamp),
          recordCount: Number(details.recordCount),
          txHash: event.transactionHash
        };
      }));

      setMyCertificates(certs.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.warn('Certs load error', err);
    }
  }, [currentUser, CONTRACT_ADDRESS]);

  // --- LOGIC ROLE MANAGEMENT ---

  const handleAddMember = async () => {
    const trimmedId = newUserId.trim();
    if (!ethers.isAddress(trimmedId)) return showError('Địa chỉ ví không hợp lệ');
    if (!newRoleName) return showError('Vui lòng chọn quyền');
    if (newRoleName === 'VERIFIER' && !selectedVerifierRole) return showError('Vui lòng chọn tổ chức xác minh');

    setSubmitting(true);
    showInfo('Đang khởi tạo giao dịch trên blockchain...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      let tx;
      if (newRoleName === 'VERIFIER') {
        const org = verifierRoles.find(r => r.id === selectedVerifierRole);
        tx = await contract.verifyOrganization(trimmedId, org?.organizationName);
      } else if (newRoleName === 'GOVERNMENT') {
        tx = await contract.addGovernment(trimmedId);
      } else if (newRoleName === 'ADMIN') {
        tx = await contract.addAdmin(trimmedId);
      }

      showInfo('Giao dịch đã gửi. Đang chờ xác nhận...');
      await tx.wait();

      await api.put('/role-request/add-role', { 
        userId: trimmedId, 
        roleName: newRoleName,
        verifierRoleId: newRoleName === 'VERIFIER' ? selectedVerifierRole : null 
      });

      showSuccess(`Đã cấp quyền ${newRoleName} thành công!`);
      setShowAddMemberPopup(false);
      fetchUsers();
    } catch (err: any) {
      showError(err.reason || err.message || 'Giao dịch thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // --- LOGIC RETIRE CREDITS ---

  const handleRetire = async () => {
    if (retireItems.length === 0) return showError('Vui lòng chọn ít nhất 1 tín chỉ');
    
    setRetireStep('processing');
    showInfo('Đang tiến hành tiêu hủy tín chỉ...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      const tx = await contract.retireCreditBatch(
        retireItems.map(i => i.tokenId),
        retireItems.map(i => i.amount)
      );
      
      showInfo('Đang chờ Blockchain xác nhận tiêu hủy...');
      const receipt = await tx.wait();

      // Tìm Certificate ID từ logs
      let certId = 0;
      receipt.logs.forEach((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'BatchCertificateRetired') certId = Number(parsed.args.certificateId);
        } catch {}
      });

      if (certId) {
        const details = await contract.getCertificateDetails(certId);
        setCertificate({
          certificateId: certId,
          retiredBy: details.userId,
          totalValue: Number(details.totalValue),
          timestamp: Number(details.timestamp),
          recordCount: Number(details.recordCount),
          txHash: tx.hash
        });
      }

      showSuccess('Tiêu hủy tín chỉ thành công! Chứng chỉ đã được tạo.');
      setRetireStep('success');
      loadMyCredits();
    } catch (err: any) {
      showError(err.reason || 'Tiêu hủy thất bại');
      setRetireStep('confirm');
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser({ ...u, role: u.roleId || u.role });
    }
    
    api.get('/verifier-role/all').then(res => setVerifierRoles(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') fetchUsers();
  }, [currentUser, fetchUsers]);

  // Helper formats
  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Shield className="h-16 w-16 text-red-500 animate-pulse" />
        <h3 className="text-xl font-bold">Truy cập bị từ chối</h3>
        <p className="text-gray-500">Bạn cần quyền Admin để xem trang này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header Cards */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-green-600 p-4 rounded-2xl shadow-lg shadow-green-100">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">Hệ thống quản trị</h2>
              <p className="text-sm text-gray-500">Quản lý thành viên và tiêu hủy tín chỉ</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            {[
              { id: 'users', label: 'Thành viên', icon: Users },
              { id: 'retire', label: 'Tiêu hủy', icon: Leaf },
              { id: 'certificates', label: 'Chứng chỉ', icon: Award }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeSection === tab.id ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. SECTION: USER MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeRole === role ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
                  }`}
                >
                  {role} ({usersByRole[role]?.length || 0})
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddMemberPopup(true)}
              className="bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-gray-800 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersByRole[activeRole]?.map(user => (
              <div key={user.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all group">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {user.role[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 truncate">{shorten(user.userId)}</p>
                    <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(user)}
                  className="w-full py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold group-hover:bg-green-50 group-hover:text-green-600 transition-colors"
                >
                  Xem chi tiết
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SECTION: RETIRE CREDITS */}
      {activeSection === 'retire' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          {/* Step Progress */}
          <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-100">
            {['Chọn tín chỉ', 'Xác nhận', 'Đang xử lý', 'Hoàn tất'].map((label, idx) => (
              <div key={idx} className={`py-4 text-center text-[10px] font-black uppercase tracking-widest ${
                idx === ['select', 'confirm', 'processing', 'success'].indexOf(retireStep) ? 'text-green-600 border-b-2 border-green-600 bg-white' : 'text-gray-400'
              }`}>
                {label}
              </div>
            ))}
          </div>

          <div className="p-8">
            {retireStep === 'select' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Tín chỉ khả dụng</h3>
                  <button onClick={loadMyCredits} className="p-2 hover:bg-gray-100 rounded-full"><RefreshCw className="w-4 h-4" /></button>
                </div>
                
                <div className="grid gap-3">
                  {myCredits.map(c => {
                    const isSelected = retireItems.some(i => i.tokenId === c.tokenId);
                    return (
                      <div key={c.tokenId} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <TreePine className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Token #{c.tokenId}</p>
                            <p className="text-xs text-gray-500">Số dư: {c.availableBalance} tCO2e</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (isSelected) setRetireItems(prev => prev.filter(i => i.tokenId !== c.tokenId));
                            else setRetireItems(prev => [...prev, { ...c, amount: 1, maxAmount: parseInt(c.availableBalance) }]);
                          }}
                          className={`px-4 py-2 rounded-xl font-bold text-xs ${isSelected ? 'bg-red-50 text-red-600' : 'bg-green-600 text-white'}`}
                        >
                          {isSelected ? 'Bỏ chọn' : 'Chọn'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {retireItems.length > 0 && (
                  <div className="pt-6 border-t">
                    <button 
                      onClick={() => setRetireStep('confirm')}
                      className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100 flex items-center justify-center space-x-2"
                    >
                      <span>Tiếp tục tiêu hủy {retireItems.length} loại tín chỉ</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {retireStep === 'confirm' && (
              <div className="text-center space-y-6 max-w-md mx-auto">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">Xác nhận vĩnh viễn</h3>
                <p className="text-gray-500 text-sm">
                  Tín chỉ sau khi tiêu hủy sẽ không thể khôi phục và sẽ được ghi nhận vào chứng chỉ bảo vệ môi trường của bạn.
                </p>
                <div className="bg-gray-50 p-6 rounded-3xl">
                  <p className="text-xs text-gray-400 font-bold uppercase">Tổng lượng tiêu hủy</p>
                  <p className="text-4xl font-black text-green-600">
                    {retireItems.reduce((acc, curr) => acc + curr.amount, 0)} <span className="text-sm">tCO2e</span>
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setRetireStep('select')} className="flex-1 py-4 font-bold text-gray-500">Quay lại</button>
                  <button onClick={handleRetire} className="flex-1 bg-black text-white py-4 rounded-2xl font-bold">Xác nhận tiêu hủy</button>
                </div>
              </div>
            )}

            {retireStep === 'processing' && (
              <div className="py-20 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto" />
                <p className="font-bold text-lg">Đang xử lý giao dịch...</p>
                <p className="text-gray-400 text-sm">Vui lòng xác nhận trên ví Metamask của bạn</p>
              </div>
            )}

            {retireStep === 'success' && certificate && (
              <div className="text-center space-y-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">Tiêu hủy hoàn tất!</h3>
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-3xl text-white text-left relative overflow-hidden shadow-2xl shadow-green-200">
                  <Award className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Chứng chỉ tiêu hủy</p>
                  <p className="text-3xl font-black mt-1">#{certificate.certificateId}</p>
                  <div className="mt-8 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] opacity-70">Tổng giá trị</p>
                      <p className="text-xl font-bold">{certificate.totalValue} tCO2e</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] opacity-70">Ngày tạo</p>
                      <p className="text-xs font-bold">{formatDate(certificate.timestamp)}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setRetireStep('select'); setRetireItems([]); }} 
                  className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-bold"
                >
                  Thực hiện giao dịch khác
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SECTION: CERTIFICATES */}
      {activeSection === 'certificates' && (
        <div className="space-y-4 animate-in fade-in duration-500">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Lịch sử chứng chỉ</h3>
              <button onClick={loadMyCertificates} className="p-2 hover:bg-gray-100 rounded-full"><RefreshCw className="w-4 h-4" /></button>
           </div>
           {myCertificates.map(cert => (
             <div key={cert.certificateId} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-green-500 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold">Chứng chỉ #{cert.certificateId}</p>
                    <p className="text-xs text-gray-400">{formatDate(cert.timestamp)} • {cert.totalValue} tCO2e</p>
                  </div>
                </div>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${cert.txHash}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-green-50 group-hover:text-green-600 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
             </div>
           ))}
        </div>
      )}

      {/* POPUP: ADD MEMBER */}
      {showAddMemberPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Cấp quyền mới</h2>
              <button onClick={() => setShowAddMemberPopup(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Địa chỉ ví (Wallet)</label>
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Loại quyền</label>
                <select
                  value={newRoleName}
                  onChange={(e) => {setNewRoleName(e.target.value); setSelectedVerifierRole('');}}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold"
                >
                  <option value="">Chọn Role</option>
                  <option value="VERIFIER">Verifier</option>
                  <option value="GOVERNMENT">Government</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {newRoleName === 'VERIFIER' && (
                <div>
                  <label className="text-xs font-black uppercase text-gray-400 mb-2 block">Tổ chức xác minh</label>
                  <select
                    value={selectedVerifierRole}
                    onChange={(e) => setSelectedVerifierRole(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-sm"
                  >
                    <option value="">Chọn tổ chức</option>
                    {verifierRoles.map((vr) => (
                      <option key={vr.id} value={vr.id}>{vr.organizationName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleAddMember}
              disabled={submitting}
              className="w-full mt-8 bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Xác nhận cấp quyền</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;