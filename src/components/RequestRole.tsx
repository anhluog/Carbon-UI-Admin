import React, { useState } from 'react';
import { Users, CheckCircle, Award, Shield, Building2 } from 'lucide-react';
import api from '../utils/axiosInstance';  // Import axios instance (với token interceptor)

interface RequestRoleProps {
  walletAddress: string;
}

const RequestRole: React.FC<RequestRoleProps> = ({ walletAddress }) => {
  const [formData, setFormData] = useState({
    requestedRole: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');  // Clear error on change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestedRole || !formData.reason.trim()) {
      setError('Role and reason are required');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/role-request/request', {
        requestedRole: formData.requestedRole,
        reason: formData.reason
      });

      console.log('Response from role request:', response);

      if (response.data) {
        setShowSuccess(true);
        console.log('✅ Role request submitted:', response.data);
      } else {
        setError('Failed to submit request');
      }
    } catch (err: unknown) {
      // Interceptor đã handle alert cho 400/500, nhưng set UI error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Error submitting request');
      } else {
        setError('Error submitting request');
      }
      console.error('❌ Request role error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'VERIFIER', label: 'Verifier' },
    { value: 'GOVERNMENT', label: 'Government' },
    { value: 'ADMIN', label: 'Admin' },

  ];

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
              Requested Role: {roles.find(r => r.value === formData.requestedRole)?.label}
            </p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Role *
                </label>
                <select
                  name="requestedRole"
                  value={formData.requestedRole}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.requestedRole || !formData.reason}
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
              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Owner</p>
                  <p className="text-gray-600">Full access to manage projects and credits.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Verifier</p>
                  <p className="text-gray-600">Can verify and approve carbon projects.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Government</p>
                  <p className="text-gray-600">Regulatory oversight and compliance checks.</p>
                </div>
              </div>
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