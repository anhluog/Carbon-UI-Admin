import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserPlus, Shield, Trash2, Search, 
  Award, Leaf, Plus, Minus, X, AlertTriangle,
  Loader2, Check, ChevronRight, Clock, ExternalLink,
  TreePine, RefreshCw, FileText, Download, Eye
} from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCredit from '../abi/CarbonCreditSystem.json';

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

// ✅ THÊM: Interface cho Retire
interface MyCreditResponse {
  creditId: string;
  tokenId: number;
  projectId: string;
  availableBalance: string; // BigInteger từ Java
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
  // ✅ Verifier roles
const [verifierRoles, setVerifierRoles] = useState<VerifierRole[]>([]);
const [verifierRolesLoading, setVerifierRolesLoading] = useState(false);
const [selectedVerifierRole, setSelectedVerifierRole] = useState('');

// ✅ Submit state
const [submitting, setSubmitting] = useState(false);
const roles = ['USER', 'OWNER', 'VERIFIER', 'GOVERNMENT', 'ADMIN'];

  // ✅ THÊM: States cho Retire Credits
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

  // ✅ Load My Credits từ API
  const loadMyCredits = useCallback(async () => {
    if (!currentUser?.userId) return;
    
    try {
      setLoadingCredits(true);
      setRetireError('');
      
      const response = await api.get('/wallet/my-credits');
      const credits: MyCreditResponse[] = response.data;
      
      // Filter credits có balance > 0
      const availableCredits = credits.filter(c => 
        parseInt(c.availableBalance) > 0
      );
      
      setMyCredits(availableCredits);
      console.log('✅ Loaded', availableCredits.length, 'credits');
    } catch (err: any) {
      console.error('Failed to load credits:', err);
      setRetireError('Failed to load your credits');
    } finally {
      setLoadingCredits(false);
    }
  }, [currentUser]);

  // ✅ Load Certificates từ blockchain
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
      console.warn('Could not load certificates:', err);
    }
  }, [currentUser, CONTRACT_ADDRESS]);

  // ✅ Load khi chuyển sang section retire
  useEffect(() => {
    if (activeSection === 'retire' && myCredits.length === 0) {
      loadMyCredits();
    }
    if (activeSection === 'certificates' && myCertificates.length === 0) {
      loadMyCertificates();
    }
  }, [activeSection, loadMyCredits, loadMyCertificates, myCredits.length, myCertificates.length]);

  // ✅ Thêm/xóa credit khỏi danh sách retire
  const addRetireItem = (credit: MyCreditResponse) => {
    if (retireItems.find(item => item.tokenId === credit.tokenId)) return;
    if (retireItems.length >= 10) {
      setRetireError('Maximum 10 different credit types allowed');
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

  const getTotalAmount = () => {
    return retireItems.reduce((sum, item) => sum + item.amount, 0);
  };

  // ✅ Thực hiện retire
  const handleRetire = async () => {
    if (retireItems.length === 0) {
      setRetireError('Please select at least one credit to retire');
      return;
    }

    setRetireStep('processing');
    setProcessing(true);
    setRetireError('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      const creditTokenIds = retireItems.map(item => item.tokenId);
      const amounts = retireItems.map(item => item.amount);

      console.log('🔥 Retiring credits:', { creditTokenIds, amounts });

      const tx = await contract.retireCreditBatch(creditTokenIds, amounts);
      console.log('📝 Tx sent:', tx.hash);

      const receipt = await tx.wait(1);
      console.log('✅ Tx confirmed:', receipt);

      // Lấy certificateId từ event
      let certificateId = 0;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          if (parsed?.name === 'BatchCertificateRetired') {
            certificateId = Number(parsed.args.certificateId);
            break;
          }
        } catch {
          continue;
        }
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

      setRetireStep('success');
      loadMyCertificates();
      loadMyCredits();

    } catch (err: any) {
      console.error('Retire failed:', err);
      setRetireStep('confirm');
      
      if (err.code === 'ACTION_REJECTED') {
        setRetireError('Transaction was rejected');
      } else if (err.reason) {
        setRetireError('Contract error: ' + err.reason);
      } else {
        setRetireError(err.message || 'Retirement failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  // ✅ View certificate details
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
      console.error('Failed to load certificate:', err);
    }
  };

  const resetRetireFlow = () => {
    setRetireStep('select');
    setRetireItems([]);
    setCertificate(null);
    setCertificateRecords([]);
    setRetireError('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shortenAddress = (addr: string) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  };

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
    
    // 1. Validate cơ bản
    if (!trimmedUserId || !ethers.isAddress(trimmedUserId)) {
      alert('Invalid wallet address.');
      return;
    }
    if (!newRoleName) {
      alert('Please select a role.');
      return;
    }

    setSubmitting(true);
    
    try {
      const contractAddress = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;
      if (!contractAddress || !ethers.isAddress(contractAddress)) {
        throw new Error('Contract address configuration error.');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CarbonCredit.abi, signer);

      let tx;
      console.log(`🚀 Starting transaction for role: ${newRoleName}`);

      // 2. Logic phân chia Role
      if (newRoleName === 'VERIFIER') {
        // --- XỬ LÝ VERIFIER ---
        if (!selectedVerifierRole) {
          alert('Please select a Verifier Organization');
          setSubmitting(false);
          return;
        }

        const selectedRoleData = verifierRoles.find(r => r.id === selectedVerifierRole);
        const orgName = selectedRoleData?.organizationName;

        if (!orgName) {
          alert('Invalid Verifier Role data (Missing organization name)');
          setSubmitting(false);
          return;
        }

        console.log(`Calling verifyOrganization('${trimmedUserId}', '${orgName}')`);
        // ⚠️ Nếu ABI chưa update, dòng này sẽ gây lỗi "no matching fragment"
        tx = await contract.verifyOrganization(trimmedUserId, orgName);

      } else if (newRoleName === 'GOVERNMENT') {
        // --- XỬ LÝ GOVERNMENT ---
        console.log(`Calling addGovernment('${trimmedUserId}')`);
        tx = await contract.addGovernment(trimmedUserId);

      } else if (newRoleName === 'ADMIN') {
        // --- XỬ LÝ ADMIN ---
        console.log(`Calling addAdmin('${trimmedUserId}')`);
        tx = await contract.addAdmin(trimmedUserId);

      } else {
        throw new Error(`Unsupported role selected: ${newRoleName}`);
      }

      console.log('📝 Tx sent:', tx.hash);
      const receipt = await tx.wait(1);
      console.log('✅ Tx confirmed:', receipt);

      // 3. Gọi API Backend sau khi Blockchain thành công
      await api.put('/role-request/add-role', { 
        userId: trimmedUserId, 
        roleName: newRoleName,
        // Gửi thêm verifierRoleId nếu là Verifier (Backend cần cái này để lưu ID)
        verifierRoleId: newRoleName === 'VERIFIER' ? selectedVerifierRole : null 
      });

      // 4. Reset Form
      setShowAddMemberPopup(false);
      setNewUserId('');
      setNewRoleName('');
      setSelectedVerifierRole('');
      fetchVerifierRoles();
      alert(`Member added successfully!`);

    } catch (err: any) {
      console.error('❌ Add member error:', err);
      
      // Xử lý thông báo lỗi chi tiết
      let errorMessage = err.message || 'Transaction failed';
      
      if (err.code === 'UNSUPPORTED_OPERATION' && err.operation === 'fragment') {
        errorMessage = 'ABI Mismatch! Please update CarbonCreditSystem.json in frontend.';
      } else if (err.reason) {
        errorMessage = `Contract Error: ${err.reason}`;
      } else if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'User rejected transaction.';
      }

      alert(errorMessage);
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
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-500">
                {activeSection === 'users' && 'Manage users and roles'}
                {activeSection === 'retire' && 'Retire your carbon credits'}
                {activeSection === 'certificates' && 'View retirement certificates'}
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveSection('users')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeSection === 'users'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            User Management
          </button>
          <button
            onClick={() => setActiveSection('retire')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeSection === 'retire'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Leaf className="w-4 h-4" />
            Retire Credits
          </button>
          <button
            onClick={() => setActiveSection('certificates')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeSection === 'certificates'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Award className="w-4 h-4" />
            Certificates ({myCertificates.length})
          </button>
        </div>
      </div>

      {/* Content based on active section */}
      {activeSection === 'users' && (
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex-1 ${activeRole === role
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
      )}

      {/* ✅ RETIRE CREDITS SECTION */}
      {activeSection === 'retire' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Progress Steps */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            {[
              { key: 'select', label: 'Select Credits', icon: TreePine },
              { key: 'confirm', label: 'Confirm', icon: FileText },
              { key: 'processing', label: 'Processing', icon: Loader2 },
              { key: 'success', label: 'Certificate', icon: Award }
            ].map((s, index) => {
              const stepKeys = ['select', 'confirm', 'processing', 'success'];
              const currentIndex = stepKeys.indexOf(retireStep);
              const isActive = index === currentIndex;
              const isCompleted = index < currentIndex;
              const Icon = s.icon;
              
              return (
                <div 
                  key={s.key}
                  className={`flex-1 py-4 px-4 text-center text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isActive ? 'bg-white text-green-700 border-b-2 border-green-600' :
                    isCompleted ? 'text-green-600 bg-green-50' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    isCompleted ? 'bg-green-600 text-white' :
                    isActive ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive && s.key === 'processing' ? 'animate-spin' : ''}`} />}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className="p-6">
            {/* Error Message */}
            {retireError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-0.5">{retireError}</p>
                </div>
                <button onClick={() => setRetireError('')} className="p-1 hover:bg-red-100 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 1: Select Credits */}
            {retireStep === 'select' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Your Carbon Credits</h3>
                  <button
                    onClick={loadMyCredits}
                    disabled={loadingCredits}
                    className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingCredits ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {loadingCredits ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                  </div>
                ) : myCredits.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <TreePine className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No carbon credits available</p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
                    {myCredits.map(credit => {
                      const isSelected = retireItems.some(item => item.tokenId === credit.tokenId);
                      
                      return (
                        <div
                          key={credit.tokenId}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-green-600' : 'bg-gray-100'
                            }`}>
                              <TreePine className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Project {credit.projectId.slice(0, 8)}...</p>
                              <p className="text-sm text-gray-500">Token #{credit.tokenId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">{credit.availableBalance}</p>
                              <p className="text-xs text-gray-400">tCO₂e</p>
                            </div>
                            <button
                              onClick={() => isSelected ? removeRetireItem(credit.tokenId) : addRetireItem(credit)}
                              className={`p-2.5 rounded-xl transition-all ${
                                isSelected
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              {isSelected ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Items */}
                {retireItems.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Credits to Retire ({retireItems.length}/10)
                    </h3>
                    <div className="space-y-3">
                      {retireItems.map(item => (
                        <div
                          key={item.tokenId}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                        >
                          <div>
                            <p className="font-medium text-gray-900">Token #{item.tokenId}</p>
                            <p className="text-sm text-gray-500">Project {item.projectId.slice(0, 8)}...</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                              <button
                                onClick={() => updateAmount(item.tokenId, item.amount - 1)}
                                disabled={item.amount <= 1}
                                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) => updateAmount(item.tokenId, parseInt(e.target.value) || 1)}
                                min={1}
                                max={item.maxAmount}
                                className="w-16 text-center font-semibold text-gray-900 border-0 focus:ring-0"
                              />
                              <button
                                onClick={() => updateAmount(item.tokenId, item.amount + 1)}
                                disabled={item.amount >= item.maxAmount}
                                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-sm text-gray-400">/ {item.maxAmount}</span>
                            <button
                              onClick={() => removeRetireItem(item.tokenId)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">Total to retire</p>
                    <p className="text-3xl font-bold text-green-600">
                      {getTotalAmount()} <span className="text-lg font-normal text-gray-500">tCO₂e</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setRetireStep('confirm')}
                    disabled={retireItems.length === 0}
                    className="px-8 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Confirm */}
            {retireStep === 'confirm' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Retirement</h3>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <Leaf className="w-9 h-9" />
                    </div>
                    <div>
                      <p className="text-green-100 text-sm">Total Carbon Credits</p>
                      <p className="text-4xl font-bold">{getTotalAmount()} tCO₂e</p>
                      <p className="text-green-100 text-sm mt-1">{retireItems.length} credit type(s)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">This action is permanent</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Credits will be burned on-chain and cannot be recovered.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <button
                    onClick={() => setRetireStep('select')}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRetire}
                    className="px-8 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2"
                  >
                    <Leaf className="w-5 h-5" />
                    Retire {getTotalAmount()} tCO₂e
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {retireStep === 'processing' && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Retirement</h3>
                <p className="text-gray-500">Please confirm in your wallet...</p>
              </div>
            )}

            {/* Step 4: Success */}
            {retireStep === 'success' && certificate && (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Retirement Successful! 🎉</h3>
                  <p className="text-gray-500">Your credits have been permanently retired</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-8 border-2 border-green-200">
                  <div className="text-center border-b border-green-200 pb-6 mb-6">
                    <p className="text-xs text-green-600 uppercase tracking-widest font-semibold">
                      Certificate of Retirement
                    </p>
                    <p className="text-4xl font-bold text-green-800 mt-2">#{certificate.certificateId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Amount</p>
                      <p className="text-2xl font-bold text-green-700">{certificate.totalValue} tCO₂e</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Date</p>
                      <p className="text-lg font-semibold text-gray-700">{formatDate(certificate.timestamp)}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${certificate.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      View Transaction <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetRetireFlow}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg"
                  >
                    Retire More Credits
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ CERTIFICATES SECTION */}
      {activeSection === 'certificates' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Retirement Certificates</h3>
            <button
              onClick={loadMyCertificates}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {myCertificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No certificates yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCertificates.map(cert => (
                <div 
                  key={cert.certificateId}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all cursor-pointer border border-green-100"
                  onClick={() => viewCertificateDetails(cert.certificateId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Award className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">Certificate #{cert.certificateId}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <TreePine className="w-3.5 h-3.5" />
                          {cert.totalValue} tCO₂e
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(cert.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
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