import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Eye, MapPin, CheckCircle, Calendar, X, Clock, TrendingUp, BarChart3, Filter, Leaf } from 'lucide-react';
import api from '../utils/axiosInstance';  // Import axios instance từ utils
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCredit.json';

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
    onOpenProjectDetail?: (projectId: string, fromTab: string) => void;  // Prop để mở detail tab
}

const ApprovedProject: React.FC<ApprovedProjectProps> = ({ onOpenProjectDetail }) => {
    const [projects, setProjects] = useState<Project[]>([]); // Verified projects (processing)
    const [processedProjects, setProcessedProjects] = useState<Project[]>([]); // Processed projects
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showRejectionPopup, setShowRejectionPopup] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [projectToVerify, setProjectToVerify] = useState<Project | null>(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all-time');
    const [activeTab, setActiveTab] = useState<'processing' | 'processed'>('processing');  // Thêm state cho tab

    // Thêm state để lưu image URL cho từng project (từ IPFS metadata)
    const [projectImages, setProjectImages] = useState<Record<string, string | null>>({});

    const fetchRequests = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/projects/ProjectVerified');
            console.log('Fetched projects for verification:', response.data);
            // Safe: Đảm bảo array, filter item undefined
            setProjects(Array.isArray(response.data) ? response.data : []);
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('Access denied: Admin role required.');
            } else if (err.response?.status === 404) {
                setError('Endpoint not found – Check backend.');
            } else {
                setError('Failed to load: ' + (err.response?.data?.message || err.message));
            }
            setProjects([]);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProcessedProjects = async () => {
        try {
            const response = await api.get('/projects/processed-project');
            console.log('Fetched processed projects:', response.data);
            setProcessedProjects(Array.isArray(response.data) ? response.data : []);
        } catch (err: any) {
            console.error('Fetch processed projects error:', err);
            setProcessedProjects([]);
        }
    };

    // Hàm async để load image từ IPFS metadata (sử dụng gateway thân thiện với CORS)
    const loadProjectImage = async (projectId: string, ipfsHash: string) => {
        if (!ipfsHash || projectImages[projectId]) return; // Đã load rồi thì skip

        try {
            console.log(`Loading image for project ${projectId} from IPFS: ${ipfsHash}`);
            // Sử dụng Cloudflare IPFS gateway (dweb.link) để tránh 504 timeout và CORS issues với ipfs.io
            const METADATA_GATEWAY = 'https://dweb.link/ipfs/';
            const response = await fetch(`${METADATA_GATEWAY}${ipfsHash}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch metadata`);
            }
            const metadata = await response.json();
            const imageUrl = metadata.image; // Sử dụng trực tiếp URL từ metadata (thường là full URL từ Pinata)

            if (imageUrl) {
                // Kiểm tra xem image có load được không (optional, để tránh broken image)
                const imgTest = new Image();
                imgTest.onload = () => {
                    console.log(`Image loaded successfully for project ${projectId}: ${imageUrl}`);
                    setProjectImages(prev => ({ ...prev, [projectId]: imageUrl }));
                };
                imgTest.onerror = () => {
                    console.warn(`Image failed to load for project ${projectId}: ${imageUrl}`);
                    setProjectImages(prev => ({ ...prev, [projectId]: null }));
                };
                imgTest.src = imageUrl;
            } else {
                console.warn(`No "image" field in metadata for project ${projectId}`);
                setProjectImages(prev => ({ ...prev, [projectId]: null }));
            }
        } catch (err) {
            console.error(`Error loading image for project ${projectId}:`, err);
            setProjectImages(prev => ({ ...prev, [projectId]: null }));
        }
    };

    // useEffect để load images cho tất cả projects khi fetch xong
    useEffect(() => {
        if (projects.length > 0) {
            projects.forEach(project => loadProjectImage(project.id, project.ipfsHash));
        }
    }, [projects]);

    useEffect(() => {
        if (processedProjects.length > 0) {
            processedProjects.forEach(project => loadProjectImage(project.id, project.ipfsHash));
        }
    }, [processedProjects]);

    useEffect(() => {
        fetchRequests();
        fetchProcessedProjects();
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

    // Map status để phù hợp với filter
    const mapStatus = (status: string) => {
        switch (status) {
            case 'VERIFIED':
                return 'Waiting for Approval';
            case 'APPROVED':
                return 'Issued';
            case 'REJECTED_BY_GOVERNMENT':
                return 'Rejected by Government';
            default:
                return status;
        }
    };

    // Tính tổng cho Processing (Waiting for Approval) từ verified projects
    const processingValue = projects
        .filter(p => mapStatus(p.status) === 'Waiting for Approval')
        .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

    // Tính tổng cho Processed (Issued + Rejected) từ processed projects
    const processedValue = processedProjects
        .filter(p => mapStatus(p.status) === 'Issued' || mapStatus(p.status) === 'Rejected by Government')
        .reduce((sum, p) => sum + (p.expectedCredits ?? 0), 0);

    // Current projects based on tab
    const currentProjects = activeTab === 'processing' ? projects : processedProjects;

    const projectTypes = [
        { id: 'all', name: 'All Projects', count: currentProjects.length },
        { id: 'forest', name: 'Forest Protection', count: currentProjects.filter(p => mapProjectType(p.type) === 'Forest Protection').length },
        { id: 'renewable', name: 'Renewable Energy', count: currentProjects.filter(p => mapProjectType(p.type) === 'Renewable Energy').length },
        { id: 'efficiency', name: 'Energy Efficiency', count: currentProjects.filter(p => mapProjectType(p.type) === 'Energy Efficiency').length },
    ];

    // Filter dựa trên tab active và các filter khác
    const filteredProjects = currentProjects.filter(project => {
        const mappedStatus = mapStatus(project.status);
        const matchesTab = activeTab === 'processing'
            ? mappedStatus === 'Waiting for Approval'
            : (mappedStatus === 'Issued' || mappedStatus === 'Rejected by Government');

        const matchesType = activeFilter === 'all' ||
            (activeFilter === 'forest' && mapProjectType(project.type) === 'Forest Protection') ||
            (activeFilter === 'renewable' && mapProjectType(project.type) === 'Renewable Energy') ||
            (activeFilter === 'efficiency' && mapProjectType(project.type) === 'Energy Efficiency');

        const matchesTime = timeFilter === 'all-time' ||
            (timeFilter === '2024' && project.vintage === 2024) ||
            (timeFilter === '2023' && project.vintage === 2023);

        return matchesTab && matchesType && matchesTime;
    });

    const handleOpenRejectionPopup = (project: Project) => {
        setProjectToVerify(project);
        setShowRejectionPopup(true);
    };

    const handleCloseRejectionPopup = () => {
        setProjectToVerify(null);
        setShowRejectionPopup(false);
        setRejectionReason('');
    };

    const handleReject = async () => {
        if (rejectionReason.trim() === '' || !projectToVerify) return;
        try {
            await api.post(`/projects/${projectToVerify.id}/approved`, {
                approved: false,
                reason: rejectionReason
            });

            console.log(`Project ${projectToVerify.name} rejected with reason: ${rejectionReason}`);
            if (activeTab === 'processing') {
                fetchRequests();
            } else {
                fetchProcessedProjects();
            }
        } catch (err) {
            console.error('Rejection failed:', err);
        }
        handleCloseRejectionPopup();
    };

    const handleConfirmAccept = async (project: Project) => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            alert('User not found');
            return;
        }

        const user = JSON.parse(userStr);

        // 🔹 1. Validate Input Data
        if (!project.verifiedBy) {
            console.error('Validation Error: Project verification is missing.', project);
            alert('Cannot accept: This project has not been verified by a Verifier yet.');
            return;
        }

        try {
            const contractAddress = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;

            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const signerAddress = await signer.getAddress();

            // 🔹 2. Validate Wallet Matches User
            if (signerAddress.toLowerCase() !== user.id.toLowerCase()) {
                console.warn(`Wallet mismatch: Connected ${signerAddress}, User ${user.id}`);
                const proceed = window.confirm(
                    `Warning: Your connected wallet (${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)}) ` +
                    `does not match your logged-in ID (${user.id.slice(0, 6)}...${user.id.slice(-4)}).\n\n` +
                    `The contract might reject this if you are not the authorized Government admin.\n` +
                    `Do you want to proceed anyway?`
                );
                if (!proceed) return;
            }

            const contract = new ethers.Contract(
                contractAddress,
                CarbonCreditEx.abi,
                signer
            );

            console.log('📝 Approving project:', {
                projectId: project.id,
                ownerId: project.ownerId,
                verifierId: project.verifiedBy,
                governmentId: user.id || signerAddress,
                connectedWallet: signerAddress,
                ipfsHash: project.ipfsHash,
                expectedCredits: project.expectedCredits
            });

            const code = await provider.getCode(project.ownerId);
            console.log("CODE at Owner Address:", code);

            // 🔹 Call Smart Contract
            const tx = await contract.approveAndMintProject(
                project.id,
                project.ownerId,
                project.verifiedBy,
                signerAddress, // Use connected wallet as approver
                project.ipfsHash,
                project.expectedCredits
            );

            console.log('Tx sent:', tx.hash);

            const receipt = await tx.wait(1);
            console.log('Tx confirmed:', receipt);

            // 🔹 Get Token IDs from Event
            const event = receipt.logs
                .map((log: any) => {
                    try {
                        return contract.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find((e: any) => e?.name === 'ProjectApproved');

            if (!event) {
                console.error("Event 'ProjectApproved' not found in logs", receipt.logs);
                throw new Error('ProjectApproved event not found in transaction receipt');
            }

            const creditTokenId = event.args.creditTokenId;
            const nftTokenId = event.args.nftTokenId;

            console.log('Credit Token ID:', creditTokenId.toString());

            // 🔹 Call Backend
            await api.post(`/projects/${project.id}/approved`, {
                approved: true,
                nftTokenId: Number(nftTokenId),
                tokenId: Number(creditTokenId)
            });

            alert(`Project accepted successfully! Token ID: ${creditTokenId}`);
            fetchRequests(); // Refetch

        } catch (err: any) {
            console.error('Accept failed:', err);

            // Detailed Error Handling
            let errorMessage = 'Accept project failed.';
            if (err.code === 'CALL_EXCEPTION') {
                errorMessage += ' The Smart Contract rejected the transaction.';
                errorMessage += '\nPossible reasons:\n1. You do not have "Government" role.\n2. Project ID already exists.\n3. Verifier address is invalid.';
            } else if (err.reason) {
                errorMessage += ` Reason: ${err.reason}`;
            } else if (err.message) {
                errorMessage += ` Details: ${err.message.slice(0, 100)}...`;
            }

            alert(errorMessage);
        }
    };

    // Cập nhật handleViewProject: Gọi prop để mở detail tab thay vì navigate
    const handleViewProject = (project: Project) => {
        if (onOpenProjectDetail) {
            onOpenProjectDetail(project.id, 'approvedProject');  // Gọi với fromTab = 'approvedProject'
        } else {
            console.warn('No detail handler provided – cannot open project detail');
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
                    <div className='flex justify-between items-center mb-12'>
                        <div className='flex items-center space-x-3'>
                            <div className='h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg'>
                                <Leaf className='h-6 w-6 text-white' />
                            </div>
                            <div>
                                <h1 className='text-4xl font-bold text-gray-900'>Projects Management</h1>
                                <p className='text-lg text-gray-600 mt-1'>Approve and manage verified carbon credit projects</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateProject(true)}
                            className='flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium'
                        >
                            <Plus className='h-5 w-5' />
                            <span>New Project</span>
                        </button>
                    </div>
                    <div className='flex justify-center items-center h-64'>
                        <p className='text-gray-600'>Loading projects...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gray-50'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
                    <div className='flex justify-between items-center mb-12'>
                        <div className='flex items-center space-x-3'>
                            <div className='h-12 w-12 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg'>
                                <Leaf className='h-6 w-6 text-white' />
                            </div>
                            <div>
                                <h1 className='text-4xl font-bold text-gray-900'>Projects Management</h1>
                                <p className='text-lg text-gray-600 mt-1'>Approve and manage verified carbon credit projects</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateProject(true)}
                            className='flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium'
                        >
                            <Plus className='h-5 w-5' />
                            <span>New Project</span>
                        </button>
                    </div>
                    <div className='bg-red-50 border border-red-200 rounded-3xl p-8 text-center shadow-md'>
                        <p className='text-red-600 mb-2'>Error: {error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className='text-blue-600 hover:underline'
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
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
                            <h1 className='text-4xl font-bold text-gray-900'>Projects Management</h1>
                            <p className='text-lg text-gray-600 mt-1'>Approve and manage verified carbon credit projects</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateProject(true)}
                        className='flex items-center space-x-2 px-5 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium'
                    >
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

                    {/* Card Processed Total - Tab "Processed" */}
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
                    {filteredProjects.length === 0 ? (
                        <div className='bg-white rounded-3xl p-16 text-center shadow-md'>
                            <div className='h-24 w-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                                <CheckCircle className='h-12 w-12 text-gray-400' />
                            </div>
                            <h3 className='text-2xl font-bold text-gray-900 mb-3'>No projects found</h3>
                            <p className='text-gray-600'>There are no verified projects that match your current filters.</p>
                        </div>
                    ) : (
                        filteredProjects.map((project) => {
                            const mappedStatus = mapStatus(project.status);
                            const isProcessing = mappedStatus === 'Waiting for Approval';
                            const imageUrl = projectImages[project.id];
                            return (
                                <div key={project.id} className='group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-500'>
                                    <div className='flex flex-col lg:flex-row'>
                                        <div className="lg:w-80 h-64 lg:h-auto relative overflow-hidden">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={`${project.name} image`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback nếu image load lỗi
                                                        console.warn(`Fallback to placeholder for ${project.id}`);
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextSibling!.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 transition-opacity duration-300 ${imageUrl ? 'absolute inset-0 opacity-0 hover:opacity-100' : ''}`}
                                                style={{ display: imageUrl ? 'none' : 'flex' }}
                                            >
                                                <Leaf className="h-16 w-16 text-green-500 opacity-50" />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                                        </div>

                                        <div className='flex-1 p-8'>
                                            <div className='flex justify-between items-start mb-4'>
                                                <div>
                                                    <h3 className='text-2xl font-bold text-gray-900 mb-3'>{project.name}</h3>
                                                    <div className='flex items-center space-x-2 mb-3'>
                                                        <Clock className='h-4 w-4 text-yellow-600' />
                                                        <span className='px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                                                            {mappedStatus}
                                                        </span>
                                                    </div>
                                                    <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
                                                        <span className='flex items-center space-x-2'><MapPin className='h-4 w-4 text-gray-400' /><span>{project.location}</span></span>
                                                        <span className='flex items-center space-x-2'><Calendar className='h-4 w-4 text-gray-400' /><span>Vintage {project.vintage}</span></span>
                                                        <span className='flex items-center space-x-2'><Leaf className='h-4 w-4 text-gray-400' /><span>{mapProjectType(project.type)}</span></span>
                                                    </div>
                                                </div>
                                                <div className='text-right'>
                                                    <p className='text-sm text-gray-500 font-medium'>
                                                        {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6'>
                                                <div className='bg-gray-50 rounded-2xl p-5'>
                                                    <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Expected Credits</p>
                                                    <p className='text-3xl font-bold text-gray-900'>{project.expectedCredits} <span className='text-lg'>tCO₂</span></p>
                                                </div>
                                                <div className='bg-gray-50 rounded-2xl p-5'>
                                                    <p className='text-sm text-gray-600 font-medium mb-2 uppercase tracking-wider'>Sold</p>
                                                    <p className='text-3xl font-bold text-gray-900'>0 <span className='text-lg'>tCO₂</span></p>
                                                </div>
                                            </div>

                                            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-100'>
                                                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                                                    <div className='h-2 w-2 bg-gray-400 rounded-full' />
                                                    <span className='font-medium'>Owner: <span className='text-gray-700 font-semibold'>{project.ownerId}</span></span>
                                                </div>
                                                <div className='flex items-center space-x-3 w-full sm:w-auto'>
                                                    {isProcessing && (
                                                        <>
                                                            <button
                                                                onClick={() => handleConfirmAccept(project)}
                                                                className="flex items-center space-x-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                                <span>Accept</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenRejectionPopup(project)}
                                                                className="flex items-center space-x-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                <span>Reject</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewProject(project)}
                                                        className='bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-all flex items-center justify-center space-x-2'
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                        <span>Details</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Rejection Modal */}
                {showRejectionPopup && projectToVerify && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Reject Project</h3>
                            <p className="text-gray-600 mb-4">Please provide a reason for rejecting "{projectToVerify.name}".</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none mb-6 resize-vertical"
                                rows={4}
                            />
                            <div className="flex justify-end space-x-3">
                                <button onClick={handleCloseRejectionPopup} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100">
                                    Cancel
                                </button>
                                <button
                                    disabled={rejectionReason.trim() === ''}
                                    onClick={handleReject}
                                    className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 flex items-center space-x-2"
                                >
                                    <X className="h-4 w-4" />
                                    <span>Reject</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Project Modal Placeholder */}
                {showCreateProject && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h3>
                            <p className="text-gray-600 mb-6">Project creation form goes here.</p>
                            <div className="flex justify-end">
                                <button onClick={() => setShowCreateProject(false)} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100">
                                    Cancel
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