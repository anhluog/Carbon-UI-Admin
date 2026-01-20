// components/Projects.tsx
import { Award, Calendar, MapPin, Leaf, TrendingUp, Filter, Share2, Eye, BarChart3, Globe, Users, CheckCircle, X, Clock, Plus, AlertCircle, Clock as ClockIcon, Loader2 } from 'lucide-react';
import api from '../utils/axiosInstance';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast'; // Import toast utilities

interface ProjectsProps {
  walletAddress: string;
  onOpenProjectDetail?: (projectId: string) => void;
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
          let thumbnailUrl = 'https://via.placeholder.com/400x300?text=No+Image';
          if (p.ipfsHash) {
            const metadata = await fetchIpfsMetadata(p.ipfsHash);
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
            availableToMint: Math.max(0, (p.expectedCredits ?? 0) - (p.issueAmount ?? 0)),
            date: p.createdAt,
            certificateId: p.onchainHash,
            projectDescription: p.description,
            images: [thumbnailUrl],
            status: mapStatus(p.status),
          };
        })
      );
      setProjects(mappedProjects);
    } catch (e) {
      showError('Failed to load projects list.');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const mapProjectType = (type: string) => {
    switch (type) {
      case 'FOREST_AND_GREENRY': return 'Forest Protection';
      case 'RENEWABLE_ENERGY': return 'Renewable Energy';
      case 'ENERGY_EFFICIENCY': return 'Energy Efficiency';
      default: return 'Other';
    }
  };

  const mapStatus = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'Waiting for Review';
      case 'VERIFIED': return 'Waiting for Approval';
      case 'REJECTED_BY_VERIFY': return 'Rejected by Verifier';
      case 'REJECTED_BY_GOVERNMENT': return 'Rejected by Government';
      case 'APPROVED': return 'Issued';
      default: return 'Unknown';
    }
  };

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

  const processedValue = projects
    .filter(p => p.status === 'Issued' || p.status === 'Rejected by Verifier' || p.status === 'Rejected by Government')
    .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

  const processingValue = projects
    .filter(p => p.status === 'Waiting for Review' || p.status === 'Waiting for Approval')
    .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

  const projectTypes = [
    { id: 'all', name: 'All Projects', count: projects.length },
    { id: 'forest', name: 'Forest Protection', count: projects.filter(p => p.projectType === 'Forest Protection').length },
    { id: 'renewable', name: 'Renewable Energy', count: projects.filter(p => p.projectType === 'Renewable Energy').length },
    { id: 'efficiency', name: 'Energy Efficiency', count: projects.filter(p => p.projectType === 'Energy Efficiency').length },
  ];

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

    if (!mintProject || mintAmount <= 0) {
      showWarning('Please enter a valid amount to mint.');
      return;
    }
    
    if (mintAmount > mintProject.availableToMint) {
      showWarning('Amount exceeds available credits to mint.');
      return;
    }

    setMintLoading(true);
    showInfo("Confirming transaction on your wallet...");

    try {
      if (!(window as any).ethereum) {
        showError("MetaMask not detected. Please install a wallet.");
        setMintLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CarbonCreditEx.abi, signer);

      const tx = await contract.mintCreditByUUID(mintProject.id, BigInt(mintAmount));
      showInfo("Transaction sent. Waiting for network confirmation...");
      
      await tx.wait();

      setMintModalOpen(false);
      await fetchProjects(); 

      showSuccess(`Successfully minted ${mintAmount} tCO₂!\nTx: ${tx.hash.slice(0, 10)}...`);
    } catch (err: any) {
      console.error("Mint error:", err);
      let errorMessage = "Minting failed. Please try again.";

      if (err.reason) errorMessage = err.reason;
      else if (err.message?.includes("user rejected")) errorMessage = "Transaction was rejected by user.";

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
              <h1 className='text-4xl font-extrabold text-gray-900 tracking-tight'>My Projects</h1>
              <p className='text-lg text-gray-500'>Track and manage your carbon credit projects</p>
            </div>
          </div>
          <button 
            onClick={() => showInfo("Project submission coming soon!")}
            className='flex items-center space-x-2 px-6 py-3.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 hover:shadow-lg transition-all font-bold'
          >
            <Plus className='h-5 w-5' />
            <span>Submit New Project</span>
          </button>
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
                In Review
              </div>
            </div>
            <p className='text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2'>Processing Total</p>
            <h3 className='text-4xl font-black text-gray-900 mb-2'>{processingValue.toFixed(0)} <span className='text-lg font-bold text-gray-400'>tCO₂</span></h3>
            <p className='text-sm text-gray-500 flex items-center font-medium'><BarChart3 className='h-4 w-4 text-yellow-500 mr-2' />Pending verification</p>
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
                Completed
              </div>
            </div>
            <p className='text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2'>Processed Total</p>
            <h3 className='text-4xl font-black text-gray-900 mb-2'>{processedValue.toFixed(0)} <span className='text-lg font-bold text-gray-400'>tCO₂</span></h3>
            <p className='text-sm text-gray-500 flex items-center font-medium'><TrendingUp className='h-4 w-4 text-green-500 mr-2' />Issued & Finalized</p>
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
              <option value='all-time'>All Time</option>
              <option value='2024'>Year 2024</option>
              <option value='2023'>Year 2023</option>
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
                    <img src={project.images[0]} alt={project.projectName} loading="lazy" onError={(e) => (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
                          <span className='flex items-center'><Calendar className='h-4 w-4 mr-2 text-green-500' />Vintage {project.vintage}</span>
                          <span className='flex items-center'><Leaf className='h-4 w-4 mr-2 text-green-500' />{project.projectType}</span>
                        </div>
                      </div>
                      <div className='hidden sm:block text-right'>
                        <span className='text-[10px] font-black text-gray-300 uppercase tracking-widest'>Submitted On</span>
                        <p className='text-sm font-bold text-gray-900'>{new Date(project.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4 mb-8'>
                      <div className='bg-green-50/50 rounded-3xl p-6 border border-green-100'>
                        <p className='text-[10px] font-black text-green-600 uppercase tracking-widest mb-2'>Available to Mint</p>
                        <p className='text-3xl font-black text-green-900'>{project.availableToMint} <span className='text-xs font-bold text-green-600/50'>tCO₂</span></p>
                      </div>
                      <div className='bg-gray-50 rounded-3xl p-6 border border-gray-100'>
                        <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2'>Total Expected</p>
                        <p className='text-3xl font-black text-gray-900'>{project.expectedCredits} <span className='text-xs font-bold text-gray-400'>tCO₂</span></p>
                      </div>
                    </div>

                    <div className='mt-auto flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-100'>
                      <div className='flex items-center space-x-3'>
                        <div className='h-10 w-10 bg-green-100 rounded-full flex items-center justify-center'>
                            <BarChart3 className='h-5 w-5 text-green-600' />
                        </div>
                        <div>
                            <span className='text-[10px] font-black text-gray-400 uppercase tracking-wider block'>Currently Issued</span>
                            <span className='text-lg font-black text-green-700'>{project.issuedAmount} <span className='text-xs'>tCO₂</span></span>
                        </div>
                      </div>
                      <div className='flex items-center space-x-3 w-full sm:w-auto'>
                        {project.nftTokenId !== null && project.status === 'Issued' && project.availableToMint > 0 && (
                          <button 
                            onClick={() => handleMint(project)} 
                            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Mint Credits</span>
                          </button>
                        )}
                        <button 
                          onClick={() => onOpenProjectDetail?.(project.id)} 
                          className='flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all'
                        >
                          <Eye className='h-4 w-4' />
                          <span>View Details</span>
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
            <h3 className='text-3xl font-black text-gray-900 mb-4'>No projects found</h3>
            <p className='text-gray-400 font-medium max-w-sm mx-auto'>Try adjusting your filters to find the projects you are looking for.</p>
          </div>
        )}

        {/* Mint Modal */}
        {mintModalOpen && mintProject && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">Mint Credits</h3>
                <button onClick={() => setMintModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl mb-8">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Project Name</label>
                <div className="text-gray-900 font-bold text-lg">{mintProject.projectName}</div>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Amount to mint (tCO₂)</label>
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">Available: {mintProject.availableToMint}</span>
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
                  {mintLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <span>Confirm & Mint</span>}
                </button>
                <button onClick={() => setMintModalOpen(false)} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors">
                  Maybe Later
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