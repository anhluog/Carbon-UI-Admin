import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Award, Shield, Building2, Upload, FileText, X } from 'lucide-react';
import api from '../utils/axiosInstance';  // Import axios instance (với token interceptor)
import axios from 'axios';  // Import axios trực tiếp cho Pinata upload

interface RequestRoleProps {
  walletAddress: string;
}

interface VerifierRole {
  id: string;
  organizationName: string;
  description?: string;
  version?: number;
}

const RequestRole: React.FC<RequestRoleProps> = ({ walletAddress }) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [formData, setFormData] = useState({
    reason: ''
  });
  const [verifierRoles, setVerifierRoles] = useState<VerifierRole[]>([]);
  const [selectedVerifierRoleId, setSelectedVerifierRoleId] = useState<string>('');
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);  // Multiple files cho tất cả roles
  const [uploadedDocUrls, setUploadedDocUrls] = useState<string[]>([]);  // Lưu URLs từ IPFS
  const [uploading, setUploading] = useState(false);  // Loading cho upload
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch verifier roles từ API
  useEffect(() => {
    const fetchVerifierRoles = async () => {
      try {
        const response = await api.get('/verifier-role/all');
        setVerifierRoles(response.data || []);
      } catch (err: any) {
        console.error('Error fetching verifier roles:', err);
        setError('Failed to load verifier roles');
      }
    };
    if (selectedRole === 'VERIFIER') {
      fetchVerifierRoles();
    }
  }, [selectedRole]);

  // Function upload multiple files lên IPFS dùng axios + Pinata (theo code bạn cung cấp)
  const uploadToIPFS = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    setError('');
    let docUrls: string[] = [];

    console.log("📤 Bắt đầu upload nhiều tài liệu lên IPFS...");

    try {
      docUrls = await Promise.all(
        files.map(async (file: File) => {
          const docForm = new FormData();
          docForm.append("file", file);

          const docRes = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            docForm,
            {
              headers: {
                pinata_api_key: import.meta.env.VITE_PINATA_API_KEY as string,
                pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY as string,
              },
            }
          );

          return `https://gateway.pinata.cloud/ipfs/${docRes.data.IpfsHash}`;
        })
      );

      console.log("✅ Upload tài liệu thành công:", docUrls);
      return docUrls;
    } catch (err: any) {
      console.error("❌ Lỗi upload tài liệu:", err);
      setError("Không thể upload tài liệu lên IPFS!");
      throw new Error("Không thể upload tài liệu lên IPFS!");
    } finally {
      setUploading(false);
    }
  };

  // Function lưu URLs (hoặc hashes) vào user profile qua API
  const updateUserProfileWithUrls = async (docUrls: string[]) => {
    try {
      const response = await api.post('/user/updateProfile', {
        documentUrls: docUrls  // Hoặc documentHashes nếu backend lưu IpfsHash thay vì URL
        // Có thể chỉnh field name theo backend, ví dụ: { licenses: docUrls }
      });
      console.log('User profile updated with IPFS URLs:', response.data);
      return true;
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setError(`Failed to update profile: ${err.response?.data?.message || err.message}`);
      return false;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');  // Clear error on change
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);  // Convert to array
      setLicenseFiles(newFiles);  // Cập nhật state với multiple files
      setError('');

      // Tự động upload lên IPFS khi chọn files (cho tất cả roles)
      if (newFiles.length > 0) {
        try {
          const docUrls = await uploadToIPFS(newFiles);
          if (docUrls.length > 0) {
            setUploadedDocUrls(docUrls);
            // Lưu ngay vào profile sau khi upload
            const updated = await updateUserProfileWithUrls(docUrls);
            if (updated) {
              console.log('✅ Profile updated with document URLs');
            }
          }
        } catch (err) {
          // Lỗi đã handle trong uploadToIPFS
        }
      }
    }
  };

  // Function xóa file khỏi list
  const removeFile = (index: number) => {
    const updatedFiles = licenseFiles.filter((_, i) => i !== index);
    setLicenseFiles(updatedFiles);
    // Cập nhật URLs tương ứng (xóa index tương ứng)
    const updatedUrls = uploadedDocUrls.filter((_, i) => i !== index);
    setUploadedDocUrls(updatedUrls);
    // Nếu cần, update profile lại (gọi API xóa hoặc unpin từ Pinata)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !formData.reason.trim()) {
      setError('Role and reason are required');
      return;
    }
    if (selectedRole === 'VERIFIER' && !selectedVerifierRoleId) {
      setError('Verifier role is required');
      return;
    }

    // Nếu chưa upload, upload lúc này (nếu không tự động ở handleFileChange)
    if (licenseFiles.length > 0 && uploadedDocUrls.length === 0) {
      try {
        const docUrls = await uploadToIPFS(licenseFiles);
        if (docUrls.length === 0) return;  // Lỗi upload
        setUploadedDocUrls(docUrls);
        const updated = await updateUserProfileWithUrls(docUrls);
        if (!updated) return;  // Lỗi update profile
      } catch (err) {
        return;  // Lỗi đã handle
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitData: any = {
        requestedRole: selectedRole,
        reason: formData.reason
      };

      // Theo sample payload: verifierRoleId (camelCase) cho VERIFIER
      if (selectedRole === 'VERIFIER') {
        submitData.verifierRoleId = selectedVerifierRoleId;
      }

      // Submit role request qua endpoint /api/role-request/request
      const response = await api.post('/role-request/request', submitData);
      console.log('Response from role request:', response);

      if (response.data) {
        setShowSuccess(true);
        console.log('✅ Role request submitted:', response.data);
      } else {
        setError('Failed to submit request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error submitting request');
      console.error('❌ Request role error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'OWNER', label: 'Owner', icon: Award, description: 'Full access to manage projects and credits.' },
    // { value: 'VERIFIER', label: 'Verifier', icon: Shield, description: 'Can verify and approve carbon projects.' },
    // { value: 'GOVERNMENT', label: 'Government', icon: Building2, description: 'Regulatory oversight and compliance checks.' },
    // { value: 'ADMIN', label: 'Admin', icon: Users, description: 'Administrative access to manage users and system settings.' }
  ];

  const getRoleLabel = (role: string) => {
    return roleOptions.find(r => r.value === role)?.label || role;
  };

  // Label động cho upload section dựa trên role
  const getUploadLabel = () => {
    if (selectedRole === 'VERIFIER') {
      return 'Upload License/Certificate(s) * (Multiple files supported)';
    }
    return 'Upload Supporting Documents * (Multiple files supported, optional)';
  };

  // Required cho upload chỉ với VERIFIER
  const isUploadRequired = selectedRole === 'VERIFIER';

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your role request has been submitted. Please check your email for confirmation link.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              Requested Role: {getRoleLabel(selectedRole)}
            </p>
            {selectedRole === 'VERIFIER' && (
              <p className="text-green-800 font-medium mt-2">
                Verifier Role: {verifierRoles.find(r => r.id === selectedVerifierRoleId)?.organizationName}
              </p>
            )}
            {uploadedDocUrls.length > 0 && (
              <p className="text-green-800 text-sm mt-1">
                Uploaded Documents: {uploadedDocUrls.map(url => url.slice(-20)).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Request New Role</h2>
        <p className="text-gray-600">Submit a request to be granted a new role on the platform.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Request Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Wallet Address (Read-only)
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500"
                />
              </div>

              {/* STEP 1: Chọn loại quyền với Radio Cards */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Role Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {roleOptions.map((role) => (
                    <label key={role.value} className="relative">
                      <input
                        type="radio"
                        name="selectedRole"
                        value={role.value}
                        checked={selectedRole === role.value}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="sr-only peer"
                        required
                      />
                      <div className="border-2 border-gray-300 rounded-xl p-4 cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-50 transition-all hover:border-green-400">
                        <role.icon className="h-6 w-6 text-green-600 mb-2" />
                        <div className="font-medium text-gray-900">{role.label}</div>
                        <div className="text-xs text-gray-600">{role.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* STEP 2: Form động theo role */}
              {selectedRole && (
                <>
                  {/* Nếu chọn VERIFIER: Hiển thị select + upload + reason */}
                  {selectedRole === 'VERIFIER' && (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-yellow-800 text-sm font-medium flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Verifier must represent a registered verification organization
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Verifier Role *
                        </label>
                        <select
                          name="verifierRole"
                          value={selectedVerifierRoleId}
                          onChange={(e) => setSelectedVerifierRoleId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          required
                        >
                          <option value="">Select a verifier role</option>
                          {verifierRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.organizationName} {role.description && ` - ${role.description}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Upload section cho VERIFIER */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {getUploadLabel()}
                        </label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="h-6 w-6 text-gray-500 mb-2" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB each)</p>
                            </div>
                            <input
                              type="file"
                              multiple  // Multiple files
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                              required={isUploadRequired}
                            />
                          </label>
                        </div>
                        {/* Hiển thị list files đã chọn và URLs */}
                        {licenseFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                            {licenseFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{file.name}</span>
                                  {uploadedDocUrls[index] && (
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                      IPFS: {new URL(uploadedDocUrls[index]).pathname.slice(1, 9)}...
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {uploading && (
                          <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading to IPFS...</span>
                          </div>
                        )}
                      </div>

                      {/* Reason cho VERIFIER */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Request *
                        </label>
                        <textarea
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                          placeholder="Explain why you need this role and your qualifications..."
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Form cho OWNER, GOVERNMENT, ADMIN: Upload (optional) + reason */}
                  {selectedRole !== 'VERIFIER' && (
                    <>
                      {/* Upload section cho non-VERIFIER (optional) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {getUploadLabel()}
                        </label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="h-6 w-6 text-gray-500 mb-2" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB each)</p>
                            </div>
                            <input
                              type="file"
                              multiple  // Multiple files
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                        {/* Hiển thị list files đã chọn và URLs */}
                        {licenseFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                            {licenseFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{file.name}</span>
                                  {uploadedDocUrls[index] && (
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                      IPFS: {new URL(uploadedDocUrls[index]).pathname.slice(1, 9)}...
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {uploading && (
                          <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading to IPFS...</span>
                          </div>
                        )}
                      </div>

                      {/* Reason cho non-VERIFIER */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Request *
                        </label>
                        <textarea
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                          placeholder="Explain why you need this role and your qualifications..."
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !selectedRole || !formData.reason || (selectedRole === 'VERIFIER' && !selectedVerifierRoleId) || (isUploadRequired && licenseFiles.length === 0) || uploading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    <span>Submit Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Information</h3>
            <div className="space-y-4 text-sm">
              {roleOptions.map((role) => (
                <div key={role.value} className="flex items-start space-x-3">
                  <role.icon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{role.label}</p>
                    <p className="text-gray-600">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h4 className="font-semibold text-green-900 mb-2">Review Process</h4>
            <p className="text-sm text-green-700">Your request will be reviewed within 3-5 business days. You will be notified via email.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestRole;