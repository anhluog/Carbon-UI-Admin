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
        <img src={imgUrl} alt="Dự án" className="w-full h-full object-cover" />
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
    const [activeFilter, setActiveFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all-time');
    const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');

    const [showRejectionPopup, setShowRejectionPopup] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [projectToVerify, setProjectToVerify] = useState<Project | null>(null);

    const fetchRequests = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await api.get('/projects/ProjectVerified');
            setProjects(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            showError("Không thể tải danh sách dự án đã thẩm định");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const fetchProcessedProjects = async () => {
        try {
            const response = await api.get('/projects/processed-project');
            setProcessedProjects(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchProcessedProjects();
    }, []);

    const mapProjectType = (type: string) => {
        switch (type) {
            case 'FOREST_AND_GREENRY': return 'Bảo vệ rừng';
            case 'RENEWABLE_ENERGY': return 'Năng lượng tái tạo';
            case 'ENERGY_EFFICIENCY': return 'Hiệu quả năng lượng';
            default: return 'Khác';
        }
    };

    const mapStatus = (status: string) => {
        switch (status) {
            case 'VERIFIED': return 'Đang chờ phê duyệt';
            case 'APPROVED': return 'Đã cấp phát';
            case 'REJECTED_BY_GOVERNMENT': return 'Bị Chính phủ từ chối';
            default: return status;
        }
    };

    const processingValue = projects.reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);
    const processedValue = processedProjects.reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

    const currentProjects = activeTab === 'processing' ? projects : processedProjects;

    const filteredProjects = currentProjects.filter(project => {
        const mappedStatus = mapStatus(project.status);
        const matchesTab = activeTab === 'processing'
            ? mappedStatus === 'Đang chờ phê duyệt'
            : (mappedStatus === 'Đã cấp phát' || mappedStatus === 'Bị Chính phủ từ chối');

        const matchesType = activeFilter === 'all' ||
            (activeFilter === 'forest' && mapProjectType(project.type) === 'Bảo vệ rừng') ||
            (activeFilter === 'renewable' && mapProjectType(project.type) === 'Năng lượng tái tạo');

        const matchesTime = timeFilter === 'all-time' || project.vintage.toString() === timeFilter;

        return matchesTab && matchesType && matchesTime;
    });

    const handleReject = async () => {
        if (rejectionReason.trim() === '' || !projectToVerify) return;
        try {
            await api.post(`/projects/${projectToVerify.id}/approved`, {
                approved: false,
                reason: rejectionReason
            });
            showSuccess(`Dự án ${projectToVerify.name} đã bị từ chối.`);
            fetchRequests(true);
            fetchProcessedProjects();
            setShowRejectionPopup(false);
            setRejectionReason('');
        } catch (err) {
            showError("Từ chối dự án thất bại.");
        }
    };

    const handleConfirmAccept = async (project: Project) => {
        try {
            showInfo("Vui lòng xác nhận giao dịch trên ví của bạn...");
            const contractAddress = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CarbonCreditEx.abi, signer);
            const myAddress = await signer.getAddress();

            const tx = await contract.approveAndMintProject(
                project.id,
                project.ownerId,
                project.verifiedBy,
                myAddress,
                project.ipfsHash,
                project.expectedCredits
            );

            showInfo("Giao dịch đang được xử lý...");
            await tx.wait();
            showSuccess("Phê duyệt và đúc tín chỉ trên Blockchain thành công!");
            fetchRequests(true);
            fetchProcessedProjects();
        } catch (err: any) {
            showError(err.reason || "Giao dịch Blockchain thất bại");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen font-medium"><p>Đang tải danh sách dự án...</p></div>;
    }

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
                            <h1 className='text-4xl font-bold text-gray-900'>Quản lý phê duyệt</h1>
                            <p className='text-lg text-gray-600 mt-1'>Phê duyệt và cấp phát tín chỉ carbon cho các dự án đã thẩm định</p>
                        </div>
                    </div>
                    <button className='flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium shadow-md'>
                        <Plus className='h-5 w-5' />
                        <span>Dự án mới</span>
                    </button>
                </div>

                {/* Thống kê / Tabs */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-10'>
                    <div onClick={() => setActiveTab('processing')} className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${activeTab === 'processing' ? 'shadow-lg border-2 border-yellow-200' : 'shadow-md hover:shadow-lg'}`}>
                        <div className='flex items-center justify-between mb-6'>
                            <div className='h-14 w-14 rounded-2xl bg-yellow-100 flex items-center justify-center'>
                                <Clock className='h-7 w-7 text-yellow-600' />
                            </div>
                            <div className={`px-3 py-1 rounded-full ${activeTab === 'processing' ? 'bg-yellow-100 text-yellow-700 font-semibold' : 'bg-gray-100 text-gray-500 text-xs'}`}>
                                Đang chờ xử lý
                            </div>
                        </div>
                        <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Tổng lượng đang chờ</p>
                        <h3 className='text-4xl font-bold text-gray-900 mb-1'>{processingValue.toFixed(0)} tCO₂</h3>
                        <p className='text-sm text-gray-600 flex items-center space-x-1 mb-4'><BarChart3 className='h-4 w-4 text-yellow-500' /><span>Đang thẩm định</span></p>
                        <button className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'processing' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                            Xem các dự án chờ xử lý
                        </button>
                    </div>

                    <div onClick={() => setActiveTab('processed')} className={`group bg-white rounded-3xl p-8 cursor-pointer transition-all duration-300 ${activeTab === 'processed' ? 'shadow-lg border-2 border-green-200' : 'shadow-md hover:shadow-lg'}`}>
                        <div className='flex items-center justify-between mb-6'>
                            <div className='h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center'>
                                <CheckCircle className='h-7 w-7 text-green-600' />
                            </div>
                            <div className={`px-3 py-1 rounded-full ${activeTab === 'processed' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-500 text-xs'}`}>
                                Đã hoàn tất
                            </div>
                        </div>
                        <p className='text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider'>Tổng lượng đã xử lý</p>
                        <h3 className='text-4xl font-bold text-gray-900 mb-1'>{processedValue.toFixed(0)} tCO₂</h3>
                        <p className='text-sm text-gray-600 flex items-center space-x-1 mb-4'><TrendingUp className='h-4 w-4 text-green-500' /><span>Đã cấp phát & Từ chối</span></p>
                        <button className={`w-full py-2 px-4 rounded-xl font-medium transition-all ${activeTab === 'processed' ? 'bg-green-500 text-white shadow-lg' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                            Xem lịch sử xử lý
                        </button>
                    </div>
                </div>

                {/* Bộ lọc */}
                <div className='bg-white rounded-3xl p-6 shadow-md mb-10'>
                    <div className='flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center'>
                        <div className='flex flex-wrap gap-3'>
                            {['all', 'forest', 'renewable'].map((id) => (
                                <button key={id} onClick={() => setActiveFilter(id)} className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${activeFilter === id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {id === 'all' ? 'Tất cả dự án' : id === 'forest' ? 'Bảo vệ rừng' : 'Năng lượng tái tạo'}
                                </button>
                            ))}
                        </div>
                        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className='px-5 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-green-500'>
                            <option value='all-time'>Tất cả thời gian</option>
                            <option value='2024'>Năm 2024</option>
                            <option value='2023'>Năm 2023</option>
                        </select>
                    </div>
                </div>

                {/* Danh sách dự án */}
                <div className='grid gap-6'>
                    {filteredProjects.map((project) => (
                        <div key={project.id} className='group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-500'>
                            <div className='flex flex-col lg:flex-row'>
                                <div className="lg:w-80 h-64 lg:h-auto relative overflow-hidden bg-gray-100">
                                    <ProjectThumbnail ipfsHash={project.ipfsHash} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                                </div>

                                <div className='flex-1 p-8'>
                                    <div className='flex justify-between items-start mb-4'>
                                        <div>
                                            <h3 className='text-2xl font-bold text-gray-900 mb-3'>{project.name}</h3>
                                            <div className='flex items-center space-x-2 mb-3'>
                                                <Clock className='h-4 w-4 text-yellow-600' />
                                                <span className='px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>{mapStatus(project.status)}</span>
                                            </div>
                                            <div className='flex flex-wrap gap-4 text-sm text-gray-600 font-medium'>
                                                <span className='flex items-center space-x-2'><MapPin className='h-4 w-4 text-gray-400' /><span>{project.location}</span></span>
                                                <span className='flex items-center space-x-2'><Calendar className='h-4 w-4 text-gray-400' /><span>Vintage {project.vintage}</span></span>
                                                <span className='flex items-center space-x-2'><Leaf className='h-4 w-4 text-gray-400' /><span>{mapProjectType(project.type)}</span></span>
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <p className='text-sm text-gray-500 font-medium'>{new Date(project.createdAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6'>
                                        <div className='bg-gray-50 rounded-2xl p-5'>
                                            <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Tín chỉ dự kiến</p>
                                            <p className='text-3xl font-bold text-gray-900'>{project.expectedCredits} <span className='text-lg font-semibold'>tCO₂</span></p>
                                        </div>
                                        <div className='bg-gray-50 rounded-2xl p-5'>
                                            <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Đã bán</p>
                                            <p className='text-3xl font-bold text-gray-900'>0 <span className='text-lg font-semibold'>tCO₂</span></p>
                                        </div>
                                    </div>

                                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-100'>
                                        <div className='flex items-center space-x-2 text-sm text-gray-600'>
                                            <div className='h-2 w-2 bg-gray-400 rounded-full' />
                                            <span className='font-medium'>Chủ dự án: <span className='text-gray-700 font-bold'>{project.ownerId.slice(0, 10)}...</span></span>
                                        </div>
                                        <div className='flex items-center space-x-3 w-full sm:w-auto'>
                                            {activeTab === 'processing' && (
                                                <>
                                                    <button onClick={() => handleConfirmAccept(project)} className="flex items-center space-x-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-semibold">
                                                        <CheckCircle className="h-4 w-4" />
                                                        <span>Chấp thuận</span>
                                                    </button>
                                                    <button onClick={() => { setProjectToVerify(project); setShowRejectionPopup(true); }} className="flex items-center space-x-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all font-semibold">
                                                        <X className="h-4 w-4" />
                                                        <span>Từ chối</span>
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => onOpenProjectDetail?.(project.id, 'approvedProject')} className='bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition-all flex items-center justify-center space-x-2 shadow-md'>
                                                <Eye className='h-4 w-4' />
                                                <span>Chi tiết</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProjects.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                            <p className="text-gray-500 font-medium">Không tìm thấy dự án nào phù hợp.</p>
                        </div>
                    )}
                </div>

                {/* Modal từ chối */}
                {showRejectionPopup && projectToVerify && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Từ chối dự án</h3>
                            <p className="mb-4 text-gray-600 font-medium">Nhập lý do từ chối dự án "{projectToVerify.name}":</p>
                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Nhập lý do tại đây..." className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-red-500" rows={4} />
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setShowRejectionPopup(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-100 transition-all">Hủy bỏ</button>
                                <button onClick={handleReject} disabled={!rejectionReason.trim()} className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50">Từ chối</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApprovedProject;