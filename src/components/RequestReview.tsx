import React, { useState, useEffect } from 'react';
import { Leaf, Calendar, MapPin, Award, Plus, CheckCircle, Loader2 } from 'lucide-react';
import { ethers } from "ethers";
import axios from 'axios';
import api from '../utils/axiosInstance';
// Import các hàm toast từ utils
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';

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
  const [showSuccessUI, setShowSuccessUI] = useState(false); // Đổi tên để tránh trùng với hàm showSuccess
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
        showError('Không thể tải danh sách đơn vị thẩm định từ hệ thống.');
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
      if (!(window as any).ethereum) {
        showError("Không tìm thấy MetaMask! Vui lòng cài đặt ví.");
        setIsSubmitting(false);
        return;
      }

      showInfo("Bắt đầu tải tệp tin lên IPFS...");

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

      const metadataHashRes = metaRes.data.IpfsHash;
      setMetadataHash(metadataHashRes);

      showInfo("Đang lưu thông tin dự án vào hệ thống...");

      const projectData = {
        name: formData.projectName,
        vintage: parseInt(formData.vintage || '0'),
        ownerId: walletAddress,
        type: formData.type || 'OTHERS',
        location: formData.location,
        verifierRoleId: formData.methodology,
        description: formData.description,
        ipfsHash: metadataHashRes,
        verifiedBy: null,
        approvedBy: null,
        credits: 0,
        status: 'SUBMITTED',
        expectedCredits: parseInt(formData.carbonAmount || '0'),
      };

      await api.post("projects/save", projectData);
      
      showSuccess("Đăng ký dự án thành công!");
      setShowSuccessUI(true);

    } catch (err: any) {
      console.error("Lỗi:", err);
      const errorMsg = err.response?.data?.message || err.message || "Gặp lỗi khi xử lý hồ sơ!";
      showError(`Lỗi: ${errorMsg}`);
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

  if (showSuccessUI) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gửi hồ sơ thành công!</h2>
          <p className="text-gray-600 mb-6">
            Dữ liệu dự án đã được lưu trữ an toàn. <br />
            Mã định danh IPFS: <span className="font-mono text-sm bg-gray-100 p-1 rounded">{metadataHash || 'N/A'}</span>
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800 font-medium">
              Dự kiến phát hành {formData.carbonAmount} CCT cho dự án "{formData.projectName}"
            </p>
          </div>
          <button
            onClick={() => setShowSuccessUI(false)}
            className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-all font-bold"
          >
            Đăng ký dự án mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Đăng ký dự án Carbon</h2>
        <p className="text-gray-600">Gửi hồ sơ dự án của bạn để được thẩm định và phát hành tín chỉ Carbon (CCT) trên mạng lưới.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tên dự án *</label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none"
                placeholder="Ví dụ: Bảo tồn rừng ngập mặn Cần Giờ"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Lượng tín chỉ dự kiến (tCO₂) *</label>
                <input
                  type="number"
                  name="carbonAmount"
                  value={formData.carbonAmount}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none"
                  placeholder="1000"
                  min="1"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Vị trí dự án *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none"
                  placeholder="TP. Hồ Chí Minh, Việt Nam"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Đơn vị thẩm định *</label>
                <select
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleInputChange}
                  disabled={loadingMethodologies}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none appearance-none disabled:opacity-50"
                  required
                >
                  <option value="">{loadingMethodologies ? 'Đang tải dữ liệu...' : 'Chọn đơn vị thẩm định'}</option>
                  {methodologies.map((method) => (
                    <option key={method.id} value={method.id}>{method.organizationName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Năm thực hiện (Vintage) *</label>
                <input
                  type="number"
                  name="vintage"
                  value={formData.vintage}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none"
                  placeholder="2024"
                  min="2010"
                  max="2030"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Loại hình dự án *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none appearance-none"
                required
              >
                <option value="">Chọn loại hình</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả dự án *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all outline-none resize-none"
                placeholder="Mô tả tác động môi trường và chi tiết kỹ thuật của dự án..."
                required
                minLength={10}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hình ảnh dự án</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'imageFiles')}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {formData.imageFiles.length > 0 && (
                  <p className="text-[10px] text-green-600 mt-1 font-bold">Đã chọn {formData.imageFiles.length} ảnh</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tài liệu pháp lý (PDF, DOCS)</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'docFiles')}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {formData.docFiles.length > 0 && (
                  <p className="text-[10px] text-blue-600 mt-1 font-bold">Đã chọn {formData.docFiles.length} tài liệu</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.projectName || !formData.carbonAmount}
                className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-green-700 shadow-xl shadow-green-100 transition-all disabled:opacity-50 flex items-center space-x-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Nộp hồ sơ phê duyệt</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Hướng dẫn đăng ký</h3>
            <div className="space-y-6 text-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-50 rounded-lg"><Leaf className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="font-bold text-gray-900">Lưu trữ phi tập trung</p>
                  <p className="text-gray-500 text-xs mt-1">Dữ liệu hình ảnh và tài liệu sẽ được lưu trên IPFS (Pinata) để đảm bảo tính minh bạch.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-amber-50 rounded-lg"><Award className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="font-bold text-gray-900">Quy trình thẩm định</p>
                  <p className="text-gray-500 text-xs mt-1">Hồ sơ sẽ qua 2 bước: Thẩm định viên xác nhận và Chính phủ phê duyệt trước khi đúc tín chỉ.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg"><MapPin className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="font-bold text-gray-900">Truy xuất nguồn gốc</p>
                  <p className="text-gray-500 text-xs mt-1">Vị trí và phương pháp thực hiện được ghi lại vĩnh viễn trên Blockchain.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg"><Calendar className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="font-bold text-gray-900">Năm thực hiện (Vintage)</p>
                  <p className="text-gray-500 text-xs mt-1">Năm dự án bắt đầu tạo ra tác động cắt giảm phát thải.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestReview;