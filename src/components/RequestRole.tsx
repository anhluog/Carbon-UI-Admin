import React, { useState } from 'react';
import { Leaf, Upload, Calendar, MapPin, Award, Plus, CheckCircle, Users } from 'lucide-react';
import { ethers } from "ethers";
import CarbonCreditToken from '../abi/CarbonCredit.json';
import axios from 'axios';

interface RequestRoleProps {
  walletAddress: string;
}

const RequestRole: React.FC<RequestRoleProps> = ({ walletAddress }) => {
  const [formData, setFormData] = useState({
    receiver: '',
    projectName: '',
    carbonAmount: '',
    location: '',
    methodology: '',
    vintage: '',
    price: '',
    description: '',
    imageFile: null as File | null,
    docFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("🚀 === STARTING ROLE REQUEST ===");
    console.log("📦 Form data submitted:", formData);

    try {
      // Mock submission logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTxHash("0x" + Array(64).join("0")); // Mock transaction hash
      setShowSuccess(true);
      alert("✅ Role request submitted successfully!");

    } catch (err: any) {
      console.error("🔥 ERROR SUBMITTING REQUEST:", err);
      alert(`❌ Error: ${err.message || "Failed to submit role request!"}`);
    } finally {
      console.log("🏁 Finished role request process.\n-------------------------");
      setIsSubmitting(false);
    }
  };

  const methodologies = [
    { value: 'auditor', label: 'Auditor' },
    { value: 'project_developer', label: 'Project Developer' },
    { value: 'registry', label: 'Registry' }
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
            Your role request for <strong>{formData.projectName}</strong> has been submitted. 
            Reference ID: {txHash}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              Role: {formData.methodology}
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
                  Your Wallet Address</label>
                <input
                  type = 'text'
                  name = 'receiver'
                  value ={walletAddress}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 transition-all"
                  >
                </input>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requested Role *
                  </label>
                  <select
                    name="methodology"
                    value={formData.methodology}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  >
                    {methodologies.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Request
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  placeholder="Explain why you need this role and your qualifications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents (e.g., CV, certifications)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, docFile: file });
                  }}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.projectName || !formData.price}
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
                  <p className="font-medium text-gray-900">Auditor</p>
                  <p className="text-gray-600">Can verify and approve projects.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Project Developer</p>
                  <p className="text-gray-600">Can create and submit new projects.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Registry</p>
                  <p className="text-gray-600">Can issue and retire carbon credits.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h4 className="font-semibold text-green-900 mb-2">Review Process</h4>
            <p className="text-sm text-green-700">Your request will be reviewed within 3-5 business days. You will be notified of the decision via email.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestRole;
