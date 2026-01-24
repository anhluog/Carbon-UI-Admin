import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Calendar,
  Leaf,
  Users,
  ArrowLeft,
  ArrowRight,
  FileText,
  ExternalLink,
} from 'lucide-react';
import api from '../utils/axiosInstance';

// --- Gateway IPFS ---
const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/"
];

interface ProjectResponse {
  id: string; name: string; vintage: number; location: string; type: string;
  expectedCredits: number; description: string; ipfsHash: string;
  nftTokenId: number; createdAt: string; status: string; onchainHash: string;
  issueAmount: number; retiredAmount: number; ownerName: string;
  verifyName: string; governmentName: string;
}

interface ProjectDetailPageProps {
  projectId: string | null;
  onBack: () => void;
  // THÊM: prop role hoặc fromTab để xác định nút quay lại
  userRole?: 'OWNER' | 'VERIFIER' | 'GOVERNMENT' | string; 
}

const getCleanHash = (path: string): string => {
  if (!path) return "";
  return path.replace("ipfs://", "").replace(/^https?:\/\/.*\/ipfs\//, "").split('/').pop() || "";
};

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
  userRole // Nhận role từ component cha
}) => {
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Logic hiển thị chữ trên nút quay lại dựa theo Role
  const getBackBtnText = () => {
    switch (userRole) {
      case 'VERIFIER':
        return 'Quay lại danh sách thẩm định';
      case 'GOVERNMENT':
        return 'Quay lại danh sách phê duyệt';
      default:
        return 'Quay lại danh sách dự án';
    }
  };

  const fetchIpfsMetadata = async (ipfsHash: string) => {
    const hash = getCleanHash(ipfsHash);
    const controllers = GATEWAYS.map(() => new AbortController());
    try {
      const promises = GATEWAYS.slice(0, 3).map((gw, i) => 
        fetch(`${gw}${hash}`, { signal: controllers[i].signal })
          .then(res => {
            if (res.ok) {
              controllers.forEach((c, idx) => { if (idx !== i) c.abort(); });
              return res.json();
            }
            throw new Error();
          })
      );
      return await Promise.any(promises);
    } catch {
      try {
        const res = await fetch(`${GATEWAYS[3]}${hash}`);
        return await res.json();
      } catch { return null; }
    }
  };

  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/projects/detail/${projectId}`);
        setProject(res.data);
        if (res.data.ipfsHash) {
          const meta = await fetchIpfsMetadata(res.data.ipfsHash);
          setMetadata(meta);
        }
      } catch {
        setError('Không thể tải dữ liệu dự án');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const formatUrl = (path: string) => {
    const hash = getCleanHash(path);
    return hash ? `${GATEWAYS[0]}${hash}` : '';
  };

  const images = useMemo(() => {
    const list = metadata?.images || (metadata?.image ? [metadata.image] : []);
    return list.length > 0 ? list.map((h: string) => formatUrl(h)) : ['/placeholder-image.jpg'];
  }, [metadata]);

  const documents = useMemo(() => 
    (metadata?.documents || []).map((doc: string) => formatUrl(doc)), 
  [metadata]);

  if (loading) return <div className="text-center pt-20"><div className="animate-spin h-12 w-12 border-b-2 border-green-600 mx-auto rounded-full" /></div>;
  if (error || !project) return <div className="text-center pt-20 text-red-600 font-bold">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* NÚT QUAY LẠI ĐÃ ĐƯỢC CẬP NHẬT CHỮ THEO ROLE */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-green-600 font-bold transition-all"
      >
        <ArrowLeft size={18} /> {getBackBtnText()}
      </button>

      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-green-200 shadow-sm">
        <h3 className="text-2xl font-bold mb-2">{project.name}</h3>

        <div className="flex gap-4 text-sm text-gray-600 mb-6">
          <span className="flex items-center gap-1"><MapPin size={14} /> {project.location}</span>
          <span className="flex items-center gap-1"><Calendar size={14} /> {project.vintage}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative h-80 bg-gray-100 rounded-2xl overflow-hidden mb-4 border border-gray-200">
              <img
                key={currentImageIndex}
                src={images[currentImageIndex]}
                alt={project.name}
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   for (let i = 0; i < GATEWAYS.length; i++) {
                      if (target.src.includes(GATEWAYS[i]) && i < GATEWAYS.length - 1) {
                         target.src = target.src.replace(GATEWAYS[i], GATEWAYS[i+1]);
                         break;
                      }
                   }
                }}
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><ArrowLeft /></button>
                  <button onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><ArrowRight /></button>
                </>
              )}
            </div>

            {documents.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-4">
                <h4 className="font-bold mb-4 flex items-center gap-2"><FileText size={18} /> Hồ sơ & Tài liệu</h4>
                {documents.map((doc: string, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border mb-2">
                    <span className="text-sm">Tài liệu #{i + 1}</span>
                    <div className="flex gap-2">
                      <a href={doc} target="_blank" rel="noreferrer" className="text-green-600 text-sm hover:underline">Xem</a>
                      <a href={doc} download className="text-blue-600 text-sm hover:underline">Tải</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
              <h4 className="font-bold mb-4 flex items-center gap-2"><Leaf size={18} /> Thông số tín chỉ</h4>
              <div className="text-sm space-y-2">
                <div>Dự kiến: <b>{project.expectedCredits.toLocaleString()}</b> tCO₂</div>
                <div>Đã phát hành: <b>{project.issueAmount.toLocaleString()}</b></div>
                <div>Đã tất toán: <b>{project.retiredAmount.toLocaleString()}</b></div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h4 className="font-bold mb-4 flex items-center gap-2"><Users size={18} /> Các bên liên quan</h4>
              <div className="text-sm space-y-2">
                <div>Chủ sở hữu: <b>{project.ownerName}</b></div>
                <div>Đơn vị xác minh: <b>{project.verifyName || 'N/A'}</b></div>
                <div>Cơ quan phê duyệt: <b>{project.governmentName || 'N/A'}</b></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-gray-50 rounded-2xl p-8 border border-gray-200 max-w-none">
          <h4 className="font-bold text-lg mb-4">Mô tả chi tiết dự án</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>

        {project.onchainHash && (
          <div className="mt-6 bg-gray-900 text-white rounded-2xl p-6 shadow-lg">
            <h4 className="text-sm uppercase tracking-widest text-gray-400 mb-3 font-bold">Thông tin Blockchain</h4>
            <div className="flex justify-between text-sm mb-2">
              <span>NFT Token ID</span>
              <span className="font-mono text-green-400 font-bold">#{project.nftTokenId}</span>
            </div>
            <div className="text-xs font-mono break-all text-gray-300 mb-4 bg-black/20 p-2 rounded">Tx Hash: {project.onchainHash}</div>
            <a href={`https://sepolia.etherscan.io/tx/${project.onchainHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-green-400 text-sm hover:underline font-bold">
              <ExternalLink size={14} /> Kiểm tra trên Etherscan
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;