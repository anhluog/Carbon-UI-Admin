import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TrendingUp, TrendingDown, DollarSign, Leaf, Award, Activity, X, Calendar, Bell } from 'lucide-react';
import CarbonCreditEx from '../abi/CarbonCreditExchange.json';

// --- CẤU HÌNH ---
const EXCHANGE_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";

interface UserProps {
  walletAddress: string;
}

interface RetiredEntry {
    amount: string;
    dateOfIssue: string;
    equivalentTrees: string;
}

const User: React.FC<UserProps> = ({ walletAddress }) => {
    // --- STATE DỮ LIỆU BLOCKCHAIN ---
    const [nativeBalance, setNativeBalance] = useState('0'); // ETH trên sàn
    const [cctBalance, setCctBalance] = useState('0');       // Token trên sàn
    const [portfolioValue, setPortfolioValue] = useState('0');
    
    // --- STATE UI & INPUT ---
    const [loading, setLoading] = useState(false);
    const [amountInput, setAmountInput] = useState('');
    const [tokenIdInput, setTokenIdInput] = useState('1'); 
    
    const [showRechargePopup, setShowRechargePopup] = useState(false);
    const [showWithdrawalPopup, setShowWithdrawalPopup] = useState(false);
    const [showCertificatePopup, setShowCertificatePopup] = useState(false);
    const [rechargeType, setRechargeType] = useState<'Money' | 'Token'>('Money');
    const [withdrawalType, setWithdrawalType] = useState<'Money' | 'Token'>('Money');

    // --- LOGIC BLOCKCHAIN ---

    // 1. Hàm cập nhật số dư (Dùng ethers.getAddress để CHẶN LỖI ENS)
    const refreshBalances = useCallback(async () => {
    // 1. Kiểm tra môi trường
    if (!window.ethereum) {
        console.error("MetaMask chưa được cài đặt");
        return;
    }

    // 2. Kiểm tra walletAddress (Rất quan trọng)
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress === "") {
        console.warn("Đang đợi walletAddress hợp lệ... Hiện tại là:", walletAddress);
        return;
    }

    try {
        // 3. Kiểm tra định dạng địa chỉ ví
        if (!ethers.isAddress(walletAddress)) {
            console.error("Địa chỉ ví không đúng định dạng EVM:", walletAddress);
            return;
        }

        // 4. Kiểm tra địa chỉ Contract
        if (!ethers.isAddress(EXCHANGE_ADDRESS)) {
            console.error("EXCHANGE_ADDRESS trong cấu hình bị sai:", EXCHANGE_ADDRESS);
            return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Ép kiểu địa chỉ về Checksum Address (Vừa giúp an toàn vừa chặn lỗi ENS)
        const cleanWalletAddress = ethers.getAddress(walletAddress);
        const cleanContractAddress = ethers.getAddress(EXCHANGE_ADDRESS);

        // Đảm bảo lấy đúng mảng ABI (Hardhat thường để trong field "abi")
        const abi = CarbonCreditEx.abi ? CarbonCreditEx.abi : CarbonCreditEx;

        const contract = new ethers.Contract(cleanContractAddress, abi, provider);
        
        console.log("🔄 Đang lấy số dư cho ví:", cleanWalletAddress);

        // Gọi từng hàm riêng biệt để dễ bắt lỗi
        const nBal = await contract.getNativeBalance(cleanWalletAddress);
        setNativeBalance(ethers.formatEther(nBal));

        // Xử lý Token ID
        const tid = (tokenIdInput && !isNaN(Number(tokenIdInput))) ? BigInt(tokenIdInput) : 1n;
        const cBal = await contract.getCreditBalance(tid, cleanWalletAddress);
        setCctBalance(cBal.toString());

        const pricePerToken = 2.35;
        setPortfolioValue((Number(cBal) * pricePerToken).toFixed(2));

    } catch (error: any) {
        console.error("❌ Lỗi fetch balance chi tiết:");
        // In ra mã lỗi để debug
        if (error.message.includes("getEnsAddress")) {
            console.error("Phát hiện lỗi ENS: Có thể một tham số truyền vào hàm getNativeBalance bị null/undefined");
        } else {
            console.error(error);
        }
    }
}, [walletAddress, tokenIdInput]);

    useEffect(() => {
        refreshBalances();
    }, [refreshBalances]);

    // 2. Nạp ETH (depositNative)
    const handleDepositMoney = async () => {
        if (!amountInput || isNaN(Number(amountInput))) return alert("Nhập số lượng hợp lệ");
        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(EXCHANGE_ADDRESS, CarbonCreditEx.abi, signer);

            const tx = await contract.depositNative({
                value: ethers.parseEther(amountInput)
            });
            await tx.wait();
            alert("Nạp tiền thành công! Hãy xem log Spring Boot để kiểm tra đồng bộ DB.");
            setShowRechargePopup(false);
            setAmountInput('');
            refreshBalances();
        } catch (error: any) {
            alert("Lỗi nạp tiền: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };

    // 3. Nạp Token (depositCredit)
    const handleDepositToken = async () => {
        if (!amountInput || isNaN(Number(amountInput))) return alert("Nhập số lượng hợp lệ");
        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(EXCHANGE_ADDRESS, CarbonCreditEx.abi, signer);

            const tx = await contract.depositCredit(BigInt(tokenIdInput), BigInt(amountInput));
            await tx.wait();
            alert("Nạp Token thành công!");
            setShowRechargePopup(false);
            setAmountInput('');
            refreshBalances();
        } catch (error: any) {
            alert("Lỗi: Đảm bảo bạn đã Approve Token cho sàn và nhập đúng Token ID.");
        } finally {
            setLoading(false);
        }
    };

    // 4. Rút ETH (withdrawNative)
    const handleWithdrawMoney = async () => {
        if (!amountInput) return;
        setLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(EXCHANGE_ADDRESS, CarbonCreditEx.abi, signer);

            const tx = await contract.withdrawNative(ethers.parseEther(amountInput));
            await tx.wait();
            alert("Rút tiền thành công!");
            setShowWithdrawalPopup(false);
            refreshBalances();
        } catch (error: any) {
            alert("Lỗi rút tiền: " + (error.reason || "Không đủ số dư trên sàn"));
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    const stats = [
        {
            name: 'ETH on Platform',
            value: `${nativeBalance} ETH`,
            change: 'Live',
            changeType: 'increase',
            icon: DollarSign,
            color: 'from-blue-500 to-cyan-500',
            action: () => { setRechargeType('Money'); setShowRechargePopup(true); },
        },
        {
            name: 'Token Balance',
            value: `${cctBalance} CCT`,
            change: `ID: ${tokenIdInput}`,
            changeType: 'increase',
            icon: Leaf,
            color: 'from-green-500 to-emerald-500',
            action: () => { setRechargeType('Token'); setShowRechargePopup(true); },
        },
        {
            name: 'Withdrawal',
            value: 'Action',
            change: 'Native/Token',
            changeType: 'increase',
            icon: Award,
            color: 'from-purple-500 to-pink-500',
            action: () => setShowWithdrawalPopup(true),
        },
        {
            name: 'Portfolio Value',
            value: `$${portfolioValue}`,
            change: '+8.2%',
            changeType: 'increase',
            icon: Activity,
            color: 'from-orange-500 to-red-500',
            action: () => {},
        }
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={stat.action}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="text-green-600 text-sm font-medium">{stat.change}</div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                <p className="text-sm text-gray-600">{stat.name}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Notifications Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><Bell className="h-6 w-6 mr-2"/>Notifications</h3>
                <div className="text-center py-4 text-gray-500">No new notifications</div>
            </div>

            {/* --- RECHARGE POPUP --- */}
            {showRechargePopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Recharge Assets</h3>
                            <button onClick={() => setShowRechargePopup(false)} className="p-2 hover:bg-gray-100 rounded-full"><X/></button>
                        </div>
                        
                        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
                            <button onClick={() => setRechargeType('Money')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${rechargeType === 'Money' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>Money (ETH)</button>
                            <button onClick={() => setRechargeType('Token')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${rechargeType === 'Token' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Token (CCT)</button>
                        </div>

                        <div className="space-y-5">
                            {rechargeType === 'Token' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Token ID (ERC1155)</label>
                                    <input type="number" value={tokenIdInput} onChange={(e) => setTokenIdInput(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-xl p-3 focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Amount to Deposit</label>
                                <input type="number" placeholder="0.00" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-xl p-3 focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <button 
                                onClick={rechargeType === 'Money' ? handleDepositMoney : handleDepositToken}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg ${rechargeType === 'Money' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? "Processing..." : `Deposit ${rechargeType}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- WITHDRAW POPUP --- */}
            {showWithdrawalPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Withdraw Assets</h3>
                            <button onClick={() => setShowWithdrawalPopup(false)} className="p-2 hover:bg-gray-100 rounded-full"><X/></button>
                        </div>
                        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
                            <button onClick={() => setWithdrawalType('Money')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${withdrawalType === 'Money' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Money (ETH)</button>
                            <button onClick={() => setWithdrawalType('Token')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${withdrawalType === 'Token' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}>Token (CCT)</button>
                        </div>
                        <div className="space-y-5">
                            <input type="number" placeholder="0.00" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3" />
                            <button 
                                onClick={handleWithdrawMoney}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg ${withdrawalType === 'Money' ? 'bg-purple-600' : 'bg-pink-600'} ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? "Processing..." : `Withdraw ${withdrawalType}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default User;