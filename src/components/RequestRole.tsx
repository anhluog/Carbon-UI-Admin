import React, { useState } from 'react';
import { Users, CheckCircle, Award, Upload, FileText, X } from 'lucide-react';
import api from '../utils/axiosInstance';
import axios from 'axios';
import { showSuccess, showError, showInfo } from '../utils/toast';

interface RequestRoleProps {
  walletAddress: string;
}

const RequestRole: React.FC<RequestRoleProps> = ({ walletAddress }) => {
  const [selectedRole, setSelectedRole] = useState<string>('OWNER');
  const [formData, setFormData] = useState({ reason: '' });
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessUI, setShowSuccessUI] = useState(false);

  /* ===================== UPLOAD IPFS ===================== */
  const uploadToIPFS = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    showInfo(`Đang tải lên ${files.length} tài liệu lên IPFS...`);

    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const res = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
              headers: {
                pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
                pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
              },
            }
          );

          return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
        })
      );

      showSuccess('Tải tài liệu lên IPFS thành công');
      return urls;
    } catch (err) {
      showError('Lỗi khi tải tài liệu lên IPFS');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  /* ===================== UPDATE PROFILE ===================== */
  const updateUserProfileWithUrls = async (urls: string[]) => {
    try {
      await api.put('/user/updateProfile', { documentUrls: urls });
      showSuccess('Đã cập nhật hồ sơ người dùng');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Cập nhật hồ sơ thất bại');
    }
  };

  /* ===================== FILE HANDLING ===================== */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setLicenseFiles(files);

    try {
      const urls = await uploadToIPFS(files);
      setUploadedDocUrls(urls);
      await updateUserProfileWithUrls(urls);
    } catch {
      /* lỗi đã toast */
    }
  };

  const removeFile = (index: number) => {
    setLicenseFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedDocUrls((prev) => prev.filter((_, i) => i !== index));
    showInfo('Đã xóa file khỏi danh sách');
  };

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      showError('Vui lòng nhập lý do yêu cầu');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/role-request/request', {
        requestedRole: 'OWNER',
        reason: formData.reason,
      });

      showSuccess('Gửi yêu cầu cấp quyền thành công');
      setShowSuccessUI(true);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Lỗi khi gửi yêu cầu');
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
      <p className="text-gray-600 mb-6">
        Gửi hồ sơ để được cấp quyền quản lý dự án và tín chỉ carbon.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 border shadow-sm space-y-6"
      >
        {/* Wallet */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Địa chỉ ví
          </label>
          <input
            value={walletAddress}
            readOnly
            className="w-full mt-2 px-4 py-3 rounded-xl border bg-gray-50 text-sm"
          />
        </div>

        {/* Role (fixed OWNER) */}
        <div className="border-2 border-green-500 bg-green-50 rounded-xl p-4">
          <Award className="h-6 w-6 text-green-600 mb-2" />
          <p className="font-bold">OWNER</p>
          <p className="text-xs text-gray-600">
            Toàn quyền quản lý dự án và tín chỉ carbon
          </p>
        </div>

        {/* Upload */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Tài liệu hỗ trợ (nếu có)
          </label>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100">
            <Upload className={`h-6 w-6 mb-2 ${uploading ? 'animate-bounce text-blue-500' : 'text-gray-500'}`} />
            <span className="text-sm text-gray-500">
              {uploading ? 'Đang tải...' : 'Nhấp để tải lên hoặc kéo thả'}
            </span>
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>

          {licenseFiles.map((file, i) => (
            <div key={i} className="flex justify-between items-center mt-2 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <button type="button" onClick={() => removeFile(i)}>
                <X className="h-5 w-5 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        {/* Reason */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Lý do yêu cầu *
          </label>
          <textarea
            rows={4}
            required
            value={formData.reason}
            onChange={(e) => setFormData({ reason: e.target.value })}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500"
            placeholder="Mô tả lý do và kinh nghiệm của bạn..."
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Users className="h-5 w-5 mr-2" />
              Gửi yêu cầu
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RequestRole;
