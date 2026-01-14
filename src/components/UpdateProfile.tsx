import React, { useState, useEffect } from 'react';
import { User, Save, X, CheckCircle, Edit3 } from 'lucide-react';
import api from '../utils/axiosInstance';  // Import axios instance từ utils

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user data từ API khi component mount (sử dụng axios)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Giả sử endpoint GET /profile để lấy user data (thêm vào backend nếu chưa có)
        // Có thể pass walletAddress nếu backend cần: api.get(`/profile/${walletAddress}`)
        const response = await api.get('user/profile');  // Hoặc '/users/me' tùy backend
        if (response.data) {
          setUser(response.data);  // Giả sử response.data là UserDTO
        } else {
          setError('Failed to load profile');
        }
      } catch (err: unknown) {
        // Axios interceptor đã handle lỗi, nhưng catch để set UI error nếu cần
        setError('Error loading profile');
        console.error('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
    setError('');  // Clear error on change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.name.trim() || !user.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Gửi PUT /updateProfile với UserDTO (axios tự add token qua interceptor)
      const response = await api.put('user/updateProfile', {
        name: user.name,
        email: user.email,
      });  // Không gửi id/roleId, backend dùng principal.getName()

      if (response.data) {
        setUser(response.data);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
      } else {
        setError('Failed to update profile');
      }
    } catch (err: unknown) {
      // Axios interceptor đã handle lỗi (alert nếu 400/500), nhưng catch để set UI nếu cần
      setError('Error updating profile');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data nếu cần (ở đây đơn giản reset editing)
    // Để full reset, lưu originalUser state riêng và setUser(originalUser)
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (loading && user.id === '') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Update Profile</h1>
              <p className="text-sm text-gray-600">Manage your personal information</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={user.id || walletAddress}  // Fallback to walletAddress nếu API không trả id
              readOnly
              className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={user.name}
              onChange={handleInputChange}
              required={isEditing}
              disabled={!isEditing}
              className={`w-full p-3 border rounded-xl transition-colors ${
                isEditing
                  ? 'border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleInputChange}
              required={isEditing}
              disabled={!isEditing}
              className={`w-full p-3 border rounded-xl transition-colors ${
                isEditing
                  ? 'border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            />
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={user.roleId}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
            />
          </div>

          {/* Document Hash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Hash (Optional)</label>
            <textarea
              name="documentHash"
              value={user.documentHash}
              onChange={handleInputChange}
              rows={3}
              disabled={!isEditing}
              placeholder="Enter document hash (e.g., IPFS CID or SHA-256)"
              className={`w-full p-3 border rounded-xl transition-colors resize-none ${
                isEditing
                  ? 'border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {/* Actions */}
          {isEditing ? (
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default Profile;