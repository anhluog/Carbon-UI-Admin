// components/Projects.tsx - Đã cập nhật để pass project.id thay vì toàn bộ project object
import { Award, Calendar, MapPin, Leaf, TrendingUp, Filter, Share2, Eye, BarChart3, Globe, Users, CheckCircle, X, Clock, Plus, AlertCircle, Clock as ClockIcon } from 'lucide-react';
import api from '../utils/axiosInstance';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCredit.json';

interface ProjectsProps {
  walletAddress: string;
  onOpenProjectDetail?: (projectId: string) => void;  // Cập nhật: pass projectId (string) thay vì full project object
}

const fetchIpfsMetadata = async (ipfsHash: string) => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch IPfs metadata failed:', ipfsHash, err);
    return null;
  }
};

const Projects: React.FC<ProjectsProps> = ({ walletAddress, onOpenProjectDetail }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');  // Tab mới: 'processing' hoặc 'processed'
  const [projects, setProjects] = useState<Array<any>>([]);

  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [mintAmount, setMintAmount] = useState<number>(0);
  const [mintProject, setMintProject] = useState<any>(null);
  const [mintLoading, setMintLoading] = useState(false);

  // Hàm fetch projects chung (dùng lại ở nhiều nơi)
  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/MyProject');
      const mappedProjects = await Promise.all(
        res.data.map(async (p: any) => {
          let thumbnailUrl = 'https://via.placeholder.com/400x300?text=No+Image';
          if (p.ipfsHash) {
            const metadata = await fetchIpfsMetadata(p.ipfsHash);
            // Xử lý multiple images: ưu tiên array images[0], fallback về single image
            if (metadata?.images && Array.isArray(metadata.images) && metadata.images.length > 0) {
              thumbnailUrl = metadata.images[0].replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
            } else if (metadata?.image) {
              thumbnailUrl = metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
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
            availableToMint: Math.max(0, (p.expectedCredits ?? 0) - (p.issueAmount ?? 0)), // Cập nhật: Đảm bảo >= 0 để tránh hiển thị số âm và ẩn nút mint khi =0
            date: p.createdAt,
            certificateId: p.onchainHash,
            projectDescription: p.description,
            images: [thumbnailUrl],  // Chỉ lưu thumbnail (ảnh đầu tiên) cho list view
            status: mapStatus(p.status),
            
          };
        })
      );
      setProjects(mappedProjects);
    } catch (e) {
      console.error('Load projects failed', e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const mapProjectType = (type: string) => {
    switch (type) {
      case 'FOREST_AND_GREENRY':
        return 'Forest Protection';
      case 'RENEWABLE_ENERGY':
        return 'Renewable Energy';
      case 'ENERGY_EFFICIENCY':
        return 'Energy Efficiency';
      default:
        return 'Other';
    }
  };

  // Cập nhật mapStatus để hiển thị các trạng thái mới bằng tiếng Anh
  const mapStatus = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Waiting for Review';
      case 'VERIFIED':
        return 'Waiting for Approval';
      case 'REJECTED_BY_VERIFY':
        return 'Rejected by Verifier';
      case 'REJECTED_BY_GOVERNMENT':
        return 'Rejected by Government';
      case 'APPROVED':
        return 'Issued';
      default:
        return 'Unknown';
    }
  };

  // // Thêm hàm mapStatusDescription để cung cấp mô tả rõ ràng, dễ hiểu cho người dùng
  // const mapStatusDescription = (status: string) => {
  //   switch (status) {
  //     case 'SUBMITTED':
  //       return 'Your project has been submitted and is awaiting initial review by the verification team. This typically takes 3-5 business days.';
  //     case 'VERIFIED':
  //       return 'The project has passed verification and is now waiting for final government approval. Expected turnaround: 5-7 business days.';
  //     case 'REJECTED_BY_VERIFY':
  //       return 'Unfortunately, the project was rejected during verification. Please review the feedback and resubmit after corrections.';
  //     case 'REJECTED_BY_GOVERNMENT':
  //       return 'The project was rejected by government authorities. Check the details for required revisions and resubmit.';
  //     case 'APPROVED':
  //       return 'Congratulations! Your project is approved and issued. You can now mint carbon credits from the available amount.';
  //     default:
  //       return 'Project status is unclear. Please contact support for assistance.';
  //   }
  // };

  // Hàm lấy màu và icon cho status badge
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Waiting for Review':
      case 'Waiting for Approval':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, iconColor: 'text-yellow-600' };
      case 'Issued':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' };
      case 'Rejected by Verifier':
      case 'Rejected by Government':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: X, iconColor: 'text-red-600' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, iconColor: 'text-gray-600' };
    }
  };

  // Tính tổng cho Processed (Issued + Rejected statuses)
  const processedValue = projects
    .filter(p => p.status === 'Issued' || p.status === 'Rejected by Verifier' || p.status === 'Rejected by Government')
    .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

  // Tính tổng cho Processing (Waiting statuses)
  const processingValue = projects
    .filter(p => p.status === 'Waiting for Review' || p.status === 'Waiting for Approval')
    .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

  const projectTypes = [
    { id: 'all', name: 'All Projects', count: projects.length },
    { id: 'forest', name: 'Forest Protection', count: projects.filter(p => p.projectType === 'Forest Protection').length },
    { id: 'renewable', name: 'Renewable Energy', count: projects.filter(p => p.projectType === 'Renewable Energy').length },
    { id: 'efficiency', name: 'Energy Efficiency', count: projects.filter(p => p.projectType === 'Energy Efficiency').length },
  ];

  // Filter dựa trên tab active
  const filteredProjects = projects.filter(project => {
    const matchesTab = activeTab === 'processing' 
      ? (project.status === 'Waiting for Review' || project.status === 'Waiting for Approval')
      : (project.status === 'Issued' || project.status === 'Rejected by Verifier' || project.status === 'Rejected by Government');

    const matchesType = activeFilter === 'all' ||
      (activeFilter === 'forest' && project.projectType === 'Forest Protection') ||
      (activeFilter === 'renewable' && project.projectType === 'Renewable Energy') ||
      (activeFilter === 'efficiency' && project.projectType === 'Energy Efficiency');

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

    if (!mintProject || mintAmount <= 0 || mintAmount > mintProject.availableToMint) return;

    setMintLoading(true);

    try {
      if (!(window as any).ethereum) {
        alert("MetaMask not detected");
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CarbonCreditEx.abi, signer);

      console.log("Mint params:", {
        uuid: mintProject.id,
        nftTokenId: mintProject.nftTokenId,
        amount: mintAmount,
      });

      const tx = await contract.mintCreditByUUID(mintProject.id, BigInt(mintAmount));
      await tx.wait();

      // Sync backend
      await api.post(`/projects/${mintProject.id}/mint`, {
        mintAmount,
        txHash: tx.hash,
      });

      // Đóng modal + refetch data (không reload trang)
      setMintModalOpen(false);
      await fetchProjects(); // Cập nhật UI ngay

      alert(`✅ Minted ${mintAmount} tCO₂ successfully!\nTx: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`);
    } catch (err: any) {
      console.error("Mint error:", err);
      let errorMessage = "Mint failed";

      if (err.reason) errorMessage = err.reason;
      else if (err.message?.includes("user rejected")) errorMessage = "Transaction rejected by user";
      else if (err.error?.data && err.error.data.startsWith("0x08c379a0")) {
        try {
          const reasonBytes = "0x" + err.error.data.slice(138);
          errorMessage = ethers.utils.toUtf8String(reasonBytes);
        } catch {}
      }

      alert("Mint Error: " + errorMessage);
    } finally {
      setMintLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <div className='flex justify-between items-center mb-12'>
          <div className='flex items-center space-x-3'>
            <div className='h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg'>
              <Leaf className='h-6 w-6 text-white' />
            </div>
            <div>
              <h1 className='text-4xl font-bold text-gray-900'>My Projects</h1>
              <p className='text-lg text-gray-600 mt-1'>Track and manage your carbon credit projects</p>
            </div>
          </div>
          <button className='flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium'>
            <Plus className='h-5 w-5' />
            <span>New Project</span>
          </button>
        </div>

        {/* Summary Cards với nút tab tích hợp */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-10'>
          {/* Card Processing Total - Tab "Processing" */}
          <div className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${activeTab === 'processing' ? 'shadow-lg border-2 border-yellow-200' : 'shadow-md hover:shadow-lg'}`}>
            <div className='flex items-center justify-between mb-6'>
              <div className='h-14 w-14 rounded-2xl bg-yellow-100 flex items-center justify-center'>
                <Clock className='h-7 w-7 text-yellow-600' />
              </div>
              <div className={`px-3 py-1 rounded-full ${activeTab === 'processing' ? 'bg-yellow-100 text-yellow-700 font-semibold' : 'bg-gray-100 text-gray-500 text-xs'}`}>
                Processing
              </div>
            </div>
            <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Processing Total</p>
            <h3 className='text-4xl font-bold text-gray-900 mb-1'>{processingValue.toFixed(0)} tCO₂</h3>
            <p className='text-sm text-gray-600 flex items-center space-x-1 mb-4'><BarChart3 className='h-4 w-4 text-yellow-500' /><span>Under review</span></p>
            <button
              onClick={() => setActiveTab('processing')}
              className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'processing' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
            >
              View Processing Projects
            </button>
          </div>

          {/* Card Issued Projects Total - Tab "Processed" (Issued + Rejected) */}
          <div className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${activeTab === 'processed' ? 'shadow-lg border-2 border-green-200' : 'shadow-md hover:shadow-lg'}`}>
            <div className='flex items-center justify-between mb-6'>
              <div className='h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center'>
                <CheckCircle className='h-7 w-7 text-green-600' />
              </div>
              <div className={`px-3 py-1 rounded-full ${activeTab === 'processed' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-500 text-xs'}`}>
                Processed
              </div>
            </div>
            <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Processed Total</p>
            <h3 className='text-4xl font-bold text-gray-900 mb-1'>{processedValue.toFixed(0)} tCO₂</h3>
            <p className='text-sm text-gray-600 flex items-center space-x-1 mb-4'><TrendingUp className='h-4 w-4 text-green-500' /><span>Issued & Rejected</span></p>
            <button
              onClick={() => setActiveTab('processed')}
              className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'processed' ? 'bg-green-500 text-white shadow-lg' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            >
              View Processed Projects
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-3xl p-6 shadow-md mb-10'>
          <div className='flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center'>
            <div className='flex flex-wrap gap-3'>
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveFilter(type.id)}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeFilter === type.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {type.name} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeFilter === type.id ? 'bg-green-600' : 'bg-gray-200'}`}>{type.count}</span>
                </button>
              ))}
            </div>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className='px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 font-medium text-gray-700'>
              <option value='all-time'>All Time</option>
              <option value='2024'>2024</option>
              <option value='2023'>2023</option>
            </select>
          </div>
        </div>

        {/* Project List */}
        <div className='grid gap-6'>
          {filteredProjects.map((project) => {
            const statusConfig = getStatusConfig(project.status);
            return (
              <div key={project.id} className='group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-500'>
                <div className='flex flex-col lg:flex-row'>
                  <div className="lg:w-80 h-64 lg:h-auto relative bg-gray-100 overflow-hidden">
                    <img src={project.images[0]} alt={project.projectName} loading="lazy" onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  </div>

                  <div className='flex-1 p-8'>
                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <h3 className='text-2xl font-bold text-gray-900 mb-3'>{project.projectName}</h3>
                        {/* Thêm status badge - FIXED */}
                        <div className='flex items-center space-x-2 mb-3'>
                          {React.createElement(statusConfig.icon, { 
                            className: `h-4 w-4 ${statusConfig.iconColor}` 
                          })}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {project.status}
                          </span>
                        </div>
                        {/* Tooltip cho mô tả trạng thái */}
                        {/* <div className="group relative inline-block">
                          <p className="text-xs text-gray-500 cursor-help" title={project.statusDescription}>
                            {project.statusDescription.length > 100 ? `${project.statusDescription.substring(0, 100)}...` : project.statusDescription}
                          </p>
                        </div> */}
                        <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                          <span className='flex items-center space-x-2'><MapPin className='h-4 w-4 text-gray-400' /><span>{project.location}</span></span>
                          <span className='flex items-center space-x-2'><Calendar className='h-4 w-4 text-gray-400' /><span>Vintage {project.vintage}</span></span>
                          <span className='flex items-center space-x-2'><Leaf className='h-4 w-4 text-gray-400' /><span>{project.projectType}</span></span>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm text-gray-500 font-medium'>
                          {new Date(project.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6'>
                      <div className='bg-gray-50 rounded-2xl p-5'>
                        <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Available to Mint</p>
                        <p className='text-3xl font-bold text-gray-900'>{project.availableToMint} <span className='text-lg'>tCO₂</span></p>
                      </div>
                      <div className='bg-gray-50 rounded-2xl p-5'>
                        <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Total Expected</p>
                        <p className='text-3xl font-bold text-gray-900'>{project.expectedCredits} <span className='text-lg'>tCO₂</span></p>
                      </div>
                    </div>

                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-100'>
                      <div className='flex items-center space-x-2 text-sm text-gray-600'>
                        <div className='h-2 w-2 bg-green-500 rounded-full' />
                        <span className='font-medium'>Issued: <span className='text-green-700 font-semibold'>{project.issuedAmount} tCO₂</span></span>
                      </div>
                      <div className='flex items-center space-x-3 w-full sm:w-auto'>
                        {project.nftTokenId !== null && project.status === 'Issued' && project.availableToMint > 0 && (  // Chỉ mint nếu 'Issued'
                          <button onClick={() => handleMint(project)} className="flex items-center space-x-2 px-4 py-2.5 border rounded-xl hover:bg-gray-50">
                            <Share2 className="h-4 w-4" />
                            <span>Mint</span>
                          </button>
                        )}
                        {/* Cập nhật: Pass project.id vào onOpenProjectDetail */}
                        <button onClick={() => onOpenProjectDetail?.(project.id)} className='bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-600 transition-all flex items-center justify-center space-x-2'>
                          <Eye className='h-4 w-4' />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State & Modals giữ nguyên như cũ, chỉ sửa nhỏ display amount */}
        {filteredProjects.length === 0 && (
          <div className='bg-white rounded-3xl p-16 text-center shadow-md'>
            <div className='h-24 w-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
              <Award className='h-12 w-12 text-gray-400' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-3'>No projects found</h3>
            <p className='text-gray-600'>There are no projects that match your current filters.</p>
          </div>
        )}

        {/* Detail Modal & Mint Modal giữ nguyên cấu trúc, chỉ sửa display amount nếu cần */}

        {mintModalOpen && mintProject && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Mint Carbon Credits</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">Project</label>
                <div className="text-gray-900 font-semibold">{mintProject.projectName}</div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">Amount to mint (tCO₂)</label>
                <input
                  type="number"
                  min={1}
                  max={mintProject.availableToMint}
                  value={mintAmount}
                  onChange={(e) => setMintAmount(Math.max(0, Math.min(mintProject.availableToMint, Number(e.target.value))))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-500 mt-2">Available: {mintProject.availableToMint} tCO₂</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button onClick={() => setMintModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  disabled={mintAmount <= 0 || mintLoading}
                  onClick={confirmMint}
                  className="px-6 py-2.5 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 disabled:opacity-50"
                >
                  {mintLoading ? "Minting..." : "Confirm Mint"}
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