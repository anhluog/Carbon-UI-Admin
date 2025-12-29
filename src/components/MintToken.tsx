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
    projectName: '',
    carbonAmount: '',
    location: '',
    methodology: '',
    vintage: '',
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

    console.log("🚀 === STARTING CARBON CREDIT MINTING ===");
    console.log("📦 Form data submitted:", formData);
    console.log("🌍 Contract address:", import.meta.env.VITE_CARBONCREDIT_ADDRESS);

    try {
      if (!(window as any).ethereum) throw new Error("❌ MetaMask not detected!");
      console.log("🦊 MetaMask detected successfully.");

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("👤 Signer wallet address:", signerAddress);

      const contract = new ethers.Contract(
        import.meta.env.VITE_CARBONCREDIT_ADDRESS!,
        CarbonCreditToken.abi,
        signer
      );
      console.log("✅ Contract initialized successfully:", contract.target);

      let imageUrl = "";
      if (formData.imageFile) {
        console.log("📤 Starting image upload to IPFS...");
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
          console.log("✅ Image uploaded successfully:", imageUrl);
        } catch (ipfsErr) {
          console.error("❌ Image upload error:", ipfsErr);
          throw new Error("Failed to upload image to IPFS!");
        }
      } else {
        console.warn("⚠️ No image file to upload.");
      }

      let docUrl = "";
      if (formData.docFile) {
        console.log("📤 Starting document upload to IPFS...");
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
          console.log("✅ Document uploaded successfully:", docUrl);
        } catch (ipfsErr) {
          console.error("❌ Document upload error:", ipfsErr);
          throw new Error("Failed to upload document to IPFS!");
        }
      } else {
        console.warn("⚠️ No document file to upload.");
      }

      const metadata = {
        projectName: formData.projectName,
        description: formData.description,
        location: formData.location,
        methodology: formData.methodology,
        vintage: formData.vintage,
        image: imageUrl,
        document: docUrl,
        timestamp: new Date().toISOString(),
      };

      console.log("🧩 Metadata to upload:", metadata);

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
      console.log("✅ Metadata uploaded:", metadataHash);

      console.log("📡 Calling issueCredit function on contract...");
      console.log("➡️ Receiver:", signerAddress);
      console.log("➡️ ProjectName:", formData.projectName);
      console.log("➡️ MetadataHash:", metadataHash);
      console.log("➡️ CarbonAmount:", formData.carbonAmount);

      const tx = await contract.issueCredit(
        signerAddress,
        formData.projectName.trim(),
        metadataHash,
        ethers.parseUnits(formData.carbonAmount, 18)
      );

      console.log("📤 Transaction sent successfully, hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);

      setTxHash(receipt.hash);
      setShowSuccess(true);
      alert("✅ Mint & Upload successful!");

    } catch (err: any) {
      console.error("🔥 MINTING ERROR:", err);
      if (err?.reason) console.error("⚠️ Contract Reason:", err.reason);
      if (err?.error) console.error("⚙️ err.error:", err.error);
      if (err?.data) console.error("📜 err.data:", err.data);
      if (err?.stack) console.error("🧠 Stack trace:", err.stack);

      alert(`❌ Error: ${err.message || "An error occurred during the request!"}`);
    } finally {
      console.log("🏁 Minting process finished.\n-------------------------");
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
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <div className="space-y-6">
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
                    <option value="" disabled>Select a methodology</option>
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
