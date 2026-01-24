import React, { useState, useEffect } from 'react';
import { 
  User, Save, X, Edit3, Mail, Shield, Hash, Wallet, Loader2, CheckCircle2
} from 'lucide-react';
import api from '../utils/axiosInstance';
import {
  showSuccess,
  showError,
  showWarning,
  showInfo
} from "../utils/toast";

interface ProfileProps {
  walletAddress: string;
  setActiveTab: (tab: string) => void;
}

function Profile({ walletAddress }: ProfileProps) {
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    roleId: '',
    documentHash: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true); // Mặc định true để load lần đầu
  const [submitting, setSubmitting] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('user/profile');
        if (response.data) {
          setUser(response.data);
        } else {
          // Fallback data if needed or just error
          // setUser(prev => ({ ...prev, id: walletAddress })); 
        }
      } catch (err) {
        // Silent error or show toast depend on UX
        console.error('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [walletAddress]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
    // ĐÃ XÓA: showWarning ở đây vì nó sẽ spam mỗi khi gõ phím
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.name.trim() || !user.email.trim()) {
      showWarning("Vui lòng nhập đầy đủ tên và email");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put('user/updateProfile', {
        name: user.name,
        email: user.email,
        documentHash: user.documentHash // Gửi thêm nếu API hỗ trợ
      });

      if (response.data) {
        setUser(response.data);
        setIsEditing(false);
        showSuccess("Cập nhật hồ sơ thành công!");
      }
    } catch (err: any) {
      showError("Cập nhật hồ sơ thất bại");
      console.error('Update profile error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    showInfo("Đã hủy chỉnh sửa");
    // Nên refetch lại dữ liệu gốc nếu muốn reset hoàn toàn các thay đổi chưa lưu
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
          <p className="text-gray-500 font-medium">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          
          {/* Header Banner */}
          <div className="h-40 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute bottom-4 right-6 text-white/80 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Account Active
            </div>
          </div>

          {/* Profile Section */}
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-16 mb-8">
              <div className="flex items-end">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <User className="h-16 w-16" />
                    </div>
                  </div>
                  {/* Role Badge */}
                  <div className="absolute bottom-1 right-1 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-sm">
                    {user.roleId || 'User'}
                  </div>
                </div>
                
                <div className="ml-6 mb-2 hidden sm:block">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name || 'Unnamed User'}</h1>
                  <p className="text-gray-500 flex items-center gap-1 mt-1">
                    <Wallet className="h-3 w-3" />
                    {user.id || walletAddress}
                  </p>
                </div>
              </div>

              {/* Edit Toggle Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mb-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm border border-emerald-100"
                >
                  <Edit3 className="h-4 w-4" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            {/* Mobile Name View */}
            <div className="sm:hidden mb-8 text-center">
               <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Unnamed User'}</h1>
               <p className="text-gray-500 text-sm truncate px-4 mt-1">{user.id || walletAddress}</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-500" />
                      Thông tin cá nhân
                    </h3>
                    
                    <div className="space-y-5">
                      {/* Name Input */}
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Họ và tên</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={user.name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className={`block w-full pl-10 pr-3 py-3 rounded-xl border-2 transition-all duration-200 outline-none ${
                              isEditing 
                                ? 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-white' 
                                : 'border-transparent bg-gray-50 text-gray-700'
                            }`}
                            placeholder="Nhập tên của bạn"
                          />
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Địa chỉ Email</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={user.email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className={`block w-full pl-10 pr-3 py-3 rounded-xl border-2 transition-all duration-200 outline-none ${
                              isEditing 
                                ? 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-white' 
                                : 'border-transparent bg-gray-50 text-gray-700'
                            }`}
                            placeholder="example@domain.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                   <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-emerald-500" />
                      Bảo mật & Dữ liệu
                    </h3>

                    <div className="space-y-5">
                      {/* User ID / Wallet (Read Only) */}
                      <div className="group">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Wallet ID</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Wallet className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={user.id || walletAddress}
                            readOnly
                            className="block w-full pl-10 pr-3 py-3 rounded-xl border-2 border-transparent bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-end">
                   <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="h-5 w-5" />
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 focus:ring-4 focus:ring-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;