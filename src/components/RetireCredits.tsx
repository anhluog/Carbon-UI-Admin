import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, Leaf, Plus, Minus, X, AlertTriangle,
  Loader2, Check, ChevronRight, Clock, ExternalLink,
  TreePine, RefreshCw, FileText, Wallet, Palette,
  Sparkles, Globe2, Sun, Waves
} from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCredit from '../abi/CarbonCreditExchange.json';

// --- INTERFACES ---

// Response từ API /wallet/my-credits
interface MyCreditResponse {
  creditId: string;
  tokenId: number;
  projectId: string;
  availableBalance: string;
}

// Item được chọn để retire
interface RetireItem {
  tokenId: number;
  creditId: string;
  projectId: string;
  amount: number;
  maxAmount: number;
}

// State hiển thị Certificate (Mapping từ API Detail)
interface Certificate {
  certificateId: string;
  retiredBy: string;
  totalValue: number;
  timestamp: string; // ISO String từ Java
  txHash: string;
  nftTokenId?: number;
}

// Record chi tiết trong Certificate
interface CertificateRecord {
  creditTokenId: number;
  creditAmount: number;
}

// Template Types
type TemplateType = 'classic' | 'forest' | 'ocean' | 'sunset' | 'earth';

interface TemplateInfo {
  id: TemplateType;
  name: string;
  description: string;
  icon: React.ElementType;
  colors: {
    primary: string;
    secondary: string;
    bg: string;
    border: string;
    text: string;
  };
  preview: string;
}

// --- TEMPLATES CONFIGURATION (Theme Green chuẩn hệ thống) ---
const TEMPLATES: TemplateInfo[] = [
  {
    id: 'classic',
    name: 'Classic Green',
    description: 'Standard Certified Style',
    icon: Leaf,
    colors: {
      primary: 'from-green-600 to-green-700',
      secondary: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 via-white to-green-50',
      border: 'border-green-200',
      text: 'text-green-700'
    },
    preview: 'bg-green-50 border-green-200'
  },
  {
    id: 'forest',
    name: 'Deep Forest',
    description: 'Premium Nature Style',
    icon: TreePine,
    colors: {
      primary: 'from-emerald-800 to-green-900',
      secondary: 'from-emerald-700 to-green-800',
      bg: 'from-emerald-50 via-white to-green-100',
      border: 'border-emerald-300',
      text: 'text-emerald-800'
    },
    preview: 'bg-emerald-50 border-emerald-300'
  },
  {
    id: 'ocean',
    name: 'Ocean Teal',
    description: 'Clean & Calm',
    icon: Waves,
    colors: {
      primary: 'from-teal-600 to-cyan-700',
      secondary: 'from-teal-500 to-cyan-600',
      bg: 'from-cyan-50 via-white to-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700'
    },
    preview: 'bg-cyan-50 border-cyan-200'
  }
];

const RetireCredits: React.FC = () => {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState<'retire' | 'certificates'>('retire');
  
  // Data States
  const [myCredits, setMyCredits] = useState<MyCreditResponse[]>([]);
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  
  // Selection States
  const [retireItems, setRetireItems] = useState<RetireItem[]>([]);
  const [retireStep, setRetireStep] = useState<'select' | 'template' | 'confirm' | 'processing' | 'success'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  
  // Processing States
  const [processing, setProcessing] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [retireError, setRetireError] = useState('');
  
  // Detail View States
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [certificateRecords, setCertificateRecords] = useState<CertificateRecord[]>([]);

  const CONTRACT_ADDRESS = import.meta.env.VITE_EXCHANGE_CONTRACT_ADDRESS;
  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  // --- API FUNCTIONS ---

  // 1. Load Credits Available
  const loadMyCredits = useCallback(async () => {
    try {
      setLoadingCredits(true);
      setRetireError('');
      const response = await api.get('/wallet/my-credits');
      // Lọc những credit có số dư > 0
      const available = response.data.filter((c: MyCreditResponse) => parseFloat(c.availableBalance) > 0);
      setMyCredits(available);
    } catch (err: any) {
      console.error('Load credits error:', err);
      setRetireError('Failed to load credits');
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  // 2. Load My Certificates (API LIST)
  const loadMyCertificates = useCallback(async () => {
    try {
      setLoadingCertificates(true);
      // Gọi API lấy danh sách: /my-certificate
      const response = await api.get('/certificates/my-certificate'); 
      const data = response.data;

      // Map dữ liệu trả về từ API List
      const certs: Certificate[] = data.map((item: any) => ({
        certificateId: item.certificateId,
        retiredBy: item.userId,
        totalValue: Number(item.totalAmount),
        timestamp: item.createdAt, // LocalDateTime ISO String
        txHash: '', // List API chưa có hash, sẽ lấy khi view detail
        nftTokenId: 0
      }));

      // Sort mới nhất lên đầu
      certs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMyCertificates(certs);
    } catch (err) {
      console.error('Load certificates error:', err);
    } finally {
      setLoadingCertificates(false);
    }
  }, []);

  // 3. View Certificate Details (API DETAIL)
  const viewCertificateDetails = async (certId: string) => {
    try {
      // Gọi API lấy chi tiết: /certificate-detail?certId=...
      const response = await api.get(`/certificates/certificate-detail`, {
        params: { certId }
      });
      const data = response.data;

      // Update State Certificate đang xem
      setCertificate({
        certificateId: data.certificateId,
        retiredBy: data.userId,
        totalValue: Number(data.totalAmount),
        timestamp: data.createdAt,
        txHash: data.onchainTxHash, // Có hash từ backend
        nftTokenId: Number(data.nftTokenId)
      });

      // Map records detail
      setCertificateRecords(data.records.map((r: any) => ({
        creditTokenId: Number(r.tokenId),
        creditAmount: Number(r.amount)
      })));

      // Load template đã lưu (nếu có)
      const savedTemplate = localStorage.getItem(`cert_template_${certId}`) as TemplateType;
      if (savedTemplate && TEMPLATES.find(t => t.id === savedTemplate)) {
        setSelectedTemplate(savedTemplate);
      }

      // Chuyển UI sang màn hình xem detail (dùng chung giao diện success)
      setRetireStep('success');
      setActiveTab('retire');

    } catch (err) {
      console.error('Load detail error:', err);
      alert('Failed to load certificate details');
    }
  };

  // --- EFFECT HOOKS ---
  useEffect(() => {
    loadMyCredits();
  }, [loadMyCredits]);

  useEffect(() => {
    if (activeTab === 'certificates') {
      loadMyCertificates();
    }
  }, [activeTab, loadMyCertificates]);

  // --- HELPER FUNCTIONS ---

  const formatDate = (dateInput: string) => {
    if (!dateInput) return 'Unknown Date';
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

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
    setRetireError('');
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

  const resetRetireFlow = () => {
    setRetireStep('select');
    setRetireItems([]);
    setCertificate(null);
    setCertificateRecords([]);
    setRetireError('');
    setSelectedTemplate('classic');
  };

  // --- ACTION: RETIRE ON BLOCKCHAIN ---
  const handleRetire = async () => {
    if (retireItems.length === 0) return setRetireError('Select credits to retire');
    
    setRetireStep('processing');
    setProcessing(true);
    setRetireError('');

    try {
      if (!window.ethereum) throw new Error('MetaMask not found');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      const creditTokenIds = retireItems.map(item => item.tokenId);
      const amounts = retireItems.map(item => item.amount);

      // 1. Gọi Smart Contract
      const tx = await contract.retireCredits(creditTokenIds, amounts);
      const receipt = await tx.wait(1);

      // 2. Chờ Backend Index (Trong thực tế nên dùng Webhook hoặc Polling)
      // Ở đây ta giả lập việc gọi lại API detail sau 2s để lấy dữ liệu mới nhất từ DB
      setTimeout(async () => {
        // Parse logs để lấy certId tạm thời (nếu cần hiển thị ngay) hoặc reload list
        // Với demo này, ta sẽ reset về màn hình success và hiển thị thông tin vừa gửi
        
        // Tạo object Certificate tạm thời để hiển thị ngay lập tức
        setCertificate({
          certificateId: 'PENDING...', // ID sẽ được backend generate
          retiredBy: 'You',
          totalValue: getTotalAmount(),
          timestamp: new Date().toISOString(),
          txHash: tx.hash,
          nftTokenId: 0
        });
        
        setCertificateRecords(retireItems.map(item => ({
            creditTokenId: item.tokenId,
            creditAmount: item.amount
        })));

        setRetireStep('success');
        setProcessing(false);
        loadMyCredits(); // Reload balance
      }, 2000);

    } catch (err: any) {
      console.error('Retire failed:', err);
      setRetireStep('confirm');
      setRetireError(err.reason || err.message || 'Transaction failed');
      setProcessing(false);
    }
  };

  // --- RENDER COMPONENT ---
  const renderCertificateContent = () => {
    if (!certificate) return null;
    const t = currentTemplate;
    const Icon = t.icon;

    return (
      <div className={`bg-gradient-to-br ${t.colors.primary} rounded-3xl p-1 shadow-2xl mx-auto max-w-2xl`}>
        <div className={`bg-gradient-to-br ${t.colors.bg} rounded-[22px] p-8 relative overflow-hidden`}>
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className={`absolute -top-10 -left-10 w-40 h-40 border-8 ${t.colors.border} rounded-full`} />
            <div className={`absolute -bottom-10 -right-10 w-60 h-60 border-8 ${t.colors.border} rounded-full`} />
          </div>

          <div className="relative text-center">
            {/* Header */}
            <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${t.colors.secondary} shadow-lg mb-6 ring-4 ring-white`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${t.colors.primary} mb-2 uppercase tracking-wide`}>
              Certificate of Retirement
            </h1>
            <p className="text-gray-500 font-medium mb-6">Carbon Credit Offset Verification</p>

            {/* Main Value */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 mb-8 shadow-sm">
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Total Offset</p>
              <div className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${t.colors.primary}`}>
                {certificate.totalValue} <span className="text-2xl text-gray-600">tCO₂e</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-left mb-8">
              <div className="bg-white/50 rounded-xl p-3 border border-white/60">
                <p className="text-xs text-gray-400 uppercase">Certificate ID</p>
                <p className="font-mono font-bold text-gray-800 truncate" title={certificate.certificateId}>
                  #{certificate.certificateId.length > 10 ? certificate.certificateId.slice(0, 10) + '...' : certificate.certificateId}
                </p>
              </div>
              <div className="bg-white/50 rounded-xl p-3 border border-white/60">
                <p className="text-xs text-gray-400 uppercase">Date Issued</p>
                <p className="font-medium text-gray-800">{formatDate(certificate.timestamp)}</p>
              </div>
            </div>

            {/* Token List */}
            {certificateRecords.length > 0 && (
              <div className="bg-white/40 rounded-xl p-4 border border-white/50 mb-6 text-left">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                  <TreePine className="w-3 h-3" /> Breakdown
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {certificateRecords.map((rec, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b border-gray-200/50 pb-1 last:border-0">
                      <span className="text-gray-600">Token ID #{rec.creditTokenId}</span>
                      <span className="font-bold text-gray-800">{rec.creditAmount} tCO₂e</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 flex flex-col items-center gap-2">
              {certificate.txHash && (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${certificate.txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  View on Blockchain <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className={`text-xs font-semibold ${t.colors.text} flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full`}>
                <Check className="w-3 h-3" /> Authenticity Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Leaf className="w-6 h-6 text-green-600" /> Retire Credits
            </h2>
            <p className="text-sm text-gray-500 mt-1">Convert your carbon credits into permanent environmental offsets.</p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto inline-flex">
          <button
            onClick={() => { setActiveTab('retire'); resetRetireFlow(); }}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'retire' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Leaf className="w-4 h-4" /> Retire New
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'certificates' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Award className="w-4 h-4" /> My Certificates
          </button>
        </div>
      </div>

      {/* --- TAB: RETIRE --- */}
      {activeTab === 'retire' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Steps Indicator */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            {['select', 'template', 'confirm', 'processing', 'success'].map((step, idx) => {
              const currentIdx = ['select', 'template', 'confirm', 'processing', 'success'].indexOf(retireStep);
              const isActive = idx === currentIdx;
              const isDone = idx < currentIdx;
              return (
                <div key={step} className={`flex-1 py-3 border-b-2 flex justify-center items-center gap-2 text-sm font-medium ${isActive ? 'border-green-600 text-green-700 bg-white' : 'border-transparent text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive || isDone ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                    {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <span className="hidden md:inline capitalize">{step}</span>
                </div>
              );
            })}
          </div>

          <div className="p-6">
            {/* Error Alert */}
            {retireError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span>{retireError}</span>
                <button onClick={() => setRetireError('')} className="ml-auto hover:bg-red-100 p-1 rounded"><X className="w-4 h-4"/></button>
              </div>
            )}

            {/* STEP 1: SELECT */}
            {retireStep === 'select' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Select Credits from Wallet</h3>
                  <button onClick={loadMyCredits} disabled={loadingCredits} className="text-sm text-green-600 hover:underline flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${loadingCredits ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {loadingCredits ? (
                  <div className="py-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500"/>Loading wallet...</div>
                ) : myCredits.length === 0 ? (
                  <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No credits found in your wallet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 mb-6">
                    {myCredits.map(credit => {
                      const isSelected = retireItems.some(i => i.tokenId === credit.tokenId);
                      return (
                        <div key={credit.tokenId} 
                          onClick={() => isSelected ? removeRetireItem(credit.tokenId) : addRetireItem(credit)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'}`}
                        >
                          <div>
                            <p className="font-bold text-gray-800">Token #{credit.tokenId}</p>
                            <p className="text-xs text-gray-500">Project ID: {credit.projectId.substring(0, 8)}...</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-bold">{credit.availableBalance} <span className="text-xs">avail</span></p>
                            {isSelected && <Check className="w-5 h-5 text-green-600 ml-auto" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {retireItems.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Adjust Amounts ({retireItems.length} selected)</h4>
                    <div className="space-y-2 mb-6">
                      {retireItems.map(item => (
                        <div key={item.tokenId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm font-medium">Token #{item.tokenId}</span>
                          <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
                            <button onClick={() => updateAmount(item.tokenId, item.amount - 1)} className="p-1 hover:bg-gray-100 rounded"><Minus className="w-3 h-3"/></button>
                            <input 
                              type="number" 
                              value={item.amount} 
                              onChange={e => updateAmount(item.tokenId, parseInt(e.target.value) || 1)}
                              className="w-12 text-center text-sm border-0 focus:ring-0 p-0"
                            />
                            <button onClick={() => updateAmount(item.tokenId, item.amount + 1)} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-3 h-3"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl mb-4">
                      <span className="text-green-800 font-medium">Total Retirement</span>
                      <span className="text-2xl font-bold text-green-700">{getTotalAmount()} tCO₂e</span>
                    </div>
                    <button 
                      onClick={() => setRetireStep('template')}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                    >
                      Next Step <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: TEMPLATE */}
            {retireStep === 'template' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {TEMPLATES.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${selectedTemplate === t.id ? `border-${t.colors.bg.split('-')[1]}-500 ring-2 ring-${t.colors.bg.split('-')[1]}-200` : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.colors.primary} flex items-center justify-center mb-2`}>
                        {React.createElement(t.icon, { className: "w-4 h-4 text-white" })}
                      </div>
                      <p className="font-bold text-xs text-gray-800">{t.name}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-100 p-6 rounded-2xl flex justify-center">
                  {/* Mock Preview */}
                  <div className={`w-64 aspect-[3/4] bg-gradient-to-br ${currentTemplate.colors.bg} rounded-xl border-4 ${currentTemplate.colors.border} shadow-xl flex flex-col items-center justify-center p-4 text-center transform scale-90`}>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentTemplate.colors.primary} mb-3 flex items-center justify-center`}>
                      {React.createElement(currentTemplate.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div className={`h-2 w-16 bg-gray-200 rounded mb-2`}></div>
                    <div className={`h-8 w-24 bg-gray-900/10 rounded mb-2`}></div>
                    <div className={`h-2 w-20 bg-gray-200 rounded`}></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setRetireStep('select')} className="px-6 py-3 border rounded-xl font-medium hover:bg-gray-50">Back</button>
                  <button onClick={() => setRetireStep('confirm')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">Confirm Style</button>
                </div>
              </div>
            )}

            {/* STEP 3: CONFIRM */}
            {retireStep === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center">
                  <p className="text-green-800 text-sm uppercase tracking-wide font-semibold mb-1">Total to Retire</p>
                  <p className="text-5xl font-black text-green-700">{getTotalAmount()} <span className="text-2xl">tCO₂e</span></p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-3 text-yellow-800 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>Warning: This action is permanent. Retired credits are burned on the blockchain and cannot be reversed or traded.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setRetireStep('template')} className="px-6 py-3 border rounded-xl font-medium hover:bg-gray-50">Back</button>
                  <button onClick={handleRetire} disabled={processing} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Leaf className="w-5 h-5" />}
                    Confirm & Retire
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PROCESSING */}
            {retireStep === 'processing' && (
              <div className="text-center py-16">
                <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Processing Transaction</h3>
                <p className="text-gray-500">Please confirm in your wallet...</p>
              </div>
            )}

            {/* STEP 5: SUCCESS */}
            {retireStep === 'success' && certificate && (
              <div className="space-y-6">
                {renderCertificateContent()}
                <button onClick={resetRetireFlow} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black">Retire More</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: MY CERTIFICATES --- */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">History</h3>
            <button onClick={loadMyCertificates} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className={`w-4 h-4 ${loadingCertificates ? 'animate-spin' : ''}`} /></button>
          </div>

          {loadingCertificates ? (
            <div className="text-center py-12 text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500"/>Loading certificates...</div>
          ) : myCertificates.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">You haven't retired any credits yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCertificates.map(cert => {
                const savedTemplate = localStorage.getItem(`cert_template_${cert.certificateId}`) as TemplateType || 'classic';
                const t = TEMPLATES.find(temp => temp.id === savedTemplate) || TEMPLATES[0];
                return (
                  <div 
                    key={cert.certificateId} 
                    onClick={() => viewCertificateDetails(cert.certificateId)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all bg-gradient-to-r ${t.preview} ${t.colors.border}`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.colors.primary} flex items-center justify-center text-white shadow-lg`}>
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Certificate #{cert.certificateId.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-600">{formatDate(cert.timestamp)}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={`text-xl font-black text-transparent bg-clip-text bg-gradient-to-r ${t.colors.primary}`}>{cert.totalValue}</p>
                      <p className="text-xs text-gray-500">tCO₂e</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetireCredits;