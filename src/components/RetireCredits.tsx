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

interface MyCreditResponse {
  creditId: string;
  tokenId: number;
  projectId: string;
  projectName: string;
  availableBalance: string;
}

interface RetireItem {
  tokenId: number;
  creditId: string;
  projectId: string;
  projectName: string;
  amount: number;
  maxAmount: number;
}

interface Certificate {
  certificateId: string;
  retiredBy: string;
  totalValue: number;
  timestamp: string; 
  txHash: string;
  nftTokenId?: number;
}

interface CertificateRecord {
  projectName: string;
  creditTokenId: number;
  creditAmount: number;
}

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

// --- CẤU HÌNH TEMPLATES (Đã Việt hóa tên và mô tả) ---
const TEMPLATES: TemplateInfo[] = [
  {
    id: 'classic',
    name: 'Xanh Cổ Điển',
    description: 'Phong cách chứng nhận tiêu chuẩn',
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
    name: 'Rừng Già',
    description: 'Phong cách thiên nhiên cao cấp',
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
    name: 'Xanh Đại Dương',
    description: 'Sạch sẽ và điềm tĩnh',
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
  
  const [myCredits, setMyCredits] = useState<MyCreditResponse[]>([]);
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  
  const [retireItems, setRetireItems] = useState<RetireItem[]>([]);
  const [retireStep, setRetireStep] = useState<'select' | 'template' | 'confirm' | 'processing' | 'success'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  
  const [processing, setProcessing] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [retireError, setRetireError] = useState('');
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [certificateRecords, setCertificateRecords] = useState<CertificateRecord[]>([]);

  const CONTRACT_ADDRESS = import.meta.env.VITE_EXCHANGE_CONTRACT_ADDRESS;
  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  // --- API FUNCTIONS ---

  const loadMyCredits = useCallback(async () => {
    try {
      setLoadingCredits(true);
      setRetireError('');
      const response = await api.get('/wallet/my-credits');
      const available = response.data.filter((c: MyCreditResponse) => parseFloat(c.availableBalance) > 0);
      setMyCredits(available);
    } catch (err: any) {
      console.error('Lỗi tải tín chỉ:', err);
      setRetireError('Không thể tải danh sách tín chỉ');
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  const loadMyCertificates = useCallback(async () => {
    try {
      setLoadingCertificates(true);
      const response = await api.get('/certificates/my-certificate'); 
      const data = response.data;

      const certs: Certificate[] = data.map((item: any) => ({
        certificateId: item.certificateId,
        retiredBy: item.userId,
        totalValue: Number(item.totalAmount),
        timestamp: item.createdAt, 
        txHash: '', 
        nftTokenId: 0
      }));

      certs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMyCertificates(certs);
    } catch (err) {
      console.error('Lỗi tải chứng nhận:', err);
    } finally {
      setLoadingCertificates(false);
    }
  }, []);

  const viewCertificateDetails = async (certId: string) => {
    try {
      const response = await api.get(`/certificates/certificate-detail`, {
        params: { certId }
      });
      const data = response.data;

      setCertificate({
        certificateId: data.certificateId,
        retiredBy: data.userId,
        totalValue: Number(data.totalAmount),
        timestamp: data.createdAt,
        txHash: data.onchainTxHash,
        nftTokenId: Number(data.nftTokenId)
      });

      setCertificateRecords(data.records.map((r: any) => ({
        projectName: r.projectName,
        creditTokenId: Number(r.tokenId),
        creditAmount: Number(r.amount)
      })));

      const savedTemplate = localStorage.getItem(`cert_template_${certId}`) as TemplateType;
      if (savedTemplate && TEMPLATES.find(t => t.id === savedTemplate)) {
        setSelectedTemplate(savedTemplate);
      }

      setRetireStep('success');
      setActiveTab('retire');

    } catch (err) {
      console.error('Lỗi tải chi tiết:', err);
      alert('Không thể tải chi tiết chứng nhận');
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
    if (!dateInput) return 'Không rõ ngày';
    const date = new Date(dateInput);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const addRetireItem = (credit: MyCreditResponse) => {
    if (retireItems.find(item => item.tokenId === credit.tokenId)) return;
    if (retireItems.length >= 10) {
      setRetireError('Chỉ cho phép chọn tối đa 10 loại tín chỉ khác nhau');
      return;
    }
    setRetireItems(prev => [...prev, {
      tokenId: credit.tokenId,
      creditId: credit.creditId,
      projectId: credit.projectId,
      projectName: credit.projectName,
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
    if (retireItems.length === 0) return setRetireError('Vui lòng chọn tín chỉ để thu hồi');
    
    setRetireStep('processing');
    setProcessing(true);
    setRetireError('');

    try {
      if (!window.ethereum) throw new Error('Không tìm thấy MetaMask');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CarbonCredit.abi, signer);

      const creditTokenIds = retireItems.map(item => item.tokenId);
      const amounts = retireItems.map(item => item.amount);

      const tx = await contract.retireCredits(creditTokenIds, amounts);
      await tx.wait(1);

      setTimeout(async () => {
        setCertificate({
          certificateId: 'ĐANG XỬ LÝ...', 
          retiredBy: 'Bạn',
          totalValue: getTotalAmount(),
          timestamp: new Date().toISOString(),
          txHash: tx.hash,
          nftTokenId: 0
        });

        setCertificateRecords(retireItems.map(item => ({
          projectName: item.projectName,
          creditTokenId: item.tokenId,
          creditAmount: item.amount
        })));

        setRetireStep('success');
        setProcessing(false);
        loadMyCredits(); 
      }, 2000);

    } catch (err: any) {
      console.error('Thu hồi thất bại:', err);
      setRetireStep('confirm');
      setRetireError(err.reason || err.message || 'Giao dịch thất bại');
      setProcessing(false);
    }
  };

  const renderCertificateContent = () => {
    if (!certificate) return null;
    const t = currentTemplate;
    const Icon = t.icon;

    return (
      <div className={`bg-gradient-to-br ${t.colors.primary} rounded-3xl p-1 shadow-2xl mx-auto max-w-2xl`}>
        <div className={`bg-gradient-to-br ${t.colors.bg} rounded-[22px] p-8 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className={`absolute -top-10 -left-10 w-40 h-40 border-8 ${t.colors.border} rounded-full`} />
            <div className={`absolute -bottom-10 -right-10 w-60 h-60 border-8 ${t.colors.border} rounded-full`} />
          </div>

          <div className="relative text-center">
            <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${t.colors.secondary} shadow-lg mb-6 ring-4 ring-white`}>
              <Icon className="w-10 h-10 text-white" />
            </div>

            <h1 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${t.colors.primary} mb-2 uppercase tracking-wide`}>
              Chứng Nhận Bù trừ
            </h1>
            <p className="text-gray-500 font-medium mb-6">Xác minh bù đắp tín chỉ Carbon</p>

            <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 mb-8 shadow-sm">
              <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Tổng lượng bù đắp</p>
              <div className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${t.colors.primary}`}>
                {certificate.totalValue} <span className="text-2xl text-gray-600">tCO₂e</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left mb-8">
              <div className="bg-white/50 rounded-xl p-3 border border-white/60">
                <p className="text-xs text-gray-400 uppercase">Nhà giảm phát thải </p>
                <p className="font-mono font-bold text-gray-800 truncate" title={certificate.retiredBy}>
                  {certificate.retiredBy}
                </p>
              </div>
              <div className="bg-white/50 rounded-xl p-3 border border-white/60">
                <p className="text-xs text-gray-400 uppercase">Ngày Phát Hành</p>
                <p className="font-medium text-gray-800">{formatDate(certificate.timestamp)}</p>
              </div>
            </div>

            {certificateRecords.length > 0 && (
              <div className="bg-white/40 rounded-xl p-4 border border-white/50 mb-6 text-left">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
                  <TreePine className="w-3 h-3" /> Chi Tiết 
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {certificateRecords.map((rec, idx) => (
                    <div key={idx} className="flex justify-between text-sm border-b border-gray-200/50 pb-1 last:border-0">
                      <span className="text-gray-600">{rec.projectName}</span>
                      <span className="font-bold text-gray-800">{rec.creditAmount} tCO₂e</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 flex flex-col items-center gap-2">
              {certificate.txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${certificate.txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  Xem trên Blockchain <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className={`text-xs font-semibold ${t.colors.text} flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full`}>
                <Check className="w-3 h-3" /> Đã Xác Minh Tính Xác Thực
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
              <Leaf className="w-6 h-6 text-green-600" /> Thu Hồi Tín Chỉ
            </h2>
            <p className="text-sm text-gray-500 mt-1">Chuyển đổi tín chỉ carbon của bạn thành các khoản bù đắp môi trường vĩnh viễn.</p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto inline-flex">
          <button
            onClick={() => { setActiveTab('retire'); resetRetireFlow(); }}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'retire' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Leaf className="w-4 h-4" /> Bù trừ Tín Chỉ
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'certificates' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Award className="w-4 h-4" /> Chứng nhận của tôi
          </button>
        </div>
      </div>

      {/* --- TAB: RETIRE --- */}
      {activeTab === 'retire' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Steps Indicator */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            {['chọn', 'mẫu', 'xác nhận', 'đang xử lý', 'thành công'].map((step, idx) => {
              const stepKeys = ['select', 'template', 'confirm', 'processing', 'success'];
              const currentIdx = stepKeys.indexOf(retireStep);
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
            {retireError && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span>{retireError}</span>
                <button onClick={() => setRetireError('')} className="ml-auto hover:bg-red-100 p-1 rounded"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* BƯỚC 1: CHỌN */}
            {retireStep === 'select' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Chọn tín chỉ từ ví</h3>
                  <button onClick={loadMyCredits} disabled={loadingCredits} className="text-sm text-green-600 hover:underline flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${loadingCredits ? 'animate-spin' : ''}`} /> Làm mới
                  </button>
                </div>

                {loadingCredits ? (
                  <div className="py-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500"/>Đang tải ví...</div>
                ) : myCredits.length === 0 ? (
                  <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Không tìm thấy tín chỉ nào trong ví của bạn.</p>
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
                            <p className="font-bold text-gray-800">
                              {credit.projectName}
                            </p>
                            <p className="text-xs text-gray-500">
                              Token #{credit.tokenId}
                            </p>

                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-bold">{credit.availableBalance} <span className="text-xs">khả dụng</span></p>
                            {isSelected && <Check className="w-5 h-5 text-green-600 ml-auto" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {retireItems.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Điều chỉnh số lượng ({retireItems.length} đã chọn)</h4>
                    <div className="space-y-2 mb-6">
                      {retireItems.map(item => (
                        <div key={item.tokenId} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm font-medium">{item.projectName}</span>
                          <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
                            <button onClick={() => updateAmount(item.tokenId, item.amount - 1)} className="p-1 hover:bg-gray-100 rounded"><Minus className="w-3 h-3" /></button>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={e => updateAmount(item.tokenId, parseInt(e.target.value) || 1)}
                              className="w-16 text-center appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button onClick={() => updateAmount(item.tokenId, item.amount + 1)} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl mb-4">
                      <span className="text-green-800 font-medium">Tổng thu hồi</span>
                      <span className="text-2xl font-bold text-green-700">{getTotalAmount()} tCO₂e</span>
                    </div>
                    <button
                      onClick={() => setRetireStep('template')}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                    >
                      Tiếp theo <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* BƯỚC 2: MẪU CHỨNG NHẬN */}
            {retireStep === 'template' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${selectedTemplate === t.id ? `border-green-500 ring-2 ring-green-100` : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.colors.primary} flex items-center justify-center mb-2`}>
                        {React.createElement(t.icon, { className: "w-4 h-4 text-white" })}
                      </div>
                      <p className="font-bold text-xs text-gray-800">{t.name}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-100 p-6 rounded-2xl flex justify-center">
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
                  <button onClick={() => setRetireStep('select')} className="px-6 py-3 border rounded-xl font-medium hover:bg-gray-50">Quay lại</button>
                  <button onClick={() => setRetireStep('confirm')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">Xác nhận kiểu dáng</button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: XÁC NHẬN */}
            {retireStep === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center">
                  <p className="text-green-800 text-sm uppercase tracking-wide font-semibold mb-1">Tổng lượng thu hồi</p>
                  <p className="text-5xl font-black text-green-700">{getTotalAmount()} <span className="text-2xl">tCO₂e</span></p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-3 text-yellow-800 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p>Lưu ý: Hành động này là vĩnh viễn. Các tín chỉ đã thu hồi sẽ bị hủy trên blockchain và không thể hoàn tác hoặc giao dịch lại.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setRetireStep('template')} className="px-6 py-3 border rounded-xl font-medium hover:bg-gray-50">Quay lại</button>
                  <button onClick={handleRetire} disabled={processing} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Leaf className="w-5 h-5" />}
                    Xác nhận & Bù trừ
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 4: ĐANG XỬ LÝ */}
            {retireStep === 'processing' && (
              <div className="text-center py-16">
                <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Đang xử lý giao dịch</h3>
              </div>
            )}

            {/* BƯỚC 5: THÀNH CÔNG */}
            {retireStep === 'success' && certificate && (
              <div className="space-y-6">
                {renderCertificateContent()}
                <button onClick={resetRetireFlow} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black">Tiếp tục thu hồi</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: LỊCH SỬ CHỨNG NHẬN --- */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Lịch sử thu hồi</h3>
            <button onClick={loadMyCertificates} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className={`w-4 h-4 ${loadingCertificates ? 'animate-spin' : ''}`} /></button>
          </div>

          {loadingCertificates ? (
            <div className="text-center py-12 text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500"/>Đang tải chứng nhận...</div>
          ) : myCertificates.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Bạn chưa thực hiện thu hồi tín chỉ nào.</p>
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
                      <p className="font-bold text-gray-900">Chứng nhận #{cert.certificateId.slice(0, 8)}...</p>
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