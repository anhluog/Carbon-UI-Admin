import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
    TrendingUp, DollarSign, Leaf, Award, 
    X, Bell, Wallet, History, 
    ArrowRightLeft, Search, CheckCircle
} from 'lucide-react';
import CarbonCredit from '../abi/CarbonCredit.json';
import CarbonCreditExchange from '../abi/CarbonCreditExchange.json';
import api from '../utils/axiosInstance';

const EXCHANGE_CONTRACT_ADDRESS = import.meta.env.VITE_EXCHANGE_CONTRACT_ADDRESS;
const CCT_CONTRACT_ADDRESS = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;

interface UserProps {
    walletAddress: string;
}

interface RetiredEntry {
    amount: string;
    dateOfIssue: string;
    equivalentTrees: string;
}

const User: React.FC<UserProps> = ({ walletAddress }) => {
    // --- STATE GIỮ NGUYÊN ---
    const [cctBalance, setCctBalance] = useState('0');
    const [portfolioValue, setPortfolioValue] = useState('0');
    const [creditsOffset] = useState('0');
    const [showRechargePopup, setShowRechargePopup] = useState(false);
    const [showWithdrawalPopup, setShowWithdrawalPopup] = useState(false);
    const [showCertificatePopup, setShowCertificatePopup] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState<RetiredEntry | null>(null);
    const [rechargeType, setRechargeType] = useState('Money');
    const [withdrawalType, setWithdrawalType] = useState('Money');
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);

    const [tokenId, setTokenId] = useState('');
    const [tokenAmount, setTokenAmount] = useState('');

    const [ownedTokens, setOwnedTokens] = useState<Array<{
        tokenId: number;
        nftTokenId: number;
        balance: number;
        projectName: string;
    }>>([]);
    const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [selectedWithdrawTokenId, setSelectedWithdrawTokenId] = useState<number | null>(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const [exchangeNativeBalance, setExchangeNativeBalance] = useState('0');
    const [exchangeCreditBalances, setExchangeCreditBalances] = useState<Array<{
        creditId: string;
        tokenId: number;
        projectId: string;
        availableBalance: string;
        projectName: string;
    }>>([]);

    const [myTokens, setMyTokens] = useState<Array<{
        tokenId: number;
        projectId: string;
        projectName: string;
        balance: number;
        vintage: number;
        type: string;
    }>>([]);

    // --- LOGIC FUNCTIONS (GIỮ NGUYÊN) ---
    const fetchData = async () => {
        try {
            if (!window.ethereum || !walletAddress) return;
            if (!CCT_CONTRACT_ADDRESS || !EXCHANGE_CONTRACT_ADDRESS) return;

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const cctCode = await provider.getCode(CCT_CONTRACT_ADDRESS);
            const exchangeCode = await provider.getCode(EXCHANGE_CONTRACT_ADDRESS);

            if (cctCode === '0x' || exchangeCode === '0x') return;

            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const balance = await exchangeContract.getUserBalance(walletAddress);
            const formattedBalance = ethers.formatUnits(balance, 18);
            setCctBalance(formattedBalance);

            const price = 2.35;
            const value = parseFloat(formattedBalance) * price;
            setPortfolioValue(value.toFixed(2));
        } catch (error) {
            console.error('❌ Error fetching data:', error);
        }
    };

    const fetchOwnedTokens = async () => {
        if (!walletAddress || !CCT_CONTRACT_ADDRESS) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const cctContract = new ethers.Contract(CCT_CONTRACT_ADDRESS, CarbonCredit.abi, provider);
            const res = await api.get('/projects/MyProject');
            const mintedProjects = res.data.filter((p: any) => p.nftTokenId !== null && p.issueAmount > 0);

            if (mintedProjects.length === 0) {
                setOwnedTokens([]);
                return;
            }

            const tokens = await Promise.all(
                mintedProjects.map(async (p: any) => {
                    try {
                        const projectInfo = await cctContract.projectsByUUID(p.id);
                        const balance = await cctContract.balanceOf(walletAddress, projectInfo.creditTokenId);
                        return {
                            tokenId: Number(projectInfo.creditTokenId),
                            nftTokenId: Number(projectInfo.nftTokenId),
                            balance: Number(balance),
                            projectName: p.name
                        };
                    } catch (err) {
                        return { tokenId: 0, nftTokenId: 0, balance: 0, projectName: p.name };
                    }
                })
            );
            setOwnedTokens(tokens.filter(t => t.balance > 0));
        } catch (error) {
            setOwnedTokens([]);
        }
    };

    const fetchExchangeNativeBalance = async () => {
        try {
            const response = await api.get('/wallet/my-natives');
            setExchangeNativeBalance(response.data.nativeBalance || '0');
        } catch (error) {
            setExchangeNativeBalance('0');
        }
    };

    const fetchExchangeCreditBalances = async () => {
        try {
            const response = await api.get('/wallet/my-credits');
            const credits = response.data || [];
            const creditsWithNames = await Promise.all(
                credits.map(async (credit: any) => {
                    try {
                        const projectRes = await api.get(`/projects/${credit.projectId}`);
                        return { ...credit, projectName: projectRes.data.name || 'Unknown Project' };
                    } catch {
                        return { ...credit, projectName: 'Unknown Project' };
                    }
                })
            );
            setExchangeCreditBalances(creditsWithNames);
        } catch (error) {
            setExchangeCreditBalances([]);
        }
    };

    const fetchMyTokens = async () => {
        try {
            if (!walletAddress || !CCT_CONTRACT_ADDRESS) return;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const cctContract = new ethers.Contract(CCT_CONTRACT_ADDRESS, CarbonCredit.abi, provider);
            const res = await api.get('/projects/MyProject');
            const mintedProjects = res.data.filter((p: any) => p.nftTokenId !== null);

            if (mintedProjects.length === 0) {
                setMyTokens([]);
                return;
            }

            const tokens = await Promise.all(
                mintedProjects.map(async (p: any) => {
                    try {
                        const projectInfo = await cctContract.projectsByUUID(p.id);
                        const creditTokenId = Number(projectInfo.creditTokenId);
                        const balance = await cctContract.balanceOf(walletAddress, creditTokenId);
                        return {
                            tokenId: creditTokenId,
                            projectId: p.id,
                            projectName: p.name,
                            balance: Number(balance),
                            vintage: p.vintage || 2024,
                            type: p.type || 'Renewable Energy'
                        };
                    } catch (err) {
                        return null;
                    }
                })
            );
            setMyTokens(tokens.filter(t => t !== null) as any);
        } catch (error) {
            setMyTokens([]);
        }
    };

    const handleDepositNative = async () => {
        if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) { alert('Vui lòng nhập số tiền hợp lệ'); return; }
        try {
            setIsDepositing(true);
            if (!window.ethereum) { alert('Vui lòng cài đặt MetaMask!'); return; }
            if (!EXCHANGE_CONTRACT_ADDRESS) { alert('❌ Thiếu config contract'); return; }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const amountInWei = ethers.parseEther(rechargeAmount);
            
            const depositInterface = new ethers.Interface(["function depositNative() payable"]);
            const data = depositInterface.encodeFunctionData("depositNative", []);
            
            let gasLimit;
            try {
                gasLimit = await provider.estimateGas({ from: walletAddress, to: EXCHANGE_CONTRACT_ADDRESS, value: amountInWei, data: data });
                gasLimit = gasLimit + BigInt(20000);
            } catch (e) { gasLimit = BigInt(150000); }

            const txRequest: any = { to: EXCHANGE_CONTRACT_ADDRESS, value: amountInWei, data: data, gasLimit: gasLimit };
            const feeData = await provider.getFeeData();
            if (feeData.maxFeePerGas) {
                txRequest.maxFeePerGas = feeData.maxFeePerGas;
                txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            } else if (feeData.gasPrice) {
                txRequest.gasPrice = feeData.gasPrice;
            }

            const tx = await signer.sendTransaction(txRequest);
            alert('⏳ Đang xử lý giao dịch...\n\nHash: ' + tx.hash);
            const receipt = await tx.wait();
            alert('✅ Nạp tiền thành công!\n\nBlock: ' + receipt?.blockNumber);

            setRechargeAmount('');
            setShowRechargePopup(false);
            await fetchData();
        } catch (error: any) {
            alert('❌ Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsDepositing(false);
        }
    };

    const handleDepositToken = async () => {
        if (!selectedTokenId || !tokenAmount || parseFloat(tokenAmount) <= 0) { alert('Vui lòng chọn token và nhập số lượng'); return; }
        try {
            setIsDepositing(true);
            if (!window.ethereum) return;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const cctContract = new ethers.Contract(CCT_CONTRACT_ADDRESS, CarbonCredit.abi, signer);
            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const amountBigInt = BigInt(tokenAmount);

            const balance = await cctContract.balanceOf(walletAddress, selectedTokenId);
            if (balance < amountBigInt) { alert('❌ Số dư không đủ!'); return; }

            const isApproved = await cctContract.isApprovedForAll(walletAddress, EXCHANGE_CONTRACT_ADDRESS);
            if (!isApproved) {
                alert('⏳ Bước 1/2: Approve contract...');
                const approveTx = await cctContract.setApprovalForAll(EXCHANGE_CONTRACT_ADDRESS, true);
                await approveTx.wait();
                alert('✅ Approval thành công!');
            }

            alert('⏳ Bước 2/2: Deposit token...');
            const depositTx = await exchangeContract.depositCredit(selectedTokenId, amountBigInt);
            await depositTx.wait();
            alert('✅ Deposit thành công!');

            setSelectedTokenId(null);
            setTokenAmount('');
            setShowRechargePopup(false);
            await fetchData();
        } catch (error: any) {
            alert('❌ Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsDepositing(false);
        }
    };

    const handleWithdrawNative = async () => {
        if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) { alert('Nhập số tiền hợp lệ'); return; }
        try {
            setIsWithdrawing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const amountInWei = ethers.parseEther(withdrawalAmount);
            
            const balance = await exchangeContract.nativeBalances(walletAddress);
            if (balance < amountInWei) { alert('❌ Số dư không đủ!'); return; }

            alert('⏳ Đang rút tiền...');
            const tx = await exchangeContract.withdrawNative(amountInWei);
            await tx.wait();
            alert('✅ Rút tiền thành công!');

            setWithdrawalAmount('');
            setShowWithdrawalPopup(false);
            await fetchData();
            await fetchExchangeNativeBalance();
        } catch (error: any) {
            alert('❌ Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleWithdrawToken = async () => {
        if (!selectedWithdrawTokenId || !tokenAmount || parseFloat(tokenAmount) <= 0) { alert('Check input'); return; }
        try {
            setIsWithdrawing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const amountBigInt = BigInt(tokenAmount);

            const balance = await exchangeContract.creditBalances(selectedWithdrawTokenId, walletAddress);
            if (balance < amountBigInt) { alert('❌ Số dư không đủ!'); return; }

            alert('⏳ Đang rút token...');
            const tx = await exchangeContract.withdrawCredit(selectedWithdrawTokenId, amountBigInt);
            await tx.wait();
            alert('✅ Rút token thành công!');

            setSelectedWithdrawTokenId(null);
            setTokenAmount('');
            setShowWithdrawalPopup(false);
            await fetchData();
            await fetchExchangeCreditBalances();
            await fetchOwnedTokens();
        } catch (error: any) {
            alert('❌ Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsWithdrawing(false);
        }
    };

    // --- DATA THẬT (MẢNG RỖNG CHỜ API) ---
    const tokenHistory: any[] = []; 
    const notifications: any[] = []; 
    const retiredEntries: RetiredEntry[] = []; 

    const stats = [
        {
            name: 'Deposit',
            value: exchangeNativeBalance,
            unit: 'ETH (Exch)',
            icon: Wallet,
            action: () => setShowRechargePopup(true),
        },
        {
            name: 'Withdraw',
            value: exchangeNativeBalance,
            unit: 'tCO₂',
            icon: Leaf,
            action: () => setShowWithdrawalPopup(true),
        },
        {
            name: 'Portfolio Value',
            value: `$${portfolioValue}`,
            unit: 'Total Assets',
            icon: DollarSign,
            action: () => setShowTokenHistoryPopup(true),
        },
        {
            name: 'Certificates',
            value: 'View',
            unit: 'My Offset',
            icon: Award,
            action: () => setShowCertificatePopup(true),
        }
    ];

    useEffect(() => {
        fetchData();
        fetchExchangeNativeBalance();
    }, [walletAddress]);

    useEffect(() => { if (showRechargePopup) fetchOwnedTokens(); }, [showRechargePopup, walletAddress]);
    useEffect(() => { 
        if (showWithdrawalPopup) {
            fetchExchangeNativeBalance();
            fetchExchangeCreditBalances();
        }
    }, [showWithdrawalPopup, walletAddress]);
    useEffect(() => { if (showTokenHistoryPopup) fetchMyTokens(); }, [showTokenHistoryPopup, walletAddress]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* --- STATS DASHBOARD --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} 
                            onClick={stat.action}
                            className="group relative bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                    <Icon className="h-6 w-6 text-green-600" />
                                </div>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 group-hover:bg-green-100 transition-colors">Action</span>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                    <p className="text-xs text-gray-400 font-mono">{stat.unit}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- NOTIFICATIONS (REAL DATA) --- */}
            <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-sm">
                <div className="flex items-center mb-6">
                    <div className="p-2 bg-green-50 rounded-lg mr-3">
                        <Bell className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                </div>
                
                {notifications.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <Bell className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">No new notifications</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* Render data here when available */}
                        </table>
                    </div>
                )}
            </div>

            {/* --- POPUP: RECHARGE --- */}
            {showRechargePopup && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-bold">Deposit Assets</h3>
                                <p className="text-green-50 text-sm opacity-90">Add funds to Exchange</p>
                            </div>
                            <button onClick={() => setShowRechargePopup(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="flex bg-gray-50 p-1 rounded-lg mb-6">
                                <button onClick={() => setRechargeType('Money')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${rechargeType === 'Money' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Native (ETH)</button>
                                <button onClick={() => setRechargeType('Token')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${rechargeType === 'Token' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Credit Token</button>
                            </div>

                            {rechargeType === 'Money' ? (
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600 text-sm font-medium">Available to Withdraw</span>
                                        <span className="text-xl font-bold text-gray-900 font-mono">{exchangeNativeBalance} <span className="text-sm font-normal text-gray-500">ETH</span></span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Amount to Deposit (ETH)</label>
                                        <div className="relative">
                                            <input type="number" placeholder="0.00" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} disabled={isDepositing} className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-mono" />
                                            <span className="absolute right-4 top-3.5 text-gray-400 font-medium text-xs">ETH</span>
                                        </div>
                                    </div>
                                    <button onClick={handleDepositNative} disabled={isDepositing} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all ${isDepositing ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:shadow-lg'}`}>
                                        {isDepositing ? 'Processing...' : 'Confirm Deposit'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Select Token</label>
                                        <select value={selectedTokenId ?? ''} onChange={(e) => setSelectedTokenId(Number(e.target.value))} disabled={isDepositing} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                            <option value="">-- Choose from Wallet --</option>
                                            {ownedTokens.map(token => (
                                                <option key={token.tokenId} value={token.tokenId}>{token.projectName} (Bal: {token.balance})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Amount (tCO₂)</label>
                                        <input type="number" placeholder="Enter amount" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} disabled={!selectedTokenId || isDepositing} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                                    </div>
                                    <button onClick={handleDepositToken} disabled={!selectedTokenId || !tokenAmount || isDepositing} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all ${isDepositing || !selectedTokenId ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>
                                        {isDepositing ? 'Processing...' : 'Deposit Token'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- POPUP: WITHDRAWAL --- */}
            {showWithdrawalPopup && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-xl font-bold">Withdraw Assets</h3>
                                <p className="text-green-100 text-sm">Retrieve funds to Personal Wallet</p>
                            </div>
                            <button onClick={() => setShowWithdrawalPopup(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex bg-gray-50 p-1 rounded-lg mb-6">
                                <button onClick={() => setWithdrawalType('Money')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${withdrawalType === 'Money' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Withdraw ETH</button>
                                <button onClick={() => setWithdrawalType('Token')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${withdrawalType === 'Token' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Withdraw Token</button>
                            </div>

                            {withdrawalType === 'Money' ? (
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600 text-sm font-medium">Available to Withdraw</span>
                                        <span className="text-xl font-bold text-gray-900 font-mono">{exchangeNativeBalance} <span className="text-sm font-normal text-gray-500">ETH</span></span>
                                    </div>
                                    <input type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono" placeholder="0.00" />
                                    <button onClick={handleWithdrawNative} disabled={isWithdrawing} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md ${isWithdrawing ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                                        {isWithdrawing ? 'Processing...' : 'Withdraw ETH'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <select value={selectedWithdrawTokenId ?? ''} onChange={(e) => setSelectedWithdrawTokenId(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                        <option value="">-- Select Token from Exchange --</option>
                                        {exchangeCreditBalances.map(c => <option key={c.tokenId} value={c.tokenId}>{c.projectName} (Avail: {c.availableBalance})</option>)}
                                    </select>
                                    <input type="number" placeholder="Amount" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                                    <button onClick={handleWithdrawToken} disabled={isWithdrawing} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md ${isWithdrawing ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                                        {isWithdrawing ? 'Processing...' : 'Withdraw Token'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- POPUP: TOKEN HISTORY & PORTFOLIO --- */}
            {showTokenHistoryPopup && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Your Portfolio</h3>
                                <p className="text-gray-500 text-sm">Manage your carbon credits</p>
                            </div>
                            <div className="text-right mr-4 hidden md:block">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Est. Value</p>
                                <p className="text-2xl font-bold text-green-600 font-mono">${portfolioValue}</p>
                            </div>
                            <button onClick={() => setShowTokenHistoryPopup(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-gray-500 text-sm font-medium mb-1">Total Credits Owned</p>
                                    <p className="text-3xl font-bold text-green-600">{myTokens.reduce((sum, t) => sum + t.balance, 0)} <span className="text-sm font-normal text-gray-400">tCO₂</span></p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-gray-500 text-sm font-medium mb-1">Projects Invested</p>
                                    <p className="text-3xl font-bold text-gray-900">{myTokens.length}</p>
                                </div>
                                <div className="bg-green-500 p-5 rounded-xl border border-green-600 shadow-sm text-white">
                                    <p className="text-green-100 text-sm font-medium mb-1">Impact Status</p>
                                    <p className="text-3xl font-bold">Active</p>
                                </div>
                            </div>

                            {/* Holdings Table */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <h4 className="font-bold text-gray-800 flex items-center"><Leaf className="w-4 h-4 mr-2 text-green-500"/> My Holdings</h4>
                                </div>
                                
                                {myTokens.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-900 font-medium">No assets found</p>
                                        <p className="text-gray-500 text-sm">Buy credits from the marketplace to get started.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {myTokens.map((token) => (
                                                    <tr key={token.tokenId} className="hover:bg-green-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{token.tokenId}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900">{token.projectName}</div>
                                                            <div className="text-xs text-gray-500">Vintage: {token.vintage}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {token.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{token.balance} tCO₂</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                            <button onClick={() => alert('Coming soon')} className="text-green-600 hover:text-green-800 font-medium hover:underline">Manage</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            {/* History Section (Real data only) */}
                            {tokenHistory.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800 mb-4">Past Activity</h4>
                                    {/* Map real history here */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- POPUP: CERTIFICATE --- */}
            {showCertificatePopup && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => { setShowCertificatePopup(false); setSelectedCertificate(null); }} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"><X className="h-5 w-5 text-gray-500" /></button>

                        <div className="p-8">
                            {selectedCertificate ? (
                                <div className="relative border-[10px] border-double border-green-600 p-12 text-center bg-green-50/20 shadow-inner">
                                    <p>Certificate Display Logic Here</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="text-center mb-10">
                                        <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
                                            <Award className="h-10 w-10 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">My Certificates</h3>
                                        <p className="text-gray-500 mt-1">Verified proof of your environmental impact</p>
                                    </div>

                                    {retiredEntries.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                <TrendingUp className="h-6 w-6 text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 font-medium">No certificates found.</p>
                                            <p className="text-sm text-gray-400 mt-1">Retire your carbon credits to earn certificates.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {/* Map real retiredEntries here */}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default User;