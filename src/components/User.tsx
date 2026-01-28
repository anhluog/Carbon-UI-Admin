import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import {
    TrendingUp, DollarSign, Leaf, Award,
    X, Bell, Wallet, History,
    ArrowRightLeft, Search, CheckCircle
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import CarbonCredit from '../abi/CarbonCreditSystem.json';
import CarbonCreditExchange from '../abi/CarbonCreditExchange.json';
import api from '../utils/axiosInstance';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';
const EXCHANGE_CONTRACT_ADDRESS = import.meta.env.VITE_EXCHANGE_CONTRACT_ADDRESS;
const CCT_CONTRACT_ADDRESS = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;
const SOCKET_URL = 'ws://localhost:8080/ws';

interface UserProps {
    walletAddress: string;
}

interface RetiredEntry {
    amount: string;
    dateOfIssue: string;
    equivalentTrees: string;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
}

const User: React.FC<UserProps> = ({ walletAddress }) => {
    // --- GIỮ NGUYÊN TOÀN BỘ STATE GỐC ---
    const [cctBalance, setCctBalance] = useState('0');
    const [portfolioValue, setPortfolioValue] = useState('0');
    const [creditsOffset] = useState('0');
    const [showRechargePopup, setShowRechargePopup] = useState(false);
    const [showWithdrawalPopup, setShowWithdrawalPopup] = useState(false);
    const [showTokenHistoryPopup, setShowTokenHistoryPopup] = useState(false);
    const [showTradesPopup, setShowTradesPopup] = useState(false);
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

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const stompClientRef = useRef<Client | null>(null);

    // --- LOGIC FETCH DATA (GIỮ NGUYÊN) ---
    const fetchData = async () => {
        try {
            if (!window.ethereum || !walletAddress) return;
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const balance = await exchangeContract.getUserBalance(walletAddress);
            const formattedBalance = ethers.formatUnits(balance, 18);
            setCctBalance(formattedBalance);
            const price = 2.35;
            setPortfolioValue((parseFloat(formattedBalance) * price).toFixed(2));
        } catch (error) {
            console.error('❌ Error fetching data:', error);
        }
    };

    const fetchOwnedTokens = async () => {
        if (!walletAddress || !CCT_CONTRACT_ADDRESS) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            // Dùng Multicall hoặc balanceOfBatch để tối ưu
            const cctContract = new ethers.Contract(CCT_CONTRACT_ADDRESS, CarbonCredit.abi, provider);

            // 1. Lấy TẤT CẢ dự án đang hoạt động trên sàn (Không phải chỉ dự án của user)
            // Bạn cần một API trả về danh sách tất cả tokenId đang có: ví dụ GET /api/projects/market
            const res = await api.get('/projects/ProjectApproved'); // Giả sử API này trả về all projects
            const allProjects = res.data || [];

            if (allProjects.length === 0) return;

            // 2. Chuẩn bị mảng để gọi balanceOfBatch (Gửi 1 request duy nhất thay vì loop)
            // Đây là tính năng của ERC1155 giúp check nhiều token 1 lúc
            const tokenIds = [];
            const accounts = [];
            const projectMap = {}; // Map để tra cứu lại thông tin project

            for (const p of allProjects) {
                // Nếu API chưa có creditTokenId thì phải gọi contract để lấy, 
                // nhưng tốt nhất API nên trả về luôn creditTokenId
                if (p.tokenId) {
                    tokenIds.push(p.tokenId);
                    accounts.push(walletAddress); // Lặp lại địa chỉ ví user
                    projectMap[p.tokenId] = p;
                }
            }

            if (tokenIds.length === 0) return;

            // 3. Gọi Contract 1 lần duy nhất
            // balanceOfBatch([user, user, ...], [id1, id2, ...])
            const balances = await cctContract.balanceOfBatch(accounts, tokenIds);

            // 4. Lọc ra những token có số dư > 0
            const myTokens = [];
            for (let i = 0; i < balances.length; i++) {
                const balance = Number(balances[i]);
                if (balance > 0) {
                    const p = projectMap[tokenIds[i]];
                    myTokens.push({
                        tokenId: tokenIds[i],
                        nftTokenId: p.nftTokenId, // Có thể thiếu nếu API ko trả về
                        balance: balance,
                        projectName: p.name
                    });
                }
            }

            console.log('✅ Owned tokens on-chain:', myTokens);
            setOwnedTokens(myTokens);

        } catch (error) {
            showError('❌ Error fetching owned tokens:', error);
        }
    };

    const fetchExchangeNativeBalance = async () => {
        try {
            const response = await api.get('/wallet/my-natives');
            setExchangeNativeBalance(response.data.nativeBalance || '0');
        } catch (error) { setExchangeNativeBalance('0'); }
    };

    const fetchExchangeCreditBalances = async () => {
        try {
            const response = await api.get('/wallet/my-credits');
            const credits = response.data || [];
            const creditsWithNames = await Promise.all(credits.map(async (credit: any) => {
                try {
                    const projectRes = await api.get(`/projects/${credit.projectId}`);
                    return { ...credit, projectName: projectRes.data.name || 'Unknown Project' };
                } catch { return { ...credit, projectName: 'Unknown Project' }; }
            }));
            setExchangeCreditBalances(creditsWithNames);
        } catch (error) { setExchangeCreditBalances([]); }
    };

    const fetchMyTokens = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const cctContract = new ethers.Contract(CCT_CONTRACT_ADDRESS, CarbonCredit.abi, provider);
            const res = await api.get('/projects/processed-project');
            const mintedProjects = res.data.filter((p: any) => p.nftTokenId !== null);
            const tokens = await Promise.all(mintedProjects.map(async (p: any) => {
                try {
                    const projectInfo = await cctContract.projectsByUUID(p.id);
                    const creditTokenId = Number(projectInfo.creditTokenId);
                    const balance = await cctContract.balanceOf(walletAddress, creditTokenId);
                    return { tokenId: creditTokenId, projectId: p.id, projectName: p.name, balance: Number(balance), vintage: p.vintage || 2024, type: p.type || 'Renewable Energy' };
                } catch (err) { return null; }
            }));
            setMyTokens(tokens.filter(t => t !== null) as any);
        } catch (error) { setMyTokens([]); }
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/my-notifications');
            setNotifications(response.data || []);
        } catch (error) { setNotifications([]); }
    };

    useEffect(() => {
        // 1. Chỉ chạy khi có walletAddress
        if (!walletAddress) return;

        // 2. Tạo URL chuẩn (Bỏ đoạn /websocket)
        const socketUrl = SOCKET_URL;

        const client = new Client({
            brokerURL: socketUrl,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log("🚀 WS Connected Private");
                // Đảm bảo topic khớp với Backend: /topic/private/0x...
                client.subscribe(`/topic/private/${walletAddress.toLowerCase()}`, (message) => {
                    const newNote = JSON.parse(message.body);
                    setNotifications((prev) => {
                        const exists = prev.find(n => n.id === newNote.id);
                        if (exists) return prev;
                        return [newNote, ...prev];
                    });

                    fetchExchangeNativeBalance();
                    fetchExchangeCreditBalances();
                });
            },
            onStompError: (frame) => {
                console.error('Broker Error:', frame.headers['message']);
            }
        });

        client.activate();
        stompClientRef.current = client;

        // 3. Cleanup: Ngắt kết nối khi component bị hủy (Unmount)
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                console.log("🔴 WS Disconnected Private");
            }
        };
    }, [walletAddress]); // useEffect sẽ chạy lại khi walletAddress thay đổi

    // --- ACTIONS VỚI TOAST ---

    const handleDepositNative = async () => {
        if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) { showWarning('Vui lòng nhập số tiền hợp lệ'); return; }
        try {
            setIsDepositing(true);
            if (!window.ethereum) { showError('Vui lòng cài đặt MetaMask!'); return; }
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

            const tx = await signer.sendTransaction({ to: EXCHANGE_CONTRACT_ADDRESS, value: amountInWei, data: data, gasLimit: gasLimit });
            const receipt = await tx.wait();
            showSuccess('Nạp tiền thành công!'); // Thay alert

            setRechargeAmount('');
            setShowRechargePopup(false);
            await fetchData();
        } catch (error: any) {
            showError(' Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsDepositing(false);
        }
    };

    const handleDepositToken = async () => {
        if (!selectedTokenId || !tokenAmount || parseFloat(tokenAmount) <= 0) { showWarning('Vui lòng chọn token và nhập số lượng'); return; }
        try {
            setIsDepositing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const cctContract = new ethers.Contract(CCT_CONTRACT_ADDRESS, CarbonCredit.abi, signer);
            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const amountBigInt = BigInt(tokenAmount);

            const isApproved = await cctContract.isApprovedForAll(walletAddress, EXCHANGE_CONTRACT_ADDRESS);
            if (!isApproved) {
                const approveTx = await cctContract.setApprovalForAll(EXCHANGE_CONTRACT_ADDRESS, true);
                await approveTx.wait();
                showSuccess('Approval thành công!');
            }

            const depositTx = await exchangeContract.depositCredit(selectedTokenId, amountBigInt);
            await depositTx.wait();
            showSuccess('Deposit Token thành công!');

            setSelectedTokenId(null);
            setTokenAmount('');
            setShowRechargePopup(false);
            await fetchData();
        } catch (error: any) {
            showError(' Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsDepositing(false);
        }
    };

    const handleWithdrawNative = async () => {
        if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) { showWarning('Nhập số tiền hợp lệ'); return; }
        try {
            setIsWithdrawing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const amountInWei = ethers.parseEther(withdrawalAmount);

            const tx = await exchangeContract.withdrawNative(amountInWei);
            await tx.wait();
            showSuccess('Rút tiền thành công!');

            setWithdrawalAmount('');
            setShowWithdrawalPopup(false);
            await fetchData();
            await fetchExchangeNativeBalance();
        } catch (error: any) {
            showError(' Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleWithdrawToken = async () => {
        if (!selectedWithdrawTokenId || !tokenAmount || parseFloat(tokenAmount) <= 0) { showWarning('Vui lòng điền đủ thông tin'); return; }
        try {
            setIsWithdrawing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const exchangeContract = new ethers.Contract(EXCHANGE_CONTRACT_ADDRESS, CarbonCreditExchange.abi, signer);
            const amountBigInt = BigInt(tokenAmount);

            const tx = await exchangeContract.withdrawCredit(selectedWithdrawTokenId, amountBigInt);
            await tx.wait();
            showSuccess('Rút token thành công!');

            setSelectedWithdrawTokenId(null);
            setTokenAmount('');
            setShowWithdrawalPopup(false);
            await fetchData();
            await fetchExchangeCreditBalances();
            await fetchOwnedTokens();
        } catch (error: any) {
            showError('❌ Lỗi: ' + (error.reason || error.message));
        } finally {
            setIsWithdrawing(false);
        }
    };

    // --- RENDER DASHBOARD (Giao diện y hệt file gốc) ---

    const totalExchangeCredits = exchangeCreditBalances.reduce((sum, c) => sum + parseFloat(c.availableBalance || '0'), 0).toFixed(2);
    const stats = [
        { name: 'Nạp', value: exchangeNativeBalance, unit: 'ETH (Exch)', icon: Wallet, action: () => setShowRechargePopup(true) },
        { name: 'Rút', value: totalExchangeCredits, unit: 'tCO₂ (Exch)', icon: Leaf, action: () => setShowWithdrawalPopup(true) },
    ];

    useEffect(() => {
        fetchData();
        fetchExchangeNativeBalance();
         fetchExchangeCreditBalances(); // Thêm dòng này
        fetchOwnedTokens();  
        fetchNotifications();

        return () => stompClientRef.current?.deactivate();
    }, [walletAddress]);

    useEffect(() => { if (showRechargePopup) fetchOwnedTokens(); }, [showRechargePopup, walletAddress]);
    useEffect(() => { if (showWithdrawalPopup) { fetchExchangeNativeBalance(); fetchExchangeCreditBalances(); } }, [showWithdrawalPopup, walletAddress]);
    useEffect(() => { if (showTokenHistoryPopup) fetchMyTokens(); }, [showTokenHistoryPopup, walletAddress]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* STATS DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} onClick={stat.action} className="group relative bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer overflow-hidden">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                    <Icon className="h-6 w-6 text-green-600" />
                                </div>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">Action</span>
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

            {/* NOTIFICATIONS TABLE */}
            <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-sm">
                <div className="flex items-center mb-6">
                    <div className="p-2 bg-green-50 rounded-lg mr-3"><Bell className="h-5 w-5 text-green-600" /></div>
                    <h3 className="text-lg font-bold text-gray-900">Thông báo</h3>
                </div>
                {notifications.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <Bell className="h-6 w-6 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No new notifications</p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-100 max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="sticky top-0 bg-white">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Title</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Message</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Time</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {notifications.map((n) => (
                                    <tr key={n.id} className="hover:bg-green-50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-gray-900">{n.title}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{n.message}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${n.type === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{n.type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* RECHARGE POPUP */}
            {showRechargePopup && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 flex justify-between items-center text-white">
                            <div><h3 className="text-xl font-bold">Nạp</h3><p className="text-green-50 text-sm">Nạp tài sản vào ví hệ thống</p></div>
                            <button onClick={() => setShowRechargePopup(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex bg-gray-50 p-1 rounded-lg mb-6">
                                <button onClick={() => setRechargeType('Money')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${rechargeType === 'Money' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>Nạp ETH</button>
                                <button onClick={() => setRechargeType('Token')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${rechargeType === 'Token' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>Nạp tín chỉ</button>
                            </div>
                            {rechargeType === 'Money' ? (
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
                                        <span className="text-gray-600 text-sm font-medium">Số dư khả dụng</span>
                                        <span className="text-xl font-bold text-gray-900 font-mono">{exchangeNativeBalance} ETH</span>
                                    </div>
                                    <input type="number" placeholder="0.00" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} disabled={isDepositing} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                                    <button onClick={handleDepositNative} disabled={isDepositing} className="w-full py-3.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-300 transition-all">
                                        {isDepositing ? 'Đang xử lý...' : 'Xác nhận Nạp'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <select value={selectedTokenId ?? ''} onChange={(e) => setSelectedTokenId(Number(e.target.value))} disabled={isDepositing} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                        <option value="">-- Chọn tín chỉ --</option>
                                        {ownedTokens.map(token => <option key={token.tokenId} value={token.tokenId}>{token.projectName} (Bal: {token.balance})</option>)}
                                    </select>
                                    <input type="number" placeholder="Enter amount" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} disabled={!selectedTokenId || isDepositing} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                                    <button onClick={handleDepositToken} disabled={!selectedTokenId || !tokenAmount || isDepositing} className="w-full py-3.5 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-300">
                                        {isDepositing ? 'Đang xử lý...' : 'Xác nhận Rút'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* WITHDRAW POPUP */}
            {showWithdrawalPopup && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex justify-between items-center text-white">
                            <div><h3 className="text-xl font-bold">Rút</h3><p className="text-green-100 text-sm">Rút tiền về ví Blockchain</p></div>
                            <button onClick={() => setShowWithdrawalPopup(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex bg-gray-50 p-1 rounded-lg mb-6">
                                <button onClick={() => setWithdrawalType('Money')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${withdrawalType === 'Money' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Rút ETH</button>
                                <button onClick={() => setWithdrawalType('Token')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${withdrawalType === 'Token' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Rút tín chỉ</button>
                            </div>
                            {withdrawalType === 'Money' ? (
                                <div className="space-y-5">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center"><span className="text-gray-600 text-sm font-medium">Số dư khả dụng</span><span className="text-xl font-bold font-mono">{exchangeNativeBalance} ETH</span></div>
                                    <input type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono" placeholder="0.00" />
                                    <button onClick={handleWithdrawNative} disabled={isWithdrawing} className="w-full py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300">
                                        {isWithdrawing ? 'Đang xử lý...' : 'Rút ETH'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <select value={selectedWithdrawTokenId ?? ''} onChange={(e) => setSelectedWithdrawTokenId(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none">
                                        <option value="">-- Chọn tín chỉ --</option>
                                        {exchangeCreditBalances.map(c => <option key={c.tokenId} value={c.tokenId}>{c.projectName} (Avail: {c.availableBalance})</option>)}
                                    </select>
                                    <input type="number" placeholder="Amount" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono" />
                                    <button onClick={handleWithdrawToken} disabled={isWithdrawing} className="w-full py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300">
                                        {isWithdrawing ? 'Đang xử lý...' : 'Rút tín chỉ'}
                                    </button>
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