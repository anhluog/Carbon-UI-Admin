import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Shield, Trash2, Search, 
  Award, Leaf, Plus, Minus, X, AlertTriangle,
  Loader2, Check, ChevronRight, Clock, ExternalLink,
  TreePine, RefreshCw, FileText, Download, Eye
} from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCredit from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast'; // Import toast

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
  // Existing states
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
  
  // Verifier roles
  const [verifierRoles, setVerifierRoles] = useState<VerifierRole[]>([]);
  const [verifierRolesLoading, setVerifierRolesLoading] = useState(false);
  const [selectedVerifierRole, setSelectedVerifierRole] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const roles = ['USER', 'OWNER', 'VERIFIER', 'GOVERNMENT', 'ADMIN'];

  // States cho Retire Credits
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

  // Load My Credits từ API
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
      showError('Failed to load your credits');
    } finally {
      setLoadingCredits(false);
    }
  }, [currentUser]);

  // Load Certificates từ blockchain
  const loadMyCertificates = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
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
      console.warn('Could not load certificates');
    }
  }, [currentUser, CONTRACT_ADDRESS]);

  useEffect(() => {
    if (activeSection === 'retire' && myCredits.length === 0) loadMyCredits();
    if (activeSection === 'certificates' && myCertificates.length === 0) loadMyCertificates();
  }, [activeSection, loadMyCredits, loadMyCertificates, myCredits.length, myCertificates.length]);

  const addRetireItem = (credit: MyCreditResponse) => {
    if (retireItems.find(item => item.tokenId === credit.tokenId)) return;
    if (retireItems.length >= 10) {
      showWarning('Maximum 10 different credit types allowed');
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
      showWarning('Please select at least one credit to retire');
      return;
    }
    setRetireStep('processing');
    setProcessing(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      showInfo("Confirm retirement on your wallet...");
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
      showSuccess("Retirement successful!");
      setRetireStep('success');
      loadMyCertificates();
      loadMyCredits();
    } catch (err: any) {
      setRetireStep('confirm');
      showError(err.reason || "Retirement failed");
    } finally {
      setProcessing(false);
    }
  };

  const viewCertificateDetails = async (certId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
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
      showError("Failed to load certificate details");
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
        setError('Access denied: Admin role required.');
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
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    const trimmedUserId = newUserId.trim();
    if (!trimmedUserId || !ethers.isAddress(trimmedUserId)) return showError('Invalid wallet address.');
    if (!newRoleName) return showError('Please select a role.');

    setSubmitting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      let tx;
      showInfo("Initiating blockchain transaction...");
      if (newRoleName === 'VERIFIER') {
        if (!selectedVerifierRole) return showError('Please select a Verifier Organization');
        const orgName = verifierRoles.find(r => r.id === selectedVerifierRole)?.organizationName;
        tx = await contract.verifyOrganization(trimmedUserId, orgName);
      } else if (newRoleName === 'GOVERNMENT') {
        tx = await contract.addGovernment(trimmedUserId);
      } else if (newRoleName === 'ADMIN') {
        tx = await contract.addAdmin(trimmedUserId);
      } else {
        throw new Error(`Unsupported role: ${newRoleName}`);
      }

      await tx.wait();
      await api.put('/role-request/add-role', { userId: trimmedUserId, roleName: newRoleName, verifierRoleId: newRoleName === 'VERIFIER' ? selectedVerifierRole : null });
      
      showSuccess(`Member added successfully as ${newRoleName}!`);
      setShowAddMemberPopup(false);
      setNewUserId('');
      setNewRoleName('');
      fetchUsers();
    } catch (err: any) {
      showError(err.reason || "Transaction failed");
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

  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString();
  const shortenWallet = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A';

  if (loading && !currentUser) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-green-600" /></div>;
  if (!currentUser || currentUser.role !== 'ADMIN') return <div className="flex flex-col justify-center items-center h-64 space-y-4"><Shield className="h-12 w-12 text-red-500" /><h3 className="text-lg font-bold">Access Denied</h3></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl"><Users className="h-6 w-6 text-white" /></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-500">{activeSection === 'users' ? 'Manage users and roles' : activeSection === 'retire' ? 'Retire carbon credits' : 'View retirement certificates'}</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
          {['users', 'retire', 'certificates'].map((sec) => (
            <button key={sec} onClick={() => setActiveSection(sec as any)} className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeSection === sec ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>
              {sec === 'users' ? <Users className="w-4 h-4" /> : sec === 'retire' ? <Leaf className="w-4 h-4" /> : <Award className="w-4 h-4" />}
              {sec.charAt(0).toUpperCase() + sec.slice(1)} {sec === 'certificates' && `(${myCertificates.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">User List</h3>
            <div className="flex space-x-2">
              <button onClick={fetchUsers} className="px-4 py-2 border rounded-xl hover:bg-gray-50 flex items-center space-x-2"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span>Refresh</span></button>
              <button onClick={() => setShowAddMemberPopup(true)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium flex items-center space-x-2"><Plus className="h-5 w-5" /><span>Add Member</span></button>
            </div>
          </div>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            {roles.map((role) => (
              <button key={role} onClick={() => setActiveRole(role)} className={`px-4 py-2 rounded-lg font-medium flex-1 transition-all ${activeRole === role ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>
                {role} <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{usersByRole[role]?.length || 0}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {usersByRole[activeRole]?.map((user) => (
              <div key={user.id} className="bg-white rounded-2xl p-6 border border-gray-100 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">{user.userId.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h4 className="font-bold">Wallet: {shortenWallet(user.userId)}</h4>
                    <p className="text-sm text-gray-500">Role: {user.role} {user.email && `| Email: ${user.email}`}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(user)} className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"><Eye className="h-4 w-4" /><span>Details</span></button>
              </div>
            ))}
          </div>

          {showAddMemberPopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-xl font-bold mb-6">Add New Member</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Wallet Address</label>
                    <input type="text" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="0x..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select value={newRoleName} onChange={(e) => {setNewRoleName(e.target.value); setSelectedVerifierRole('');}} className="w-full p-3 border rounded-xl">
                      <option value="">Select Role</option>
                      <option value="VERIFIER">Verifier</option>
                      <option value="GOVERNMENT">Government</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  {newRoleName === 'VERIFIER' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Verifier Organization</label>
                      <select value={selectedVerifierRole} onChange={(e) => setSelectedVerifierRole(e.target.value)} className="w-full p-3 border rounded-xl">
                        <option value="">Select Organization</option>
                        {verifierRoles.map((vr) => <option key={vr.id} value={vr.id}>{vr.organizationName}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={() => setShowAddMemberPopup(false)} className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Cancel</button>
                    <button onClick={handleAddMember} disabled={submitting} className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold disabled:opacity-50 flex items-center space-x-2">
                      {submitting && <Loader2 className="animate-spin h-4 w-4" />}<span>Add Member</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold">User Details</h3>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X /></button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase font-bold">Wallet Address</p>
                    <p className="font-mono text-sm break-all">{selectedUser.userId}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-bold">Role</p>
                      <p className="font-bold">{selectedUser.role}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase font-bold">Joined</p>
                      <p className="font-bold">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</p>
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
            {['select', 'confirm', 'processing', 'success'].map((s, index) => (
              <div key={s} className={`flex-1 py-4 text-center text-sm font-bold flex items-center justify-center gap-2 ${retireStep === s ? 'bg-white text-green-700 border-b-2 border-green-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${retireStep === s ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>{index + 1}</div>
                <span className="hidden sm:inline">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </div>
            ))}
          </div>

          <div className="p-6">
            {retireStep === 'select' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Available Credits</h3>
                  <button onClick={loadMyCredits} className="text-green-600 font-bold flex items-center gap-1"><RefreshCw className={loadingCredits ? 'animate-spin' : ''} />Refresh</button>
                </div>
                {loadingCredits ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-green-600" /></div> : myCredits.length === 0 ? <div className="text-center py-12"><TreePine className="h-12 w-12 text-gray-200 mx-auto" /><p className="text-gray-500 mt-2">No credits available</p></div> : (
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {myCredits.map(c => (
                      <div key={c.tokenId} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${retireItems.some(i => i.tokenId === c.tokenId) ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${retireItems.some(i => i.tokenId === c.tokenId) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}><TreePine /></div>
                          <div><p className="font-bold">Project {c.projectId.slice(0, 8)}...</p><p className="text-xs text-gray-500">Token #{c.tokenId} | Bal: {c.availableBalance}</p></div>
                        </div>
                        <button onClick={() => retireItems.some(i => i.tokenId === c.tokenId) ? removeRetireItem(c.tokenId) : addRetireItem(c)} className={`p-2 rounded-xl ${retireItems.some(i => i.tokenId === c.tokenId) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {retireItems.some(i => i.tokenId === c.tokenId) ? <Minus /> : <Plus />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {retireItems.length > 0 && (
                  <div className="border-t pt-6 space-y-4">
                    <h4 className="font-bold">Selected for Retirement ({retireItems.length}/10)</h4>
                    {retireItems.map(item => (
                      <div key={item.tokenId} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                        <div><p className="font-bold">Token #{item.tokenId}</p><p className="text-xs text-gray-500">Project {item.projectId.slice(0, 8)}...</p></div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
                            <button onClick={() => updateAmount(item.tokenId, item.amount - 1)} disabled={item.amount <= 1} className="p-1"><Minus className="w-4 h-4" /></button>
                            <input type="number" value={item.amount} onChange={(e) => updateAmount(item.tokenId, parseInt(e.target.value) || 1)} className="w-12 text-center font-bold outline-none" />
                            <button onClick={() => updateAmount(item.tokenId, item.amount + 1)} disabled={item.amount >= item.maxAmount} className="p-1"><Plus className="w-4 h-4" /></button>
                          </div>
                          <button onClick={() => removeRetireItem(item.tokenId)} className="text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4">
                      <p className="font-bold">Total: <span className="text-2xl text-green-600">{getTotalAmount()} tCO₂e</span></p>
                      <button onClick={() => setRetireStep('confirm')} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">Continue <ChevronRight /></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {retireStep === 'confirm' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold">Confirm Retirement</h3>
                <div className="bg-green-600 rounded-2xl p-8 text-white text-center shadow-lg shadow-green-100">
                  <p className="text-green-100 uppercase font-bold tracking-widest text-xs">Total Credits to Burn</p>
                  <p className="text-5xl font-black mt-2">{getTotalAmount()} <span className="text-xl font-normal">tCO₂e</span></p>
                  <p className="text-green-100 mt-2 text-sm">Credits will be permanently removed from circulation.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800">
                  <AlertTriangle className="flex-shrink-0" />
                  <p className="text-sm">This action is permanent and cannot be reversed. A retirement certificate will be issued upon completion.</p>
                </div>
                <div className="flex justify-between pt-6">
                  <button onClick={() => setRetireStep('select')} className="px-8 py-3 border rounded-xl font-bold">Back</button>
                  <button onClick={handleRetire} disabled={processing} className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                    {processing ? <Loader2 className="animate-spin" /> : <Leaf />} Confirm & Retire
                  </button>
                </div>
              </div>
            )}

            {retireStep === 'processing' && (
              <div className="text-center py-16 space-y-4">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto"><Loader2 className="w-12 h-12 text-green-600 animate-spin" /></div>
                <h3 className="text-2xl font-bold">Processing Transaction</h3>
                <p className="text-gray-500">Please confirm and wait for the blockchain confirmation...</p>
              </div>
            )}

            {retireStep === 'success' && certificate && (
              <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center"><CheckCircle className="h-16 w-16 text-green-600 mx-auto" /><h3 className="text-3xl font-black mt-4">Retirement Successful!</h3></div>
                <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-3xl p-8 border-2 border-green-200 shadow-xl shadow-green-50">
                   <div className="text-center border-b pb-6 mb-6">
                      <p className="text-green-600 uppercase font-black tracking-widest text-xs">Certificate of Carbon Retirement</p>
                      <h4 className="text-4xl font-black mt-2">#{certificate.certificateId}</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-8 mb-8 text-center">
                      <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Value</p><p className="text-3xl font-black text-green-700">{certificate.totalValue} tCO₂e</p></div>
                      <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Issue Date</p><p className="font-bold">{formatDate(certificate.timestamp)}</p></div>
                   </div>
                   <div className="text-center"><a href={`https://sepolia.etherscan.io/tx/${certificate.txHash}`} target="_blank" className="text-blue-600 font-bold flex items-center justify-center gap-1 hover:underline"><ExternalLink className="w-4 h-4" /> View Transaction</a></div>
                </div>
                <button onClick={resetRetireFlow} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100">Retire More Credits</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'certificates' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">My Retirement History</h3>
            <button onClick={loadMyCertificates} className="p-2 hover:bg-gray-100 rounded-xl"><RefreshCw className="h-4 w-4 text-gray-400" /></button>
          </div>
          {myCertificates.length === 0 ? <div className="text-center py-12"><Award className="h-12 w-12 text-gray-200 mx-auto" /><p className="text-gray-500 mt-2">No certificates issued yet</p></div> : (
            <div className="space-y-3">
              {myCertificates.map(cert => (
                <div key={cert.certificateId} onClick={() => viewCertificateDetails(cert.certificateId)} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-green-100 group">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Award /></div>
                      <div>
                         <p className="font-bold text-lg">Certificate #{cert.certificateId}</p>
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