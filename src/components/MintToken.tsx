import React, { useState } from 'react';
import { Leaf, Upload, Calendar, MapPin, Award, Plus, CheckCircle } from 'lucide-react';
import { ethers } from "ethers";
import CarbonCreditToken from '../abi/CarbonCredit.json';
import axios from 'axios';

interface MintTokenProps {
  walletAddress: string;
}

const MintToken: React.FC<MintTokenProps> = ({ walletAddress }) => {
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

    console.log("🚀 === BẮT ĐẦU MINT CARBON CREDIT ===");
    console.log("📦 Dữ liệu form gửi đi:", formData);
    console.log("🌍 Contract address:", import.meta.env.VITE_CARBONCREDIT_ADDRESS);

    try {
      if (!(window as any).ethereum) throw new Error("❌ MetaMask not detected!");
      console.log("🦊 MetaMask phát hiện thành công.");

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("👤 Địa chỉ ví signer:", signerAddress);

      const contract = new ethers.Contract(
        import.meta.env.VITE_CARBONCREDIT_ADDRESS!,
        CarbonCreditToken.abi,
        signer
      );
      console.log("✅ Khởi tạo contract thành công:", contract.target);

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
        description: formData.description,
        location: formData.location,
        methodology: formData.methodology,
        vintage: formData.vintage,
        price: formData.price,
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
      console.log("✅ Metadata đã upload:", metadataHash);

      // === Gọi contract issueCredit ===
      console.log("📡 Gọi hàm issueCredit trên contract...");
      console.log("➡️ Receiver:", formData.receiver);
      console.log("➡️ ProjectName:", formData.projectName);
      console.log("➡️ MetadataHash:", metadataHash);
      console.log("➡️ CarbonAmount:", formData.carbonAmount);
      const owner = await contract.owner();
      console.log("👑 Owner của contract là:", owner);
      console.log("👤 Ví đang kết nối (signer):", signer.address);


      const tx = await contract.issueCredit(
        formData.receiver,
        formData.projectName.trim(),
        metadataHash,
        ethers.parseUnits(formData.carbonAmount, 18)
      );




      console.log("📤 Gửi transaction thành công, hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction đã xác nhận:", receipt);

      // // === Lưu dữ liệu vào backend ===
      // const projectData = {
      //   ...metadata,
      //   amountMinted: Number(formData.carbonAmount),
      //   txHash: receipt.hash,
      //   ipfsHash: metadataHash,
      //   status: "Active",
      // };
      // console.log("💾 Gửi dữ liệu lưu DB:", projectData);

      // await axios.post("http://localhost:8080/api/projects/save", projectData);
      // console.log("✅ Dữ liệu đã lưu vào backend thành công.");

      setTxHash(receipt.hash);
      setShowSuccess(true);
      alert("✅ Mint & Upload successful!");

    } catch (err: any) {
      console.error("🔥 LỖI KHI MINT:", err);
      if (err?.reason) console.error("⚠️ Lý do từ contract:", err.reason);
      if (err?.error) console.error("⚙️ err.error:", err.error);
      if (err?.data) console.error("📜 err.data:", err.data);
      if (err?.stack) console.error("🧠 Stack trace:", err.stack);

      alert(`❌ Error: ${err.message || "Gặp lỗi khi Request Review!"}`);
    } finally {
      console.log("🏁 Kết thúc quá trình mint.\n-------------------------");
      setIsSubmitting(false);
    }
  };






  const methodologies = [
    { value: 'VCS', label: 'Verified Carbon Standard (VCS)' },
    { value: 'CDM', label: 'Clean Development Mechanism (CDM)' },
    { value: 'GS', label: 'Gold Standard (GS)' },
    { value: 'CAR', label: 'Climate Action Reserve (CAR)' }
  ];

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tokens Minted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your carbon credit tokens have been minted and added to your wallet. 
            Transaction hash: {txHash}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              {formData.carbonAmount} CCT minted for {formData.projectName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Project Carbon Credit</h2>
        <p className="text-gray-600">Create new carbon credit tokens from verified environmental projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mint Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Organization</label>
                <input
                  type = 'text'
                  name = 'receiver'
                  value ={formData.receiver}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Address ...."
                  required
                  >
                </input>
              </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Price (USD per NVQ)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="2.50"
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  placeholder="Describe the environmental impact and project details..."
                />
              </div>

              {/* Certificate Upload */}
              {/* Upload ảnh đại diện dự án */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, imageFile: file });
                  }}
                />

              </div>

              {/* Upload file xác minh (PDF, Word, v.v.) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Documents
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
                disabled={isSubmitting || !formData.projectName || !formData.carbonAmount}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Minting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Request Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Minting Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Token Standard</p>
                  <p className="text-gray-600">ERC-20 compatible carbon credits</p>
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
            <h4 className="font-semibold text-green-900 mb-2">Estimated Gas Fee</h4>
            <p className="text-2xl font-bold text-green-800 mb-1">0.0045 ETH</p>
            <p className="text-sm text-green-700">≈ $8.50 USD</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintToken;