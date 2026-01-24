import React, { useState, useEffect } from 'react';
import { Leaf, Calendar, MapPin, Award, Plus, CheckCircle } from 'lucide-react';
import { ethers } from "ethers";
import axios from 'axios';
import api from '../utils/axiosInstance';

interface MintTokenProps {
  walletAddress: string;
}

interface Methodology {
  id: string;
  organizationName: string;
  description: string;
  version: number;
}

const RequestReview: React.FC<MintTokenProps> = ({ walletAddress }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    vintage: '',
    type: '',
    location: '',
    methodology: '',
    description: '',
    carbonAmount: '',
    imageFiles: [] as File[],
    docFiles: [] as File[],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [metadataHash, setMetadataHash] = useState<string | null>(null);
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);
  const [loadingMethodologies, setLoadingMethodologies] = useState(true);

  useEffect(() => {
    const fetchMethodologies = async () => {
      try {
        setLoadingMethodologies(true);
        const response = await api.get('/verifier-role/all');
        setMethodologies(response.data);
      } catch (err: any) {
        console.error('Lỗi tải danh sách bên thẩm định:', err);
        setMethodologies([
          { id: 'VCS', organizationName: 'Tiêu chuẩn Carbon Xác minh (VCS)', description: 'Mô tả tiêu chuẩn', version: 1 },
          { id: 'CDM', organizationName: 'Cơ chế Phát triển Sạch (CDM)', description: 'Mô tả tiêu chuẩn', version: 1 },
          { id: 'GS', organizationName: 'Tiêu chuẩn Vàng (Gold Standard)', description: 'Mô tả tiêu chuẩn', version: 1 },
          { id: 'CAR', organizationName: 'Dự trữ Hành động Khí hậu (CAR)', description: 'Mô tả tiêu chuẩn', version: 1 }
        ]);
      } finally {
        setLoadingMethodologies(false);
      }
    };
    fetchMethodologies();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageFiles' | 'docFiles'
  ) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, [field]: files });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!(window as any).ethereum) throw new Error("Không tìm thấy MetaMask!");

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // Upload ảnh
      let imageUrls: string[] = [];
      if (formData.imageFiles.length > 0) {
        imageUrls = await Promise.all(
          formData.imageFiles.map(async (file: File) => {
            const imgForm = new FormData();
            imgForm.append("file", file);
            const imgRes = await axios.post(
              "https://api.pinata.cloud/pinning/pinFileToIPFS",
              imgForm,
              {
                headers: {
                  pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
                  pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
                },
              }
            );
            return `https://gateway.pinata.cloud/ipfs/${imgRes.data.IpfsHash}`;
          })
        );
      }

      // Upload tài liệu
      let docUrls: string[] = [];
      if (formData.docFiles.length > 0) {
        docUrls = await Promise.all(
          formData.docFiles.map(async (file: File) => {
            const docForm = new FormData();
            docForm.append("file", file);
            const docRes = await axios.post(
              "https://api.pinata.cloud/pinning/pinFileToIPFS",
              docForm,
              {
                headers: {
                  pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
                  pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
                },
              }
            );
            return `https://gateway.pinata.cloud/ipfs/${docRes.data.IpfsHash}`;
          })
        );
      }

      // Metadata
      const metadata = {
        projectName: formData.projectName,
        vintage: formData.vintage,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        methodology: formData.methodology,
        images: imageUrls,
        documents: docUrls,
        timestamp: new Date().toISOString(),
      };

      const metaRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata,
        {
          headers: {
            "Content-Type": "application/json",
            pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
            pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
          },
        }
      );

      const metadataHash = metaRes.data.IpfsHash;
      setMetadataHash(metadataHash);

      const projectData = {
        name: formData.projectName,
        vintage: parseInt(formData.vintage || '0'),
        ownerId: walletAddress,
        type: formData.type || 'OTHERS',
        location: formData.location,
        verifierRoleId: formData.methodology,
        description: formData.description,
        ipfsHash: metadataHash,
        verifiedBy: null,
        approvedBy: null,
        credits: 0,
        status: 'SUBMITTED',
        expectedCredits: parseInt(formData.carbonAmount || '0'),
      };

      await api.post("projects/save", projectData);
      setShowSuccess(true);
      alert("✅ Đã lưu dự án thành công!");

    } catch (err: any) {
      console.error("Lỗi:", err);
      alert(`❌ Lỗi: ${err.response?.data?.message || err.message || "Gặp lỗi khi lưu dự án!"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'FOREST_AND_GREENRY', label: 'Lâm nghiệp & Mảng xanh' },
    { value: 'RENEWABLE_ENERGY', label: 'Năng lượng tái tạo' },
    { value: 'CARBON_REMOVE', label: 'Loại bỏ Carbon' },
    { value: 'OTHERS', label: 'Khác' }
  ];

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lưu dự án thành công!</h2>
          <p className="text-gray-600 mb-6">
            Dữ liệu dự án của bạn đã được lưu vào hệ thống. <br />
            Mã IPFS: {metadataHash || 'N/A'}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              Dự kiến cấp {formData.carbonAmount} CCT cho dự án {formData.projectName}
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="mt-6 bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-all"
          >
            Quay lại mẫu đăng ký
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Đăng ký dự án Carbon</h2>
        <p className="text-gray-600">Gửi hồ sơ dự án của bạn để được thẩm định và phát hành tín chỉ Carbon (CCT).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên dự án *</label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="Ví dụ: Bảo tồn rừng ngập mặn Cần Giờ"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng tín chỉ dự kiến (CCT) *</label>
                <input
                  type="number"
                  name="carbonAmount"
                  value={formData.carbonAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="1000"
                  min="1"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí dự án *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="TP. Hồ Chí Minh, Việt Nam"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bên thẩm định *</label>
                <select
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleInputChange}
                  disabled={loadingMethodologies}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all disabled:opacity-50"
                  required
                >
                  <option value="">{loadingMethodologies ? 'Đang tải dữ liệu...' : 'Chọn đơn vị thẩm định'}</option>
                  {methodologies.map((method) => (
                    <option key={method.id} value={method.id}>{method.organizationName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Năm thực hiện *</label>
                <input
                  type="number"
                  name="vintage"
                  value={formData.vintage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="2024"
                  min="2020"
                  max="2030"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại hình dự án *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                required
              >
                <option value="">Chọn loại hình</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết dự án *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                placeholder="Mô tả tác động môi trường và các chi tiết kỹ thuật của dự án..."
                required
                minLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh dự án (Nhiều ảnh)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'imageFiles')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {formData.imageFiles.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">Đã chọn {formData.imageFiles.length} ảnh</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tài liệu xác minh (PDF, DOCS)</label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange(e, 'docFiles')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {formData.docFiles.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">Đã chọn {formData.docFiles.length} tài liệu</p>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.projectName || !formData.carbonAmount || !formData.location || !formData.vintage || !formData.methodology || !formData.description}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Gửi yêu cầu phê duyệt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Cột thông tin bên phải */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hướng dẫn đăng ký</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Chế độ lưu trữ</p>
                  <p className="text-gray-600">Dữ liệu được lưu trữ an toàn trong cơ sở dữ liệu hệ thống.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Xác minh</p>
                  <p className="text-gray-600">Tất cả dự án phải được thẩm định bởi các tổ chức uy tín.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Truy xuất nguồn gốc</p>
                  <p className="text-gray-600">Theo dõi vị trí và phương pháp thực hiện minh bạch.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Năm thực hiện (Vintage)</p>
                  <p className="text-gray-600">Thời gian dự án bắt đầu cắt giảm hoặc hấp thụ Carbon.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h4 className="font-semibold text-green-900 mb-2">Phí ước tính</h4>
            <p className="text-2xl font-bold text-green-800 mb-1">0 ETH</p>
            <p className="text-sm text-green-700">Miễn phí lưu trữ cơ bản</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestReview;