import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, MapPin, CheckCircle, Calendar, X, Clock, TrendingUp, BarChart3, Leaf } from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCreditSystem.json';
import { showSuccess, showError, showInfo } from '../utils/toast';

// --- Component con xử lý load ảnh IPFS ---
const ProjectThumbnail = ({ ipfsHash }: { ipfsHash: string }) => {
    const [imgUrl, setImgUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchMetadata = async () => {
            if (!ipfsHash) return;
            try {
                const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
                const metadata = await response.json();
                const imageUrl = metadata.image || metadata.images?.[0];
                if (imageUrl && isMounted) {
                    setImgUrl(imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"));
                }
            } catch (err) {
                console.error("Lỗi IPFS", err);
            }
        };
        fetchMetadata();
        return () => { isMounted = false; };
    }, [ipfsHash]);

    return imgUrl ? (
        <img src={imgUrl} alt="Dự án" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
    ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
            <Leaf className="h-16 w-16 text-green-500 opacity-50" />
        </div>
    );
};

interface Project {
    id: string;
    name: string;
    vintage: number;
    ownerId: string;
    type: string;
    location: string;
    description: string;
    ipfsHash: string;
    verifiedBy: string | null;
    approvedBy: string | null;
    expectedCredits: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface ApprovedProjectProps {
    onOpenProjectDetail?: (projectId: string, fromTab: string) => void;
}

const ApprovedProject: React.FC<ApprovedProjectProps> = ({ onOpenProjectDetail }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [processedProjects, setProcessedProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    const [activeFilter, setActiveFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all-time');
    const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');

    const [showRejectionPopup, setShowRejectionPopup] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [projectToVerify, setProjectToVerify] = useState<Project | null>(null);

    // Tải dữ liệu ban đầu
    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                const [resPending, resProcessed] = await Promise.all([
                    api.get('/projects/ProjectVerified'),
                    api.get('/projects/processed-project')
                ]);
                setProjects(Array.isArray(resPending.data) ? resPending.data : []);
                setProcessedProjects(Array.isArray(resProcessed.data) ? resProcessed.data : []);
            } catch (err) {
                showError("Không thể tải danh sách dự án");
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    // Helper map dữ liệu UI
    const mapProjectType = (type: string) => {
        const types: any = { 'FOREST_AND_GREENRY': 'Bảo vệ rừng', 'RENEWABLE_ENERGY': 'Năng lượng tái tạo', 'ENERGY_EFFICIENCY': 'Hiệu quả năng lượng' };
        return types[type] || 'Khác';
    };

    const mapStatus = (status: string) => {
        const statuses: any = { 'VERIFIED': 'Đang chờ phê duyệt', 'APPROVED': 'Đã cấp phát', 'REJECTED_BY_GOVERNMENT': 'Bị Chính phủ từ chối' };
        return statuses[status] || status;
    };

    // Logic lọc danh sách dựa trên Tab và Bộ lọc
    const currentList = useMemo(() => {
        const baseList = activeTab === 'processing' ? projects : processedProjects;
        return baseList.filter(project => {
            const matchesType = activeFilter === 'all' || 
                (activeFilter === 'forest' && project.type === 'FOREST_AND_GREENRY') ||
                (activeFilter === 'renewable' && project.type === 'RENEWABLE_ENERGY');
            const matchesTime = timeFilter === 'all-time' || project.vintage.toString() === timeFilter;
            return matchesType && matchesTime;
        });
    }, [activeTab, projects, processedProjects, activeFilter, timeFilter]);

    // Xử lý DUYỆT & MINT (Blockchain)
    const handleConfirmAccept = async (project: Project) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setProcessingId(project.id);
        
        try {
            const contractAddress = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CarbonCreditEx.abi, signer);
            const myAddress = await signer.getAddress();

            const tx = await contract.approveAndMintProject(
                project.id, project.ownerId, project.verifiedBy,
                myAddress, project.ipfsHash, project.expectedCredits
            );

            await tx.wait();

            showSuccess(`Phê duyệt thành công dự án ${project.name}`);

            // Cập nhật State cục bộ để nhảy Tab ngay lập tức
            const updated: Project = { ...project, status: 'APPROVED', updatedAt: new Date().toISOString() };
            setProjects(prev => prev.filter(p => p.id !== project.id));
            setProcessedProjects(prev => [updated, ...prev]);

        } catch (err: any) {
            showError(err.reason || "Giao dịch thất bại hoặc bị hủy");
        } finally {
            setIsSubmitting(false);
            setProcessingId(null);
        }
    };

    // Xử lý TỪ CHỐI (API)
    const handleReject = async () => {
        if (!rejectionReason.trim() || !projectToVerify || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await api.post(`/projects/${projectToVerify.id}/approved`, {
                approved: false, reason: rejectionReason
            });

            showSuccess(`Đã từ chối dự án ${projectToVerify.name}`);

            // Cập nhật State cục bộ
            const updated: Project = { ...projectToVerify, status: 'REJECTED_BY_GOVERNMENT', updatedAt: new Date().toISOString() };
            setProjects(prev => prev.filter(p => p.id !== projectToVerify.id));
            setProcessedProjects(prev => [updated, ...prev]);

            setShowRejectionPopup(false);
            setRejectionReason('');
            setProjectToVerify(null);
        } catch (err) {
            showError("Từ chối thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="text-gray-500 font-medium tracking-wide">Đang tải dữ liệu Chính phủ...</p>
        </div>;
    }

    return (
        <div className='min-h-screen bg-gray-50 pb-20'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
                {/* Header */}
                <div className='mb-12'>
                    <h1 className='text-4xl font-black text-gray-900 tracking-tight'>Quản lý phê duyệt</h1>
                    <p className='text-lg text-gray-500 mt-2 font-medium'>Cơ quan quản lý: Phê duyệt và đúc tín chỉ carbon lên Blockchain</p>
                </div>

                {/* Thống kê / Tabs */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-10'>
                    <div onClick={() => setActiveTab('processing')} className={`group p-8 rounded-[2.5rem] cursor-pointer transition-all duration-500 border-4 ${activeTab === 'processing' ? 'bg-white border-yellow-400 shadow-2xl scale-[1.02]' : 'bg-gray-100 border-transparent opacity-70 hover:opacity-100'}`}>
                        <div className='flex items-center justify-between mb-6'>
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${activeTab === 'processing' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <Clock className='h-8 w-8' />
                            </div>
                            <span className='text-xs font-black uppercase tracking-widest text-gray-400'>Chờ xử lý</span>
                        </div>
                        <h3 className='text-4xl font-black text-gray-900'>{projects.length} Dự án</h3>
                        <p className='text-gray-500 font-bold mt-2'>Tổng {projects.reduce((s, p) => s + (p.expectedCredits || 0), 0).toLocaleString()} tCO₂</p>
                    </div>

                    <div onClick={() => setActiveTab('processed')} className={`group p-8 rounded-[2.5rem] cursor-pointer transition-all duration-500 border-4 ${activeTab === 'processed' ? 'bg-white border-green-500 shadow-2xl scale-[1.02]' : 'bg-gray-100 border-transparent opacity-70 hover:opacity-100'}`}>
                        <div className='flex items-center justify-between mb-6'>
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${activeTab === 'processed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                <CheckCircle className='h-8 w-8' />
                            </div>
                            <span className='text-xs font-black uppercase tracking-widest text-gray-400'>Lịch sử</span>
                        </div>
                        <h3 className='text-4xl font-black text-gray-900'>{processedProjects.length} Dự án</h3>
                        <p className='text-gray-500 font-bold mt-2'>Đã xử lý xong dữ liệu</p>
                    </div>
                </div>

                {/* Bộ lọc */}
                <div className='flex flex-col md:flex-row justify-between gap-4 mb-8 px-2'>
                    <div className='flex gap-2 overflow-x-auto pb-2'>
                        {['all', 'forest', 'renewable'].map((id) => (
                            <button key={id} onClick={() => setActiveFilter(id)} className={`px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${activeFilter === id ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>
                                {id === 'all' ? 'Tất cả' : id === 'forest' ? 'Lâm nghiệp' : 'Năng lượng'}
                            </button>
                        ))}
                    </div>
                    <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className='px-6 py-2.5 bg-white border-none rounded-2xl font-bold text-sm text-gray-600 shadow-sm focus:ring-2 focus:ring-green-500 outline-none'>
                        <option value='all-time'>Mọi Vintage</option>
                        {["2026", "2025", "2024", "2023", "2022"].map(y => <option key={y} value={y}>Năm {y}</option>)}
                    </select>
                </div>

                {/* Danh sách dự án */}
                <div className='grid gap-8'>
                    {currentList.map((project) => (
                        <div key={project.id} className='group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-500'>
                            <div className='flex flex-col lg:flex-row'>
                                <div className="lg:w-80 h-64 lg:h-auto relative bg-gray-100 overflow-hidden">
                                    <ProjectThumbnail ipfsHash={project.ipfsHash} />
                                </div>

                                <div className='flex-1 p-8 lg:p-10'>
                                    <div className='flex justify-between items-start mb-6'>
                                        <div>
                                            <div className='flex items-center gap-3 mb-3'>
                                                <span className='px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-lg'>{mapProjectType(project.type)}</span>
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${project.status === 'VERIFIED' ? 'bg-yellow-100 text-yellow-700' : project.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {mapStatus(project.status)}
                                                </span>
                                            </div>
                                            <h3 className='text-3xl font-black text-gray-900 mb-2'>{project.name}</h3>
                                            <div className='flex gap-5 text-gray-400 text-sm font-bold uppercase tracking-tight'>
                                                <span className='flex items-center gap-1.5'><MapPin className='h-4 w-4' /> {project.location}</span>
                                                <span className='flex items-center gap-1.5'><Calendar className='h-4 w-4' /> Vintage {project.vintage}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
                                        <div className='bg-gray-50 rounded-3xl p-6'>
                                            <p className='text-[10px] font-black text-gray-400 uppercase mb-1'>Số lượng phê duyệt</p>
                                            <p className='text-3xl font-black text-gray-900'>{project.expectedCredits.toLocaleString()} <span className='text-sm font-bold text-gray-400'>tCO₂</span></p>
                                        </div>
                                        <div className='bg-gray-50 rounded-3xl p-6'>
                                            <p className='text-[10px] font-black text-gray-400 uppercase mb-1'>Thời gian gửi</p>
                                            <p className='text-lg font-bold text-gray-700'>{new Date(project.createdAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>

                                    <div className='flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-gray-50'>
                                        <div className='text-xs font-bold text-gray-400'>ID: {project.id.slice(0, 8)}...</div>
                                        
                                        <div className='flex gap-3'>
                                            <button onClick={() => onOpenProjectDetail?.(project.id, 'approvedProject')} className='p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all'>
                                                <Eye className='h-5 w-5' />
                                            </button>

                                            {activeTab === 'processing' && (
                                                <>
                                                    <button 
                                                        disabled={isSubmitting}
                                                        onClick={() => { setProjectToVerify(project); setShowRejectionPopup(true); }}
                                                        className="px-6 py-3 border-2 border-red-100 text-red-600 rounded-2xl hover:bg-red-50 font-bold text-sm transition-all disabled:opacity-50"
                                                    >
                                                        Từ chối
                                                    </button>
                                                    <button 
                                                        disabled={isSubmitting}
                                                        onClick={() => handleConfirmAccept(project)}
                                                        className="px-8 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 font-bold text-sm shadow-xl shadow-green-100 transition-all disabled:bg-gray-400 flex items-center gap-2"
                                                    >
                                                        {isSubmitting && processingId === project.id ? (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-4 w-4" />
                                                        )}
                                                        {isSubmitting && processingId === project.id ? "Đang xử lý..." : "Phê duyệt & Mint"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {currentList.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-50">
                            <BarChart3 className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                            <p className="text-gray-300 font-black uppercase tracking-widest">Danh mục trống</p>
                        </div>
                    )}
                </div>

                {/* Modal Từ chối */}
                {showRejectionPopup && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Từ chối dự án</h3>
                            <p className="text-gray-500 text-sm mb-8 font-medium">Lý do từ chối sẽ được gửi mail thông báo đến chủ dự án.</p>
                            
                            <textarea 
                                value={rejectionReason} 
                                onChange={(e) => setRejectionReason(e.target.value)} 
                                placeholder="Nhập lý do chi tiết..." 
                                className="w-full p-5 bg-gray-50 border-none rounded-3xl mb-8 h-40 outline-none focus:ring-4 focus:ring-red-50 font-medium"
                            />
                            
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowRejectionPopup(false)} 
                                    className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 transition-all"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleReject} 
                                    disabled={!rejectionReason.trim() || isSubmitting}
                                    className="flex-1 py-4 bg-red-600 text-white font-black rounded-[1.5rem] shadow-lg shadow-red-100 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApprovedProject;