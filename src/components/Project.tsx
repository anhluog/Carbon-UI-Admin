// components/Projects.tsx
import { Award, Calendar, MapPin, Leaf, TrendingUp, Filter, Share2, Eye, BarChart3, Globe, Users, CheckCircle, X, Clock, Plus, AlertCircle, Clock as ClockIcon, Loader2 } from 'lucide-react';
import api from '../utils/axiosInstance';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';

interface ProjectsProps {
  walletAddress: string;
  onOpenProjectDetail?: (projectId: string) => void;
}

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
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');
  const [projects, setProjects] = useState<Array<any>>([]);

  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [mintAmount, setMintAmount] = useState<number>(0);
  const [mintProject, setMintProject] = useState<any>(null);
  const [mintLoading, setMintLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/MyProject');
      const mappedProjects = await Promise.all(
        res.data.map(async (p: any) => {
          // Mặc định là mảng chứa 1 ảnh placeholder
          let imageUrls: string[] = ['https://via.placeholder.com/400x300?text=Khong+Co+Anh'];

          if (p.ipfsHash) {
            const metadata = await fetchIpfsMetadata(p.ipfsHash);
            if (metadata) {
              // Trường hợp 1: Metadata có mảng "images"
              if (metadata.images && Array.isArray(metadata.images) && metadata.images.length > 0) {
                imageUrls = metadata.images.map((img: string) =>
                  img.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
                );
              }
              // Trường hợp 2: Metadata chỉ có 1 trường "image" duy nhất
              else if (metadata.image) {
                imageUrls = [metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")];
              }
            }
          }

          return {
            id: p.id,
            nftTokenId: p.nftTokenId,
            projectName: p.name,
            projectType: mapProjectType(p.type),
            location: p.location,
            vintage: p.vintage,
            expectedCredits: p.expectedCredits ?? 0,
            issuedAmount: p.issueAmount ?? 0,
            availableToMint: Math.max(0, (p.expectedCredits ?? 0) - (p.issueAmount ?? 0)),
            date: p.createdAt,
            certificateId: p.onchainHash,
            projectDescription: p.description,
            images: imageUrls, // <--- Đã sửa: Bây giờ trả về toàn bộ mảng ảnh
            status: mapStatus(p.status),
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

  const mapProjectType = (type: string) => {
    switch (type) {
      case 'FOREST_AND_GREENRY': return 'Bảo vệ rừng';
      case 'RENEWABLE_ENERGY': return 'Năng lượng tái tạo';
      case 'ENERGY_EFFICIENCY': return 'Hiệu quả năng lượng';
      default: return 'Loại khác';
    }
  };

  const mapStatus = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'Chờ thẩm định';
      case 'VERIFIED': return 'Chờ phê duyệt';
      case 'REJECTED_BY_VERIFY': return 'Bị từ chối (Thẩm định)';
      case 'REJECTED_BY_GOVERNMENT': return 'Bị từ chối (Chính phủ)';
      case 'APPROVED': return 'Đã phát hành';
      default: return 'Không xác định';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Chờ thẩm định':
      case 'Chờ phê duyệt':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, iconColor: 'text-yellow-600' };
      case 'Đã phát hành':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' };
      case 'Bị từ chối (Thẩm định)':
      case 'Bị từ chối (Chính phủ)':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: X, iconColor: 'text-red-600' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, iconColor: 'text-gray-600' };
    }
  };

  const processedValue = projects
    .filter(p => p.status === 'Đã phát hành' || p.status.includes('Bị từ chối'))
    .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

  const processingValue = projects
    .filter(p => p.status === 'Chờ thẩm định' || p.status === 'Chờ phê duyệt')
    .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

  const projectTypes = [
    { id: 'all', name: 'Tất cả dự án', count: projects.length },
    { id: 'forest', name: 'Bảo vệ rừng', count: projects.filter(p => p.projectType === 'Bảo vệ rừng').length },
    { id: 'renewable', name: 'Năng lượng tái tạo', count: projects.filter(p => p.projectType === 'Năng lượng tái tạo').length },
    { id: 'efficiency', name: 'Hiệu quả năng lượng', count: projects.filter(p => p.projectType === 'Hiệu quả năng lượng').length },
  ];

  const filteredProjects = projects.filter(project => {
    const matchesTab = activeTab === 'processing'
      ? (project.status === 'Chờ thẩm định' || project.status === 'Chờ phê duyệt')
      : (project.status === 'Đã phát hành' || project.status.includes('Bị từ chối'));

    const matchesType = activeFilter === 'all' ||
      (activeFilter === 'forest' && project.projectType === 'Bảo vệ rừng') ||
      (activeFilter === 'renewable' && project.projectType === 'Năng lượng tái tạo') ||
      (activeFilter === 'efficiency' && project.projectType === 'Hiệu quả năng lượng');

    const matchesTime = timeFilter === 'all-time' ||
      (timeFilter === '2024' && project.vintage === 2024) ||
      (timeFilter === '2023' && project.vintage === 2023);

    return matchesTab && matchesType && matchesTime;
  });

  const handleMint = (project: any) => {
    setMintProject(project);
    setMintAmount(0);
    setMintModalOpen(true);
  };

  const confirmMint = async () => {
    const contractAddress = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;

    if (!mintProject || mintAmount <= 0) {
      showWarning('Vui lòng nhập số lượng hợp lệ để đúc.');
      return;
    }

    if (mintAmount > mintProject.availableToMint) {
      showWarning('Số lượng vượt quá số tín chỉ khả dụng.');
      return;
    }

    setMintLoading(true);
    

    try {
      if (!(window as any).ethereum) {
        showError("Không tìm thấy MetaMask. Vui lòng cài đặt ví.");
        setMintLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CarbonCreditEx.abi, signer);

      const tx = await contract.mintCreditByUUID(mintProject.id, BigInt(mintAmount));
      

      await tx.wait();

      setMintModalOpen(false);
      await fetchProjects();

      showSuccess(`Đã đúc thành công ${mintAmount} tCO₂!\nMã giao dịch: ${tx.hash.slice(0, 10)}...`);
    } catch (err: any) {
      console.error("Lỗi Mint:", err);
      let errorMessage = "Đúc tín chỉ thất bại. Vui lòng thử lại.";

      if (err.reason) errorMessage = err.reason;
      else if (err.message?.includes("user rejected")) errorMessage = "Người dùng đã từ chối giao dịch.";

      showError(errorMessage);
    } finally {
      setMintLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4'>
          <div className='flex items-center space-x-4'>
            <div className='h-14 w-14 rounded-2xl bg-green-500 flex items-center justify-center shadow-xl'>
              <Leaf className='h-8 w-8 text-white' />
            </div>
            <div>
              <h1 className='text-4xl font-extrabold text-gray-900 tracking-tight'>Dự án của tôi</h1>
              <p className='text-lg text-gray-500'>Theo dõi và quản lý các dự án tín chỉ carbon của bạn</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-12'>
          <div
            onClick={() => setActiveTab('processing')}
            className={`group bg-white rounded-[2rem] p-8 cursor-pointer transition-all duration-300 border-2 ${activeTab === 'processing' ? 'shadow-2xl border-yellow-400 scale-[1.02]' : 'shadow-sm border-transparent hover:border-yellow-200'}`}
          >
            <div className='flex items-center justify-between mb-8'>
              <div className='h-16 w-16 rounded-2xl bg-yellow-50 flex items-center justify-center'>
                <Clock className='h-8 w-8 text-yellow-600' />
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${activeTab === 'processing' ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                Đang xử lý
              </div>
            </div>
            <p className='text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2'>Tổng đang xử lý</p>
            <h3 className='text-4xl font-black text-gray-900 mb-2'>{processingValue.toFixed(0)} <span className='text-lg font-bold text-gray-400'>tCO₂</span></h3>
            <p className='text-sm text-gray-500 flex items-center font-medium'><BarChart3 className='h-4 w-4 text-yellow-500 mr-2' />Đang chờ xác thực</p>
          </div>

          <div
            onClick={() => setActiveTab('processed')}
            className={`group bg-white rounded-[2rem] p-8 cursor-pointer transition-all duration-300 border-2 ${activeTab === 'processed' ? 'shadow-2xl border-green-400 scale-[1.02]' : 'shadow-sm border-transparent hover:border-green-200'}`}
          >
            <div className='flex items-center justify-between mb-8'>
              <div className='h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center'>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${activeTab === 'processed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                Đã hoàn tất
              </div>
            </div>
            <p className='text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2'>Tổng đã xử lý</p>
            <h3 className='text-4xl font-black text-gray-900 mb-2'>{processedValue.toFixed(0)} <span className='text-lg font-bold text-gray-400'>tCO₂</span></h3>
            <p className='text-sm text-gray-500 flex items-center font-medium'><TrendingUp className='h-4 w-4 text-green-500 mr-2' />Đã phát hành & Chốt sổ</p>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-10'>
          <div className='flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center'>
            <div className='flex flex-wrap gap-2'>
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveFilter(type.id)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeFilter === type.id ? 'bg-green-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  {type.name} <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${activeFilter === type.id ? 'bg-green-500' : 'bg-gray-200'}`}>{type.count}</span>
                </button>
              ))}
            </div>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className='px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold text-sm text-gray-700 outline-none'>
              <option value='all-time'>Tất cả thời gian</option>
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
              <option value="2024">Năm 2024</option>
              <option value="2023">Năm 2023</option>
              <option value="2022">Năm 2022</option>
              <option value="2021">Năm 2021</option>
              <option value="2020">Năm 2020</option>
            </select>
          </div>
        </div>

        {/* Project List */}
        <div className='grid gap-8'>
          {filteredProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            return (
              <div key={project.id} className='group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500'>
                <div className='flex flex-col lg:flex-row'>
                  <div className="lg:w-96 h-72 lg:h-auto relative bg-gray-200 overflow-hidden">
                    <img src={project.images[0]} alt={project.projectName} loading="lazy" onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Khong+Co+Anh"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute top-4 left-4">
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md ${statusConfig.color} border`}>
                        {React.createElement(statusConfig.icon, { className: `h-3 w-3 ${statusConfig.iconColor}` })}
                        <span>{project.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex-1 p-10 flex flex-col'>
                    <div className='flex justify-between items-start mb-6'>
                      <div>
                        <h3 className='text-3xl font-black text-gray-900 mb-4 group-hover:text-green-600 transition-colors'>{project.projectName}</h3>
                        <div className='flex flex-wrap gap-6 text-sm text-gray-400 font-bold'>
                          <span className='flex items-center'><MapPin className='h-4 w-4 mr-2 text-green-500' />{project.location}</span>
                          <span className='flex items-center'><Calendar className='h-4 w-4 mr-2 text-green-500' /> {project.vintage}</span>
                          <span className='flex items-center'><Leaf className='h-4 w-4 mr-2 text-green-500' />{project.projectType}</span>
                        </div>
                      </div>
                      <div className='hidden sm:block text-right'>
                        <span className='text-[10px] font-black text-gray-300 uppercase tracking-widest'>Ngày nộp</span>
                        <p className='text-sm font-bold text-gray-900'>{new Date(project.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 mb-8'>
                      <div className='bg-green-50/50 rounded-3xl p-6 border border-green-100'>
                        <p className='text-[10px] font-black text-green-600 uppercase tracking-widest mb-2'>Khả dụng để đúc</p>
                        <p className='text-3xl font-black text-green-900'>{project.availableToMint} <span className='text-xs font-bold text-green-600/50'>tCO₂</span></p>
                      </div>
                      <div className='bg-gray-50 rounded-3xl p-6 border border-gray-100'>
                        <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Tổng dự kiến</p>
                        <p className='text-3xl font-black text-gray-900'>{project.expectedCredits} <span className='text-xs font-bold text-gray-400'>tCO₂</span></p>
                      </div>
                    </div>

                    <div className='mt-auto flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-100'>
                      <div className='flex items-center space-x-3'>
                        <div className='h-10 w-10 bg-green-100 rounded-full flex items-center justify-center'>
                          <BarChart3 className='h-5 w-5 text-green-600' />
                        </div>
                        <div>
                          <span className='text-[10px] font-black text-gray-400 uppercase tracking-wider block'>Hiện đã phát hành</span>
                          <span className='text-lg font-black text-green-700'>{project.issuedAmount} <span className='text-xs'>tCO₂</span></span>
                        </div>
                      </div>
                      <div className='flex items-center space-x-3 w-full sm:w-auto'>
                        {project.nftTokenId !== null && project.status === 'Đã phát hành' && project.availableToMint > 0 && (
                          <button
                            onClick={() => handleMint(project)}
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Đúc Tín chỉ</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenProjectDetail?.(project.id)}
                          className='flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all'
                        >
                          <Eye className='h-4 w-4' />
                          <span>Xem chi tiết</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div className='bg-white rounded-[3rem] p-24 text-center shadow-sm border border-gray-100 mt-10'>
            <div className='h-24 w-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8'>
              <Award className='h-12 w-12 text-gray-200' />
            </div>
            <h3 className='text-3xl font-black text-gray-900 mb-4'>Không tìm thấy dự án nào</h3>
            <p className='text-gray-400 font-medium max-w-sm mx-auto'>Hãy thử điều chỉnh bộ lọc để tìm thấy các dự án bạn đang tìm kiếm.</p>
          </div>
        )}

        {/* Mint Modal */}
        {mintModalOpen && mintProject && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">Đúc Tín chỉ Carbon</h3>
                <button onClick={() => setMintModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl mb-8">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Tên dự án</label>
                <div className="text-gray-900 font-bold text-lg">{mintProject.projectName}</div>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Số lượng cần đúc (tCO₂)</label>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">Khả dụng: {mintProject.availableToMint}</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={mintProject.availableToMint}
                    value={mintAmount}
                    onChange={(e) => setMintAmount(Math.max(0, Math.min(mintProject.availableToMint, Number(e.target.value))))}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-black text-xl outline-none"
                    placeholder="0"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">tCO₂</div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  disabled={mintAmount <= 0 || mintLoading}
                  onClick={confirmMint}
                  className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-lg shadow-xl shadow-green-100 hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
                >
                  {mintLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <span>Xác nhận & Đúc</span>}
                </button>
                <button onClick={() => setMintModalOpen(false)} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors">
                  Để sau
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;