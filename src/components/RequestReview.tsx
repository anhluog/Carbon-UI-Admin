import React, { useState } from 'react';
import { Leaf, Calendar, MapPin, Award, Plus, CheckCircle } from 'lucide-react';
import { ethers } from "ethers";
import axios from 'axios';
import api from '../utils/axiosInstance';

interface MintTokenProps {
  walletAddress: string;
}

const RequestReview: React.FC<MintTokenProps> = ({ walletAddress }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    vintage: '',
    receiver: '',
    type: '',
    location: '',
    methodology: '',
    description: '',
    carbonAmount: '',
    imageFile: null as File | null,
    docFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [metadataHash, setMetadataHash] = useState<string | null>(null);  // Thêm state cho metadataHash để dùng trong success UI

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageFile' | 'docFile') => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("🚀 === BẮT ĐẦU LUU BACKEND ===");
    console.log("📦 Dữ liệu form gửi đi:", formData);
    console.log("🌍 Backend URL: http://localhost:8080/api/projects/save");

    try {
      if (!(window as any).ethereum) throw new Error("❌ MetaMask not detected!");
      console.log("🦊 MetaMask phát hiện thành công.");

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("👤 Địa chỉ ví signer:", signerAddress);

      // === Upload ảnh ===
      let imageUrl = "";
      if (formData.imageFile) {
        console.log("📤 Bắt đầu upload ảnh lên IPFS...");
        const imgForm = new FormData();
        imgForm.append("file", formData.imageFile);

        try {
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
          imageUrl = `https://gateway.pinata.cloud/ipfs/${imgRes.data.IpfsHash}`;
          console.log("✅ Ảnh đã upload thành công:", imageUrl);
        } catch (ipfsErr) {
          console.error("❌ Lỗi upload ảnh:", ipfsErr);
          throw new Error("Không thể upload ảnh lên IPFS!");
        }
      } else {
        console.warn("⚠️ Không có file ảnh để upload.");
      }

      // === Upload tài liệu ===
      let docUrl = "";
      if (formData.docFile) {
        console.log("📤 Bắt đầu upload tài liệu lên IPFS...");
        const docForm = new FormData();
        docForm.append("file", formData.docFile);
        try {
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
          docUrl = `https://gateway.pinata.cloud/ipfs/${docRes.data.IpfsHash}`;
          console.log("✅ Tài liệu đã upload thành công:", docUrl);
        } catch (ipfsErr) {
          console.error("❌ Lỗi upload tài liệu:", ipfsErr);
          throw new Error("Không thể upload tài liệu lên IPFS!");
        }
      } else {
        console.warn("⚠️ Không có file tài liệu để upload.");
      }

      // === Upload metadata ===
      const metadata = {
        projectName: formData.projectName,
        vintage: formData.vintage,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        methodology: formData.methodology,
        receiver: formData.receiver,
        image: imageUrl,
        document: docUrl,
        timestamp: new Date().toISOString(),
      };

      console.log("🧩 Metadata chuẩn bị upload:", metadata);

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
      setMetadataHash(metadataHash);  // Set state để dùng trong success UI
      console.log("✅ Metadata đã upload:", metadataHash);

      // === Lưu dữ liệu vào backend (MAP ĐỂ KHỚP DB SCHEMA THỰC TẾ) ===
      const projectData = {
        // Map keys để khớp columns DB (camelCase, Jackson tự map)
        name: formData.projectName,  // name (varchar(255), not null)
        vintage: parseInt(formData.vintage || '0'),  // vintage (int(11), not null)
        ownerId: formData.receiver,  // owner_id (varchar(255), not null)
        type: formData.type || 'OTHERS',  // type (varchar(255), not null)
        location: formData.location,  // location (varchar(255), not null)
        description: formData.description,  // des (text, not null)
        ipfsHash: metadataHash,  // ipfs_hash (varchar(255), not null)
        verifiedBy: null,  // verified_by (varchar(255), nullable, default NULL)
        approvedBy: null,  // approved_by (varchar(255), nullable, default NULL)
        credits: 0,  // credits (int(11), not null) - default 0 (minted credits ban đầu)
        status: 'SUBMITTED',  // status (varchar(255), not null) - từ constants
        expectedCredits: parseInt(formData.carbonAmount || '0'),  // expected_credits (int(11), not null)
        // Backend auto-set: id (varchar(255), not null), created_at (datetime, not null), updated_at (datetime, not null)
      };
      console.log("💾 Gửi dữ liệu lưu DB (mapped theo schema):", projectData.description);
      console.log("💾 Gửi dữ liệu lưu DB (mapped theo schema):", projectData);

      

      const response = await api.post("projects/save", projectData);
      console.log("✅ Dữ liệu đã lưu vào backend thành công:", response.data);

      setShowSuccess(true);
      setTxHash("N/A (Off-chain mode)");  // Tạm thời, vì không on-chain
      alert("✅ Saved to backend successfully! (Off-chain mode)");

    } catch (err: any) {
      console.error("🔥 LỖI KHI LUU BACKEND:", err);
      if (err.response?.data) console.error("⚠️ Backend error:", err.response.data);
      if (err.message) console.error("📜 Error message:", err.message);
      alert(`❌ Error: ${err.response?.data?.message || err.message || "Gặp lỗi khi lưu backend!"}`);
    } finally {
      console.log("🏁 Kết thúc quá trình lưu.\n-------------------------");
      setIsSubmitting(false);
    }
  };

  const methodologies = [
    { value: 'VCS', label: 'Verified Carbon Standard (VCS)' },
    { value: 'CDM', label: 'Clean Development Mechanism (CDM)' },
    { value: 'GS', label: 'Gold Standard (GS)' },
    { value: 'CAR', label: 'Climate Action Reserve (CAR)' }
  ];

  const typeOptions = [
    { value: 'FOREST_AND_GREENRY', label: 'Forest and Greenery' },
    { value: 'RENEWABLE_ENERGY', label: 'Renewable Energy' },
    { value: 'CARBON_REMOVE', label: 'Carbon Removal' },
    { value: 'OTHERS', label: 'Others' }
  ];

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Saved Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your project data has been saved to backend. 
            IPFS Hash: {metadataHash || 'N/A'}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              {formData.carbonAmount} CCT expected for {formData.projectName}
            </p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="mt-6 bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-all"
          >
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Project Carbon Credit</h2>
        <p className="text-gray-600">Create new carbon credit tokens from verified environmental projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mint Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 space-y-6">
            {/* Address Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Organization *
              </label>
              <input
                type="text"
                name="receiver"
                value={formData.receiver}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="0xYourWalletAddress..."
                required
              />
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="e.g., Amazon Rainforest Conservation"
                required
              />
            </div>

            {/* Carbon Amount & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carbon Amount (tCO₂) *
                </label>
                <input
                  type="number"
                  name="carbonAmount"
                  value={formData.carbonAmount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="100"
                  min="1"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Brazil, Amazon"
                  required
                />
              </div>
            </div>

            {/* Methodology & Vintage Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Methodology *
                </label>
                <select
                  name="methodology"
                  value={formData.methodology}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                >
                  <option value="">Select Methodology</option>
                  {methodologies.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vintage Year *
                </label>
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

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                required
              >
                <option value="">Select Type</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                placeholder="Describe the environmental impact and project details..."
                required  // Thêm required
                minLength={10}  // Optional: Ít nhất 10 ký tự
              />
            </div>

            {/* Project Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'imageFile')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {formData.imageFile && <p className="text-sm text-gray-600 mt-1">Selected: {formData.imageFile.name}</p>}
            </div>

            {/* Verification Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Documents (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange(e, 'docFile')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {formData.docFile && <p className="text-sm text-gray-600 mt-1">Selected: {formData.docFile.name}</p>}
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !formData.projectName || !formData.carbonAmount || !formData.receiver || !formData.location || !formData.vintage || !formData.description}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Save Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Saving Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Backend Mode</p>
                  <p className="text-gray-600">Saving off-chain to database</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Verification</p>
                  <p className="text-gray-600">All projects must be verified by recognized standards</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Traceability</p>
                  <p className="text-gray-600">Full project location and methodology tracking</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Vintage</p>
                  <p className="text-gray-600">Year of carbon reduction or removal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h4 className="font-semibold text-green-900 mb-2">Estimated Cost</h4>
            <p className="text-2xl font-bold text-green-800 mb-1">0 ETH</p>
            <p className="text-sm text-green-700">≈ $0 USD (Off-chain)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestReview;