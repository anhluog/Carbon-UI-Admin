import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, MapPin, Leaf, Eye, BarChart3, CheckCircle, Clock, Map as MapIcon } from 'lucide-react';
import api from '../utils/axiosInstance';
// Import các hàm toast từ utils của bạn (điều chỉnh lại đường dẫn cho đúng)
import { showSuccess, showError, showInfo } from '../utils/toast'; 

// --- Helper Component: Load ảnh IPFS không chặn UI ---
const ProjectThumbnail = ({ ipfsHash }: { ipfsHash: string }) => {
  const [imgUrl, setImgUrl] = useState("https://via.placeholder.com/400x300?text=Loading...");

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      if (!ipfsHash) return;
      try {
        const res = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        const metadata = await res.json();
        if (isMounted && metadata) {
          const url = metadata.images?.[0] || metadata.image;
          if (url) {
            setImgUrl(url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
          }
        }
      } catch (err) {
        if (isMounted) setImgUrl("https://via.placeholder.com/400x300?text=No+Image");
      }
    };
    fetchMetadata();
    return () => { isMounted = false; };
  }, [ipfsHash]);

  return <img src={imgUrl} alt="Project" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />;
};

// --- Interfaces ---
interface Project {
  id: string;
  projectName: string;
  projectType: string;
  location: string;
  vintage: number;
  expectedCredits: number;
  issuedAmount: number;
  date: string;
  status: string;
  rawStatus: string;
  ipfsHash: string;
}

interface VerifyProjectProps {
  onOpenProjectDetail?: (projectId: string) => void;
}

const VerifyProject: React.FC<VerifyProjectProps> = ({ onOpenProjectDetail }) => {
  // States dữ liệu
  const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');
  const [processingProjects, setProcessingProjects] = useState<Project[]>([]);
  const [processedProjects, setProcessedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');

  // Popup states
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [projectToVerify, setProjectToVerify] = useState<Project | null>(null);
  const [showAcceptPopup, setShowAcceptPopup] = useState(false);
  const [acceptCredits, setAcceptCredits] = useState<number | ''>('');
  const [projectToAccept, setProjectToAccept] = useState<Project | null>(null);

  // --- Helper Mappers ---
  const mapProjectType = (type: string) => {
    const types: Record<string, string> = {
      'FOREST_AND_GREENRY': 'Forest Protection',
      'RENEWABLE_ENERGY': 'Renewable Energy',
      'ENERGY_EFFICIENCY': 'Energy Efficiency'
    };
    return types[type] || 'Other';
  };

  const mapStatus = (status: string) => {
    const statuses: Record<string, string> = {
      'SUBMITTED': 'Waiting for Review',
      'VERIFIED': 'Waiting for Approval',
      'REJECTED_BY_VERIFIER': 'Rejected by Verifier',
      'REJECTED_BY_GOV': 'Rejected by Government',
      'APPROVED': 'Issued'
    };
    return statuses[status] || 'Unknown';
  };

  const syncMapProject = (p: any): Project => ({
    id: p.id,
    projectName: p.name,
    projectType: mapProjectType(p.type),
    location: p.location,
    vintage: p.vintage,
    expectedCredits: p.expectedCredits ?? 0,
    issuedAmount: p.issueAmount ?? 0,
    date: p.createdAt,
    status: mapStatus(p.status),
    rawStatus: p.status,
    ipfsHash: p.ipfsHash
  });

  // --- Fetch Data: Ưu tiên load Processing trước ---
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch PENDING/SUBMITTED đầu tiên
      const resProc = await api.get('/projects/verifier-project?status=SUBMITTED');
      setProcessingProjects((resProc.data || []).map(syncMapProject));
      
      if (!silent) setLoading(false); // Kết thúc loading chính sớm

      // 2. Fetch các trạng thái còn lại ngầm (Background)
      const processedStatuses = ['VERIFIED', 'REJECTED_BY_VERIFIER', 'APPROVED', 'REJECTED_BY_GOV'];
      const responses = await Promise.all(
        processedStatuses.map(status => api.get(`/projects/verifier-project?status=${status}`))
      );
      const allProcessed = responses.flatMap(res => res.data || []);
      setProcessedProjects(allProcessed.map(syncMapProject));
    } catch (error) {
      showError("Failed to fetch project data");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Filter & Search Logic (useMemo để tối ưu) ---
  const currentProjects = useMemo(() => {
    const list = activeTab === 'processing' ? processingProjects : processedProjects;
    return list.filter(p => {
      const matchesType = activeFilter === 'all' || 
        (activeFilter === 'forest' && p.projectType === 'Forest Protection') ||
        (activeFilter === 'renewable' && p.projectType === 'Renewable Energy');
      const matchesTime = timeFilter === 'all-time' || p.vintage.toString() === timeFilter;
      return matchesType && matchesTime;
    });
  }, [activeTab, processingProjects, processedProjects, activeFilter, timeFilter]);

  // --- Actions: Accept / Reject ---
  const handleReject = async () => {
    if (!rejectionReason.trim() || !projectToVerify) return;
    try {
      await api.post(`/projects/${projectToVerify.id}/verify`, {
        approved: false,
        reason: rejectionReason
      });
      showSuccess(`Project "${projectToVerify.projectName}" has been rejected`);
      setShowRejectionPopup(false);
      setRejectionReason('');
      loadData(true); // Reload dữ liệu ngầm
    } catch (err) {
      showError("Failed to reject project. Please try again.");
    }
  };

  const handleConfirmAccept = async () => {
    if (!projectToAccept || !acceptCredits) return;
    try {
      await api.post(`/projects/${projectToAccept.id}/verify`, {
        approved: true,
        expectedCredits: acceptCredits,
      });
      showSuccess(`Project "${projectToAccept.projectName}" verified successfully!`);
      setShowAcceptPopup(false);
      setProjectToAccept(null);
      loadData(true); // Reload dữ liệu ngầm
    } catch (err) {
      showError("Verification failed. Check your connection.");
    }
  };

  if (loading && processingProjects.length === 0) {
    return (
      <div className="flex flex-col h-96 items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-500 font-medium">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 pb-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        
        {/* Header */}
        <div className='flex justify-between items-center mb-10'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Verifier Dashboard</h1>
            <p className='text-gray-500'>Review and manage carbon credit submissions</p>
          </div>
          <button className='flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all'>
            <Plus className='h-4 w-4' />
            <span className="text-sm font-semibold">Support Center</span>
          </button>
        </div>

        {/* Tab Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-10'>
          <button 
            onClick={() => setActiveTab('processing')}
            className={`text-left p-8 rounded-3xl transition-all border-2 ${activeTab === 'processing' ? 'bg-white border-yellow-500 shadow-xl' : 'bg-gray-100 border-transparent'}`}
          >
            <Clock className={`h-8 w-8 mb-4 ${activeTab === 'processing' ? 'text-yellow-500' : 'text-gray-400'}`} />
            <p className='text-sm font-bold text-gray-400 uppercase tracking-widest'>To be Processed</p>
            <h3 className='text-3xl font-black text-gray-900 mt-1'>{processingProjects.length} Projects</h3>
          </button>

          <button 
            onClick={() => setActiveTab('processed')}
            className={`text-left p-8 rounded-3xl transition-all border-2 ${activeTab === 'processed' ? 'bg-white border-green-500 shadow-xl' : 'bg-gray-100 border-transparent'}`}
          >
            <CheckCircle className={`h-8 w-8 mb-4 ${activeTab === 'processed' ? 'text-green-500' : 'text-gray-400'}`} />
            <p className='text-sm font-bold text-gray-400 uppercase tracking-widest'>Action History</p>
            <h3 className='text-3xl font-black text-gray-900 mt-1'>{processedProjects.length} Projects</h3>
          </button>
        </div>

        {/* List Header & Filters */}
        <div className='flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4'>
           <div className='flex gap-2 overflow-x-auto pb-2 w-full md:w-auto'>
              {['all', 'forest', 'renewable'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap uppercase tracking-wider transition-all ${activeFilter === filter ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-200'}`}
                >
                  {filter}
                </button>
              ))}
           </div>
           <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 shadow-sm"
           >
              <option value="all-time">All Vintage</option>
              <option value="2024">Vintage 2024</option>
              <option value="2023">Vintage 2023</option>
           </select>
        </div>

        {/* Projects List */}
        <div className='space-y-6'>
          {currentProjects.map((project) => (
            <div key={project.id} className='bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow'>
              <div className='flex flex-col lg:flex-row'>
                <div className='lg:w-72 h-48 lg:h-auto bg-gray-200'>
                  <ProjectThumbnail ipfsHash={project.ipfsHash} />
                </div>
                
                <div className='flex-1 p-8'>
                  <div className='flex flex-col md:flex-row justify-between gap-4'>
                    <div>
                      <div className='flex items-center gap-2 mb-2'>
                        <span className='px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-md'>{project.projectType}</span>
                        <span className='text-[10px] text-gray-400 font-bold uppercase'>{project.vintage}</span>
                      </div>
                      <h3 className='text-2xl font-bold text-gray-900 mb-2'>{project.projectName}</h3>
                      <div className='flex items-center gap-4 text-gray-500 text-sm'>
                        <span className='flex items-center gap-1'><MapPin className='h-3.5 w-3.5'/> {project.location}</span>
                        <span className='flex items-center gap-1'><Calendar className='h-3.5 w-3.5'/> {new Date(project.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className='text-left md:text-right bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-2xl'>
                       <p className='text-[10px] font-black text-gray-400 uppercase tracking-tighter'>Verification Status</p>
                       <p className={`text-sm font-bold ${project.rawStatus === 'SUBMITTED' ? 'text-yellow-600' : 'text-green-600'}`}>
                         {project.status}
                       </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4 my-6'>
                    <div>
                      <p className='text-[10px] font-black text-gray-400 uppercase'>Expected Credits</p>
                      <p className='text-lg font-bold'>{project.expectedCredits.toLocaleString()} <span className='text-xs font-normal'>tCO₂</span></p>
                    </div>
                    <div>
                      <p className='text-[10px] font-black text-gray-400 uppercase'>Currently Issued</p>
                      <p className='text-lg font-bold'>{project.issuedAmount.toLocaleString()} <span className='text-xs font-normal'>tCO₂</span></p>
                    </div>
                  </div>

                  <div className='flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-50'>
                    <button 
                      onClick={() => onOpenProjectDetail?.(project.id)}
                      className='text-sm font-bold text-gray-900 flex items-center gap-2 hover:underline'
                    >
                      <Eye className='h-4 w-4' /> View Project Dossier
                    </button>

                    {project.rawStatus === 'SUBMITTED' && (
                      <div className='flex gap-2'>
                        <button 
                          onClick={() => { setProjectToVerify(project); setShowRejectionPopup(true); }}
                          className='px-6 py-2 text-red-600 font-bold text-sm hover:bg-red-50 rounded-xl transition-all'
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => { setProjectToAccept(project); setAcceptCredits(project.expectedCredits); setShowAcceptPopup(true); }}
                          className='px-6 py-2 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all'
                        >
                          Verify & Proceed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {currentProjects.length === 0 && (
            <div className='bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-gray-100'>
              <BarChart3 className='h-12 w-12 text-gray-200 mx-auto mb-4' />
              <p className='text-gray-400 font-bold'>No records found in this category</p>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectionPopup && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-2">Reject Submission</h2>
              <p className="text-gray-500 text-sm mb-6">Explain why the project "{projectToVerify?.projectName}" does not meet the criteria.</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Detailed reason for rejection..."
                className="w-full p-4 bg-gray-50 border-none rounded-2xl mb-6 h-32 outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectionPopup(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl">Cancel</button>
                <button onClick={handleReject} disabled={!rejectionReason.trim()} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl disabled:opacity-50">Confirm Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* Accept Modal */}
        {showAcceptPopup && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-2">Issue Verification</h2>
              <p className="text-gray-500 text-sm mb-6">Set final credits for "{projectToAccept?.projectName}".</p>
              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Approved Credit Amount</label>
                <input
                  type="number"
                  value={acceptCredits}
                  onChange={(e) => setAcceptCredits(Number(e.target.value))}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-2xl font-black focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAcceptPopup(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl">Cancel</button>
                <button onClick={handleConfirmAccept} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-2xl">Verify Project</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyProject;