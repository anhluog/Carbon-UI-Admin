import React, { useEffect, useState, useMemo } from 'react';
import { 
  Award, Calendar, MapPin, Leaf, TrendingUp, Eye, 
  BarChart3, CheckCircle, X, Clock, Plus, AlertCircle, 
  Clock as ClockIcon, Loader2, Share2, ArrowUpRight 
} from 'lucide-react';
import { ethers } from 'ethers';
import api from '../utils/axiosInstance';
import CarbonCreditEx from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';

interface ProjectsProps {
  walletAddress: string;
  onOpenProjectDetail?: (projectId: string) => void;
}

// Helper: Tải Metadata từ IPFS
const fetchIpfsMetadata = async (ipfsHash: string) => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return await res.json();
  } catch (err) {
    console.error('Lỗi khi tải metadata từ IPFS:', ipfsHash, err);
    return null;
  }
};

const Projects: React.FC<ProjectsProps> = ({ walletAddress, onOpenProjectDetail }) => {
  // --- States ---
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');
  const [projects, setProjects] = useState<Array<any>>([]);

  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [mintAmount, setMintAmount] = useState<number>(0);
  const [mintProject, setMintProject] = useState<any>(null);
  const [mintLoading, setMintLoading] = useState(false);

  // --- Mappers & Config ---
  const mapProjectType = (type: string) => {
    const types: any = {
      'FOREST_AND_GREENRY': 'Bảo vệ rừng',
      'RENEWABLE_ENERGY': 'Năng lượng tái tạo',
      'ENERGY_EFFICIENCY': 'Hiệu quả năng lượng'
    };
    return types[type] || 'Loại khác';
  };

  const mapStatus = (status: string) => {
    const statuses: any = {
      'SUBMITTED': 'Chờ thẩm định',
      'VERIFIED': 'Chờ phê duyệt',
      'APPROVED': 'Đã phát hành'
    };
    return statuses[status] || 'Bị từ chối';
  };

  const getStatusConfig = (status: string) => {
    if (status === 'SUBMITTED' || status === 'VERIFIED') 
        return { color: 'bg-amber-500 text-white', icon: ClockIcon, shadow: 'shadow-amber-200' };
    if (status === 'APPROVED') 
        return { color: 'bg-emerald-500 text-white', icon: CheckCircle, shadow: 'shadow-emerald-200' };
    return { color: 'bg-rose-500 text-white', icon: X, shadow: 'shadow-rose-200' };
  };

  // --- Fetch Data ---
  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/MyProject');
      const mappedProjects = await Promise.all(
        res.data.map(async (p: any) => {
          let thumbnailUrl = 'https://via.placeholder.com/400x300?text=Chưa+có+ảnh';
          if (p.ipfsHash) {
            const metadata = await fetchIpfsMetadata(p.ipfsHash);
            if (metadata?.images?.[0]) {
              thumbnailUrl = metadata.images[0].replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            } else if (metadata?.image) {
              thumbnailUrl = metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            }
          }

          return {
            ...p,
            projectName: p.name,
            projectTypeDisplay: mapProjectType(p.type),
            statusDisplay: mapStatus(p.status),
            thumbnail: thumbnailUrl,
            availableToMint: Math.max(0, (p.expectedCredits ?? 0) - (p.issueAmount ?? 0)),
          };
        })
      );
      setProjects(mappedProjects);
    } catch (e) {
      showError('Không thể tải danh sách dự án.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- logic BỘ LỌC (Đã sửa lỗi không hoạt động) ---
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // 1. Lọc theo Tab (Xử lý vs Hoàn tất)
      const isProcessing = project.status === 'SUBMITTED' || project.status === 'VERIFIED';
      const isProcessed = project.status === 'APPROVED' || project.status.includes('REJECTED');
      const matchesTab = activeTab === 'processing' ? isProcessing : isProcessed;

      // 2. Lọc theo Loại (Khớp ID button với Backend Enum)
      const matchesType = activeFilter === 'all' || 
        (activeFilter === 'forest' && project.type === 'FOREST_AND_GREENRY') ||
        (activeFilter === 'renewable' && project.type === 'RENEWABLE_ENERGY') ||
        (activeFilter === 'efficiency' && project.type === 'ENERGY_EFFICIENCY');

      // 3. Lọc theo Thời gian (Ép kiểu về string để so sánh động)
      const matchesTime = timeFilter === 'all-time' || project.vintage.toString() === timeFilter;

      return matchesTab && matchesType && matchesTime;
    });
  }, [projects, activeTab, activeFilter, timeFilter]);

  // --- Thống kê ---
  const stats = useMemo(() => ({
    processingValue: projects.filter(p => p.status === 'SUBMITTED' || p.status === 'VERIFIED').reduce((sum, p) => sum + p.expectedCredits, 0),
    processedValue: projects.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + p.expectedCredits, 0),
  }), [projects]);

  // --- Hành động: Mint ---
  const handleMint = (project: any) => {
    setMintProject(project);
    setMintAmount(0);
    setMintModalOpen(true);
  };

  const confirmMint = async () => {
    const contractAddress = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;
    if (!mintProject || mintAmount <= 0) return showWarning('Vui lòng nhập số lượng hợp lệ.');
    
    setMintLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CarbonCreditEx.abi, signer);

      const tx = await contract.mintCreditByUUID(mintProject.id, BigInt(mintAmount));
      showInfo("Giao dịch đang chờ xác nhận...");
      await tx.wait();

      setMintModalOpen(false);
      fetchProjects(); 
      showSuccess(`Đã đúc thành công ${mintAmount} tCO₂!`);
    } catch (err: any) {
      showError(err.reason || "Đúc tín chỉ thất bại.");
    } finally {
      setMintLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#f8fafc] pb-24'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        
        {/* Header - Phong cách hiện đại */}
        <div className='relative mb-16 p-10 rounded-[3rem] bg-slate-900 overflow-hidden shadow-2xl'>
          <div className='absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl -mr-20 -mt-20'></div>
          <div className='absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20'></div>
          
          <div className='relative z-10 flex flex-col md:flex-row justify-between items-center gap-8'>
            <div className='flex items-center space-x-6 text-center md:text-left'>
              <div className='h-20 w-20 rounded-3xl bg-green-500 flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300'>
                <Leaf className='h-10 w-10 text-white' />
              </div>
              <div>
                <h1 className='text-4xl font-black text-white tracking-tight'>Dự án của tôi</h1>
                <p className='text-emerald-400 font-medium mt-1'>Theo dõi giá trị tài sản Carbon của bạn</p>
              </div>
            </div>
            <div className='flex p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10'>
              <button onClick={() => setActiveTab('processing')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'processing' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Đang xử lý</button>
              <button onClick={() => setActiveTab('processed')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'processed' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Hoàn tất</button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-12'>
          <div className='bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100'>
            <div className='flex items-center justify-between mb-6'>
                <div className='h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center'><ClockIcon className='text-amber-500' /></div>
                <span className='text-[10px] font-black text-slate-300 uppercase tracking-widest'>Giá trị kỳ vọng</span>
            </div>
            <h3 className='text-4xl font-black text-slate-900'>{stats.processingValue.toLocaleString()} <span className='text-lg font-bold text-slate-400'>tCO₂</span></h3>
            <p className='text-sm text-slate-400 mt-2 font-medium italic'>* Đang chờ xác thực từ các bên liên quan</p>
          </div>
          <div className='bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100'>
            <div className='flex items-center justify-between mb-6'>
                <div className='h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center'><CheckCircle className='text-emerald-500' /></div>
                <span className='text-[10px] font-black text-slate-300 uppercase tracking-widest'>Tài sản khả dụng</span>
            </div>
            <h3 className='text-4xl font-black text-slate-900'>{stats.processedValue.toLocaleString()} <span className='text-lg font-bold text-slate-400'>tCO₂</span></h3>
            <p className='text-sm text-slate-400 mt-2 font-medium italic'>* Có thể giao dịch hoặc đúc thành NFT</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className='flex flex-col lg:flex-row justify-between items-center mb-10 gap-6'>
          <div className='flex p-1.5 bg-gray-200 rounded-2xl w-full lg:w-auto overflow-x-auto'>
            {[
              { id: 'all', name: 'Tất cả' },
              { id: 'forest', name: 'Lâm nghiệp' },
              { id: 'renewable', name: 'Năng lượng' },
              { id: 'efficiency', name: 'Hiệu quả' }
            ].map((t) => (
              <button key={t.id} onClick={() => setActiveFilter(t.id)} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.name}
              </button>
            ))}
          </div>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className='w-full lg:w-auto px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-600 outline-none focus:border-green-500 transition-colors'>
             <option value='all-time'>Mọi Vintage</option>
             {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y.toString()}>{y}</option>)}
          </select>
        </div>

        {/* Project List */}
        <div className='grid gap-10'>
          {filteredProjects.map((project) => {
            const statusCfg = getStatusConfig(project.status);
            return (
              <div key={project.id} className='group bg-white rounded-[3rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden hover:translate-y-[-5px] transition-all duration-500'>
                <div className='flex flex-col lg:flex-row'>
                  {/* Left: Project Image */}
                  <div className="lg:w-[420px] h-72 lg:h-auto relative overflow-hidden m-5 rounded-[2.5rem] bg-slate-100">
                    <img src={project.thumbnail} alt={project.projectName} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl ${statusCfg.color}`}>
                        <statusCfg.icon className="h-3 w-3" />
                        <span>{statusCfg.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Content */}
                  <div className='flex-1 p-8 lg:p-12 flex flex-col'>
                    <div className='flex justify-between items-start mb-6'>
                      <div>
                        <h3 className='text-3xl font-black text-slate-900 leading-tight mb-4 group-hover:text-green-600 transition-colors'>{project.projectName}</h3>
                        <div className='flex flex-wrap gap-4'>
                          <span className='px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-100 flex items-center'><MapPin className='h-3 w-3 mr-2 text-green-500' />{project.location}</span>
                          <span className='px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-100 flex items-center'><Calendar className='h-3 w-3 mr-2 text-green-500' />Vintage {project.vintage}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard-style Stats */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8'>
                      <div className='bg-slate-900 rounded-[1.5rem] p-6 text-white shadow-inner'>
                        <p className='text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1'>Khả dụng</p>
                        <p className='text-2xl font-black text-green-400'>{project.availableToMint.toLocaleString()} <span className='text-xs font-normal text-slate-500'>tCO₂</span></p>
                      </div>
                      <div className='bg-emerald-50 rounded-[1.5rem] p-6 border border-emerald-100'>
                        <p className='text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1'>Đã đúc</p>
                        <p className='text-2xl font-black text-emerald-900'>{project.issuedAmount.toLocaleString()}</p>
                      </div>
                      <div className='bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100'>
                        <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1'>Dự kiến</p>
                        <p className='text-2xl font-black text-slate-700'>{project.expectedCredits.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className='mt-auto flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-slate-100'>
                       <button onClick={() => onOpenProjectDetail?.(project.id)} className='text-xs font-black text-slate-400 hover:text-green-600 transition-colors flex items-center group/btn uppercase tracking-widest'>
                          Xem hồ sơ kỹ thuật <ArrowUpRight className='ml-1 h-4 w-4 transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform' />
                       </button>

                       <div className='flex gap-3 w-full sm:w-auto'>
                        {project.availableToMint > 0 && project.status === 'APPROVED' && (
                          <button onClick={() => handleMint(project)} className='flex-1 sm:flex-none px-10 py-4 bg-green-500 text-white rounded-2xl font-black text-sm hover:bg-green-600 shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-2'>
                            <Share2 className='h-4 w-4' /> ĐÚC NGAY
                          </button>
                        )}
                        <button onClick={() => onOpenProjectDetail?.(project.id)} className='flex-1 sm:flex-none px-8 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all uppercase tracking-widest'>
                           Pháp lý
                        </button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className='bg-white rounded-[3.5rem] p-24 text-center border-2 border-dashed border-slate-200 mt-10'>
            <Award className='h-20 w-20 text-slate-200 mx-auto mb-6' />
            <h3 className='text-3xl font-black text-slate-900 mb-2 uppercase'>Không tìm thấy dự án</h3>
            <p className='text-slate-400 font-medium max-w-sm mx-auto'>Chúng tôi không tìm thấy kết quả phù hợp với bộ lọc hiện tại của bạn.</p>
          </div>
        )}

        {/* Mint Modal */}
        {mintModalOpen && mintProject && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Đúc Tín Chỉ</h3>
                <button onClick={() => setMintModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="text-slate-400" /></button>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Dự án lựa chọn</p>
                <p className="text-slate-900 font-bold text-lg leading-tight">{mintProject.projectName}</p>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lượng đúc (tCO₂)</label>
                    <span className="text-[10px] font-black text-green-600">Max: {mintProject.availableToMint}</span>
                </div>
                <div className="relative">
                    <input
                        type="number"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(Math.max(0, Math.min(mintProject.availableToMint, Number(e.target.value))))}
                        className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-black text-2xl outline-none"
                        placeholder="0"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">tCO₂</div>
                </div>
              </div>

              <button disabled={mintAmount <= 0 || mintLoading} onClick={confirmMint} className="w-full py-5 rounded-2xl bg-green-500 text-white font-black text-lg shadow-xl shadow-green-100 hover:bg-green-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {mintLoading ? <Loader2 className="animate-spin" /> : <span>XÁC NHẬN ĐÚC</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;