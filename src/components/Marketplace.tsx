import React, { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Award,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import CryptoMarket from "./CryptoMarket";
import api from "../utils/axiosInstance";
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';

interface MarketplaceProps {
  walletAddress: string;
  setActiveTab: (tab: string) => void;
  onOpenProjectDetail: (projectId: string) => void;
}

interface Project {
  id: string;
  name: string;
  type: string;
  location: string;
  vintage: number;
  ownerId: string;
  description: string;
  ipfsHash: string;
  status: string;
  createdAt: string;
}

interface TradingStatus {
  isMinted: boolean;
  tokenId: number | null;
  availableAmount: number;
  issueAmount: number;
  projectName: string;
  projectId: string;
  hasOrderBook: boolean;
  canTrade: boolean;
  hasCredit?: boolean;
}

const Marketplace: React.FC<MarketplaceProps> = ({
  walletAddress,
  setActiveTab,
  onOpenProjectDetail
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tradingStatuses, setTradingStatuses] = useState<Map<string, TradingStatus>>(new Map());
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCryptoMarket, setShowCryptoMarket] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketplaceProjects();
  }, []);

  const loadMarketplaceProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get APPROVED projects
      const response = await api.get(`/projects/marketplace`);
      const approvedProjects = response.data;

      console.log('📝 Loading marketplace projects:', approvedProjects.length);

      // Load trading status for each project
      const statusMap = new Map<string, TradingStatus>();

      await Promise.all(
        approvedProjects.map(async (project: Project) => {
          try {
            const statusResponse = await api.get(
              `/projects/${project.id}/trading-status`
            );

            console.log(`✅ Status loaded for ${project.name}:`, statusResponse.data);
            statusMap.set(project.id, statusResponse.data);
          } catch (err) {
            console.error(`❌ Failed to load status for ${project.id}:`, err);
            statusMap.set(project.id, {
              isMinted: false,
              tokenId: null,
              availableAmount: 0,
              issueAmount: 0,
              projectName: project.name,
              projectId: project.id,
              hasOrderBook: false,
              canTrade: false,
              hasCredit: false
            });
          }
        })
      );

      console.log('✅ All statuses loaded:', statusMap.size);

      setProjects(approvedProjects);
      setTradingStatuses(statusMap);
      setLoading(false);
    } catch (error: any) {
      console.error("❌ Failed to load marketplace projects:", error);
      showError("Không thể tải danh sách dự án. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const handleOpenProjectDetail = (project: Project) => {
    console.log('📝 Opening project detail:', project.id, project.name);

    if (onOpenProjectDetail) {
      onOpenProjectDetail(project.id);
    } else {
      console.warn('⚠️ onOpenProjectDetail prop not provided, using event fallback');
      setActiveTab('projectDetail');
      window.dispatchEvent(
        new CustomEvent('openProjectDetail', {
          detail: { projectId: project.id }
        })
      );
    }
  };

  const handleOpenTrading = (project: Project) => {
    const status = tradingStatuses.get(project.id);

    if (!status?.canTrade) {
      showWarning("⚠️ Dự án này chưa có tín chỉ carbon để giao dịch.");
      return;
    }

    if (!status.tokenId) {
      showError("⚠️ Không tìm thấy Token ID.");
      return;
    }

    console.log("📝 Opening trading for project:", {
      projectId: project.id,
      projectName: project.name,
      tokenId: status.tokenId
    });

    setSelectedTokenId(status.tokenId);
    setShowCryptoMarket(true);
  };
  
  const filteredProjects = projects.filter((project) => {
    const status = tradingStatuses.get(project.id);

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "trading" && status?.hasOrderBook) ||
      (activeFilter === "available" && status?.canTrade && !status?.hasOrderBook) ||
      project.type?.toLowerCase().includes(activeFilter.toLowerCase());

    const matchesSearch =
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getTradingBadge = (projectId: string) => {
    const status = tradingStatuses.get(projectId);

    if (!status) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          ⏳ Đang tải...
        </span>
      );
    }

    if (status.hasOrderBook) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
          🟢 Đang giao dịch
          <span className="text-[10px]">({status.availableAmount} tCO₂)</span>
        </span>
      );
    }

    if (status.canTrade && status.isMinted) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
          🔵 Sẵn sàng GD
          <span className="text-[10px]">({status.availableAmount} tCO₂)</span>
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        ⚠️ Chưa có tín chỉ
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Crypto Market Modal */}
      {showCryptoMarket && selectedTokenId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Sàn Giao Dịch</h3>
                  <p className="text-sm text-gray-600">Dự án: {projects.find(p => tradingStatuses.get(p.id)?.tokenId === selectedTokenId)?.name || 'Không xác định'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowCryptoMarket(false);
                    setSelectedTokenId(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <CryptoMarket
                walletAddress={walletAddress}
                creditId={selectedTokenId.toString()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🌍 Sàn Giao Dịch Tín Chỉ Carbon
        </h2>
        <p className="text-gray-600">
          Mua bán tín chỉ carbon từ các dự án môi trường đã được chính phủ phê duyệt.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Lỗi</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Dự Án Đã Được Chính Phủ Phê Duyệt</h3>
            <p className="text-sm text-gray-700">
              Tất cả các dự án được liệt kê ở đây đã được xác minh và phê duyệt bởi cơ quan chức năng.
              Bạn có thể đặt lệnh mua hoặc bán một cách an toàn. Sổ lệnh (OrderBook) sẽ được tạo tự động ngay khi có giao dịch đầu tiên.
            </p>
          </div>
        </div>
      </div>

      {/* Marketplace */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Tất cả dự án
          </button>
          <button
            onClick={() => setActiveFilter("trading")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'trading'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Đang giao dịch
          </button>
          <button
            onClick={() => setActiveFilter("available")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'available'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
              }`}
          >
            Sẵn sàng GD
          </button>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Danh Sách Dự Án</h3>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Dự Án</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại hình</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa điểm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niên vụ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenProjectDetail(project)}
                        className="text-left hover:text-green-600 font-medium transition-colors underline decoration-dotted"
                      >
                        {project.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                        {project.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTradingBadge(project.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {project.vintage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleOpenTrading(project)}
                        disabled={!tradingStatuses.get(project.id)?.canTrade}
                        className="text-green-600 hover:text-green-900 font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Giao dịch →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Không tìm thấy dự án nào</p>
              <p className="text-gray-400">Hãy thử điều chỉnh bộ lọc tìm kiếm.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;