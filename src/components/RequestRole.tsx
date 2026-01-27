import React, { useState } from 'react';
import { Users, CheckCircle, Award, Upload, FileText, X } from 'lucide-react';
import api from '../utils/axiosInstance';
import axios from 'axios';
import { showSuccess, showError, showInfo } from '../utils/toast';

interface RequestRoleProps {
  walletAddress: string;
}

const RequestRole: React.FC<RequestRoleProps> = ({ walletAddress }) => {
  const [formData, setFormData] = useState({ reason: '' });
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  
  // Thay đổi: Lưu cả mã CID để gửi cho Backend
  const [uploadedCids, setUploadedCids] = useState<string[]>([]); 
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessUI, setShowSuccessUI] = useState(false);

  /* ===================== UPLOAD IPFS ===================== */
  const uploadToIPFS = async (files: File[]) => {
    setUploading(true);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const data = new FormData();
          data.append('file', file);

          const res = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            data,
            {
              headers: {
                pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
                pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
              },
            }
          );
          // Trả về cả Hash và URL
          return {
            cid: res.data.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`
          };
        })
      );

      const cids = results.map(r => r.cid);
      const urls = results.map(r => r.url);

      setUploadedCids(cids);
      setUploadedDocUrls(urls);
      
      showSuccess('Tải tài liệu lên IPFS thành công');
      return { cids, urls };
    } catch (err) {
      showError('Lỗi khi tải tài liệu lên IPFS');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  /* ===================== UPDATE PROFILE (Optional) ===================== */
  const updateUserProfileWithUrls = async (urls: string[]) => {
    try {
      await api.put('/user/updateProfile', { documentUrls: urls });
    } catch (err: any) {
      console.error('Cập nhật profile thất bại', err);
    }
  };

  /* ===================== FILE HANDLING ===================== */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setLicenseFiles(files);

    try {
      const { urls } = await uploadToIPFS(files);
      // Cập nhật profile người dùng bằng các URL để họ xem được ảnh
      await updateUserProfileWithUrls(urls);
    } catch { /* lỗi đã toast */ }
  };

  const removeFile = (index: number) => {
    setLicenseFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedDocUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadedCids((prev) => prev.filter((_, i) => i !== index));
  };

  /* ===================== SUBMIT (GỬI CID CHO BACKEND) ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      showError('Vui lòng nhập lý do yêu cầu');
      return;
    }

    setIsSubmitting(true);
    try {
      // Vì RoleRequestDTO.documentHash là String, 
      // nếu có nhiều file ta có thể nối chuỗi bằng dấu phẩy hoặc lấy cái đầu tiên
      const docHash = uploadedCids.length > 0 ? uploadedCids.join(',') : null;

      await api.post('/role-request/request', {
        requestedRole: 'OWNER',
        reason: formData.reason,
        documentHash: docHash, // Khớp với trường documentHash trong DTO của bạn
        verifierRoleId: null   // Điền nếu cần thiết
      });

      showSuccess('Gửi yêu cầu cấp quyền thành công');
      setShowSuccessUI(true);
    } catch (err: any) {
      console.error('Request Role Error:', err);
      console.error('Error Response:', err.response?.data);
      console.error('Error Status:', err.response?.status);

      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = err.response?.data?.message
        || err.response?.data?.error
        || err.response?.data?.detail
        || err.message
        || 'Lỗi khi gửi yêu cầu';

      const statusCode = err.response?.status;
      if (statusCode === 400) {
        showError(`Yêu cầu không hợp lệ: ${errorMessage}`);
      } else if (statusCode === 401) {
        showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (statusCode === 403) {
        showError('Bạn không có quyền thực hiện hành động này.');
      } else if (statusCode === 409) {
        showError(`Xung đột: ${errorMessage}`);
      } else if (statusCode === 500) {
        showError(`Lỗi máy chủ: ${errorMessage}`);
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===================== SUCCESS UI ===================== */
  if (showSuccessUI) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-8 border border-green-200 text-center shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Gửi yêu cầu thành công!</h2>
          <p className="text-gray-600 mb-6">
            Yêu cầu của bạn đang chờ quản trị viên xét duyệt.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <p className="font-medium text-green-800">Quyền yêu cầu: OWNER</p>
            {uploadedDocUrls.length > 0 && (
              <p className="text-sm text-green-700 mt-2">
                Số tài liệu đính kèm: {uploadedDocUrls.length}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ===================== MAIN UI ===================== */
 return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-2">Yêu cầu quyền Owner</h2>
      <p className="text-gray-600 mb-6">Gửi hồ sơ để được cấp quyền quản lý dự án và tín chỉ carbon.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border shadow-sm space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Địa chỉ ví</label>
          <input value={walletAddress} readOnly className="w-full mt-2 px-4 py-3 rounded-xl border bg-gray-50 text-sm" />
        </div>

        <div className="border-2 border-green-500 bg-green-50 rounded-xl p-4">
          <Award className="h-6 w-6 text-green-600 mb-2" />
          <p className="font-bold">OWNER</p>
          <p className="text-xs text-gray-600">Toàn quyền quản lý dự án và tín chỉ carbon</p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Tài liệu hỗ trợ (Bắt buộc để xét duyệt)</label>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
            <Upload className={`h-6 w-6 mb-2 ${uploading ? 'animate-bounce text-blue-500' : 'text-gray-500'}`} />
            <span className="text-sm text-gray-500">{uploading ? 'Đang xử lý...' : 'Tải lên hồ sơ năng lực/giấy phép'}</span>
            <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={uploading || isSubmitting} />
          </label>

          {licenseFiles.map((file, i) => (
            <div key={i} className="flex justify-between items-center mt-2 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <button type="button" onClick={() => removeFile(i)} disabled={isSubmitting}>
                <X className="h-5 w-5 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Lý do yêu cầu *</label>
          <textarea rows={4} required value={formData.reason} onChange={(e) => setFormData({ reason: e.target.value })}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500"
            placeholder="Mô tả năng lực và dự án bạn dự định thực hiện..."
          />
        </div>

        <button type="submit" disabled={isSubmitting || uploading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center"
        >
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
            <>
              <Users className="h-5 w-5 mr-2" />
              Gửi yêu cầu xét duyệt
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RequestRole;
