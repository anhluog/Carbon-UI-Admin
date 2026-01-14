import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../utils/axiosInstance';
import { ethers } from 'ethers';
import CarbonCreditEx from '../abi/CarbonCreditExchange.json';

const MyToken: React.FC = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Amazon Rainforest Conservation',
      amount: '5,240 tCO',
      vintage: 2024,
      retireAmount: '',
      confirmRetire: false,
    },
    {
      id: 2,
      name: 'Solar Energy Farm Thailand',
      amount: '3,120 tCO',
      vintage: 2024,
      retireAmount: '',
      confirmRetire: false,
    },
  ]);

  const [showSummaryPopup, setShowSummaryPopup] = useState(false);

  const handleRetireAmountChange = (id: number, value: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, retireAmount: value } : p));
  };

  const handleConfirmRetireChange = (id: number, checked: boolean) => {
    setProjects(projects.map(p => p.id === id ? { ...p, confirmRetire: checked } : p));
  };

  const handleShowSummary = () => {
    setShowSummaryPopup(true);
  };

  const handleCloseSummary = () => {
    setShowSummaryPopup(false);
  };

  const handleAcceptRetirement = async () => {
  try {
    // 1️⃣ Lấy danh sách token cần retire
    const selected = projects.filter(
      p => p.confirmRetire && Number(p.retireAmount) > 0
    );

    if (selected.length === 0) {
      alert("No tokens selected");
      return;
    }

    // mapping theo smart contract
    const creditTokenIds = selected.map(p => Number(p.id)); // id = creditTokenId
    const amounts = selected.map(p => Number(p.retireAmount));

    // 2️⃣ Connect wallet
    if (!window.ethereum) throw new Error("Metamask not found");

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    // 3️⃣ Gọi smart contract
    const tx = await contract.retireCreditBatch(
      creditTokenIds,
      amounts
    );

    const receipt = await tx.wait();

    // 4️⃣ Parse event lấy certificateId
    let certificateId: string | null = null;

    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed.name === "BatchCertificateRetired") {
          certificateId = parsed.args.certificateId.toString();
        }
      } catch {}
    }

    if (!certificateId) {
      throw new Error("CertificateId not found in tx logs");
    }

    // 5️⃣ Gửi sang backend lưu DB
    await axios.post("/certificates/retire", {
      reason: "User initiated retirement",
      txHash: receipt.hash,
      nftTokenId: certificateId,
      records: selected.map(p => ({
        tokenId: p.id.toString(),
        amount: Number(p.retireAmount)
      }))
    });

    alert("Retirement successful 🎉");
    handleCloseSummary();

  } catch (err: any) {
    console.error(err);
    alert(err.message || "Retirement failed");
  }
};


  const retirementSummary = projects.filter(p => p.confirmRetire && p.retireAmount);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">My Tokens</h3>
        <button onClick={handleShowSummary} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Retired</span>
        </button>
      </div>
      <div className="grid gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Amount: {project.amount}</span>
                  <span>Vintage: {project.vintage}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Number of tokens to retire"
                className="w-full p-2 border rounded"
                value={project.retireAmount}
                onChange={(e) => handleRetireAmountChange(project.id, e.target.value)}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`confirm-retire-${project.id}`}
                  className="mr-2"
                  checked={project.confirmRetire}
                  onChange={(e) => handleConfirmRetireChange(project.id, e.target.checked)}
                />
                <label htmlFor={`confirm-retire-${project.id}`}>Confirm</label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showSummaryPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-4">Retirement Summary</h2>
            <table className="min-w-full divide-y divide-gray-200 mb-4">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retire Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vintage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {retirementSummary.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.retireAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.vintage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end space-x-4">
              <button onClick={handleAcceptRetirement} className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600">
                Accept
              </button>
              <button onClick={handleCloseSummary} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyToken;
