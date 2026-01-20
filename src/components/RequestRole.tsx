import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Award, Shield, Upload, FileText, X } from 'lucide-react';
import api from '../utils/axiosInstance';
import axios from 'axios';
import { showSuccess, showError, showInfo } from '../utils/toast'; // Import các hàm toast

interface RequestRoleProps {
  walletAddress: string;
}

interface VerifierRole {
  id: string;
  organizationName: string;
  description?: string;
}

const RequestRole: React.FC<RequestRoleProps> = ({ walletAddress }) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [formData, setFormData] = useState({ reason: '' });
  const [verifierRoles, setVerifierRoles] = useState<VerifierRole[]>([]);
  const [selectedVerifierRoleId, setSelectedVerifierRoleId] = useState<string>('');
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessUI, setShowSuccessUI] = useState(false);

  // Fetch verifier roles
  useEffect(() => {
    const fetchVerifierRoles = async () => {
      try {
        const response = await api.get('/verifier-role/all');
        setVerifierRoles(response.data || []);
      } catch (err: any) {
        showError('Không thể tải danh sách tổ chức xác minh');
      }
    };
    if (selectedRole === 'VERIFIER') {
      fetchVerifierRoles();
    }
  }, [selectedRole]);

  // Upload to IPFS
  const uploadToIPFS = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    showInfo(`Đang tải lên ${files.length} tài liệu lên IPFS...`);
    
    try {
      const docUrls = await Promise.all(
        files.map(async (file) => {
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
      showSuccess("Tải tài liệu lên IPFS thành công!");
      return docUrls;
    } catch (err) {
      showError("Lỗi khi tải tài liệu lên IPFS");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const updateUserProfileWithUrls = async (docUrls: string[]) => {
    try {
      await api.put('user/updateProfile', { documentUrls: docUrls });
      showSuccess('Đã cập nhật hồ sơ với tài liệu mới');
      return true;
    } catch (err: any) {
      showError(`Cập nhật hồ sơ thất bại: ${err.response?.data?.message || err.message}`);
      return false;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setLicenseFiles(newFiles);

      try {
        const urls = await uploadToIPFS(newFiles);
        setUploadedDocUrls(urls);
        await updateUserProfileWithUrls(urls);
      } catch (err) {
        // Lỗi đã được xử lý bằng toast trong uploadToIPFS
      }
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = licenseFiles.filter((_, i) => i !== index);
    const updatedUrls = uploadedDocUrls.filter((_, i) => i !== index);
    setLicenseFiles(updatedFiles);
    setUploadedDocUrls(updatedUrls);
    showInfo("Đã xóa file khỏi danh sách tạm thời");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedRole || !formData.reason.trim()) {
      showError('Vui lòng chọn quyền và nhập lý do');
      return;
    }
    if (selectedRole === 'VERIFIER' && !selectedVerifierRoleId) {
      showError('Vui lòng chọn tổ chức xác minh');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        requestedRole: selectedRole,
        reason: formData.reason,
      };

      if (selectedRole === 'VERIFIER') {
        submitData.verifierRoleId = selectedVerifierRoleId;
      }

      await api.post('/role-request/request', submitData);
      showSuccess('Yêu cầu cấp quyền đã được gửi đi thành công!');
      setShowSuccessUI(true);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'OWNER', label: 'Owner', icon: Award, description: 'Toàn quyền quản lý dự án và tín chỉ carbon.' },
    { value: 'VERIFIER', label: 'Verifier', icon: Shield, description: 'Xác minh và phê duyệt các dự án carbon.' },
  ];

  if (showSuccessUI) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 text-center shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gửi yêu cầu thành công!</h2>
          <p className="text-gray-600 mb-6">
            Yêu cầu của bạn đang chờ quản trị viên phê duyệt. Vui lòng kiểm tra email để cập nhật trạng thái.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <p className="text-green-800 font-medium">Quyền yêu cầu: {selectedRole}</p>
            {uploadedDocUrls.length > 0 && (
              <p className="text-green-700 text-sm mt-2">Số lượng tài liệu đính kèm: {uploadedDocUrls.length}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Yêu cầu quyền mới</h2>
        <p className="text-gray-600">Gửi hồ sơ để được cấp quyền tương ứng trên hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
            {/* Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ ví (Chỉ đọc)</label>
              <input type="text" value={walletAddress} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm" />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Chọn loại quyền *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleOptions.map((role) => (
                  <label key={role.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="selectedRole"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="sr-only peer"
                    />
                    <div className="border-2 border-gray-200 rounded-xl p-4 transition-all peer-checked:border-green-500 peer-checked:bg-green-50 hover:bg-gray-50">
                      <role.icon className="h-6 w-6 text-green-600 mb-2" />
                      <div className="font-bold text-gray-900">{role.label}</div>
                      <div className="text-xs text-gray-500">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {selectedRole && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                {selectedRole === 'VERIFIER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tổ chức xác minh *</label>
                    <select
                      value={selectedVerifierRoleId}
                      onChange={(e) => setSelectedVerifierRoleId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    >
                      <option value="">Chọn một tổ chức</option>
                      {verifierRoles.map((role) => (
                        <option key={role.id} value={role.id}>{role.organizationName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedRole === 'VERIFIER' ? 'Chứng chỉ/Giấy phép hành nghề *' : 'Tài liệu hỗ trợ (Nếu có)'}
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className={`h-6 w-6 mb-2 ${uploading ? 'animate-bounce text-blue-500' : 'text-gray-500'}`} />
                        <p className="text-sm text-gray-500">
                          {uploading ? 'Đang xử lý...' : 'Nhấp để tải lên hoặc kéo thả'}
                        </p>
                      </div>
                      <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={uploading} />
                    </label>
                  </div>

                  {licenseFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {licenseFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            {uploadedDocUrls[index] && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã lên IPFS</span>}
                          </div>
                          <button type="button" onClick={() => removeFile(index)} className="text-red-400 hover:text-red-600 transition-colors">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lý do yêu cầu *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    placeholder="Mô tả ngắn gọn lý do và kinh nghiệm của bạn..."
                    required
                  />
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || uploading || !selectedRole}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    <span>Gửi yêu cầu ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Thông tin các quyền</h3>
            <div className="space-y-4">
              {roleOptions.map((role) => (
                <div key={role.value} className="flex items-start space-x-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <role.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{role.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h4 className="font-bold text-blue-900 mb-2 text-sm">Quy trình xét duyệt</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              Yêu cầu của bạn sẽ được đội ngũ quản trị hệ thống kiểm tra thông tin và tài liệu đính kèm. Quá trình này thường mất từ 3-5 ngày làm việc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestRole;