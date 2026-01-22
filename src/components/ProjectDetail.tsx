import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  CheckCircle,
  Leaf,
  Users,
  Download,
  ArrowLeft,
  ArrowRight,
  FileText,
  ExternalLink,
} from 'lucide-react';
import api from '../utils/axiosInstance';

interface ProjectResponse {
  id: string;
  name: string;
  vintage: number;
  location: string;
  type: string;
  expectedCredits: number;
  description: string;
  ipfsHash: string;
  nftTokenId: number;
  createdAt: string;
  status: string;
  onchainHash: string;
  issueAmount: number;
  retiredAmount: number;
  ownerName: string;
  verifyName: string;
  governmentName: string;
}

interface ProjectDetailPageProps {
  projectId: string | null;
  onBack: () => void;
}

const fetchIpfsMetadata = async (ipfsHash: string) => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return await res.json();
  } catch {
    return null;
  }
};

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  onBack,
}) => {
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/projects/detail/${projectId}`);
        setProject(res.data);

        if (res.data.ipfsHash) {
          setMetadata(await fetchIpfsMetadata(res.data.ipfsHash));
        }
      } catch {
        setError('Không thể tải dữ liệu dự án');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const images =
    metadata?.images?.map((img: string) =>
      img.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    ) ||
    (metadata?.image
      ? [metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')]
      : ['/placeholder-image.jpg']);

  const documents =
    metadata?.documents?.map((doc: string) =>
      doc.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    ) || [];

  if (loading)
    return (
      <div className="text-center pt-20">
        <div className="animate-spin h-12 w-12 border-b-2 border-green-600 mx-auto rounded-full" />
      </div>
    );

  if (error || !project)
    return <div className="text-center pt-20 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-green-600"
      >
        <ArrowLeft size={18} /> Quay lại danh sách dự án
      </button>

      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-green-200 shadow-sm">
        <h3 className="text-2xl font-bold mb-2">{project.name}</h3>

        <div className="flex gap-4 text-sm text-gray-600 mb-6">
          <span className="flex items-center gap-1">
            <MapPin size={14} /> {project.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} /> {project.vintage}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ===== LEFT ===== */}
          <div>
            {/* Slider */}
            <div className="relative h-80 bg-gray-100 rounded-2xl overflow-hidden mb-4">
              <img
                src={images[currentImageIndex]}
                alt={project.name}
                className="w-full h-full object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        (i) => (i - 1 + images.length) % images.length
                      )
                    }
                    className="absolute left-2 top-1/2 bg-black/40 text-white p-2 rounded-full"
                  >
                    <ArrowLeft />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((i) => (i + 1) % images.length)
                    }
                    className="absolute right-2 top-1/2 bg-black/40 text-white p-2 rounded-full"
                  >
                    <ArrowRight />
                  </button>
                </>
              )}
            </div>

            {/* ===== TÀI LIỆU ===== */}
            {documents.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-4">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <FileText size={18} /> Hồ sơ & Tài liệu
                </h4>

                {documents.map((doc: string, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white p-3 rounded-xl border mb-2"
                  >
                    <span className="text-sm">Tài liệu #{i + 1}</span>
                    <div className="flex gap-2">
                      <a
                        href={doc}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 text-sm"
                      >
                        Xem
                      </a>
                      <a
                        href={doc}
                        download
                        className="text-blue-600 text-sm"
                      >
                        Tải
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== RIGHT ===== */}
          <div className="space-y-4">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Leaf size={18} /> Thông số tín chỉ
              </h4>
              <div className="text-sm space-y-2">
                <div>
                  Dự kiến: <b>{project.expectedCredits}</b> tCO₂
                </div>
                <div>
                  Đã phát hành: <b>{project.issueAmount}</b>
                </div>
                <div>
                  Đã retired: <b>{project.retiredAmount}</b>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Users size={18} /> Các bên liên quan
              </h4>
              <div className="text-sm space-y-2">
                <div>
                  Chủ sở hữu: <b>{project.ownerName}</b>
                </div>
                <div>
                  Đơn vị xác minh: <b>{project.verifyName}</b>
                </div>
                <div>
                  Cơ quan phê duyệt: <b>{project.governmentName}</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MÔ TẢ CHI TIẾT (TÁCH RIÊNG) ===== */}
        <div className="mt-10 bg-gray-50 rounded-2xl p-8 border border-gray-200 max-w-none">
          <h4 className="font-bold text-lg mb-4">
            Mô tả chi tiết dự án
          </h4>

          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* ===== THÔNG TIN BLOCKCHAIN (TÁCH RIÊNG) ===== */}
        {project.onchainHash && (
          <div className="mt-6 bg-gray-900 text-white rounded-2xl p-6">
            <h4 className="text-sm uppercase tracking-widest text-gray-400 mb-3">
              Thông tin Blockchain
            </h4>

            <div className="flex justify-between text-sm mb-2">
              <span>NFT Token ID</span>
              <span className="font-mono text-green-400">
                #{project.nftTokenId}
              </span>
            </div>

            <div className="text-xs font-mono break-all text-gray-300 mb-4">
              Tx Hash: {project.onchainHash}
            </div>

            <a
              href={`https://etherscan.io/tx/${project.onchainHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-green-400 text-sm hover:underline"
            >
              <ExternalLink size={14} /> Kiểm tra Blockchain
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
