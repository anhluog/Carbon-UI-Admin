import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TrendingUp, TrendingDown, DollarSign, Leaf, Award, Activity, X, Bell, Calendar } from 'lucide-react';
import CarbonCredit from '../abi/CarbonCredit.json';
import CarbonCreditExchange from '../abi/CarbonCreditExchange.json';

interface UserProps {
    walletAddress: string;
}

interface RetiredEntry {
    amount: string;
    dateOfIssue: string;
    equivalentTrees: string;
}

const User: React.FC<UserProps> = ({ walletAddress }) => {
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

    // Đọc trực tiếp từ .env
    const CCT_CONTRACT_ADDRESS = import.meta.env.VITE_CCT_CONTRACT_ADDRESS;
    const EXCHANGE_CONTRACT_ADDRESS = import.meta.env.VITE_EXCHANGE_CONTRACT_ADDRESS;

    const fetchData = async () => {
        try {
            if (!window.ethereum || !walletAddress) return;

            // Validate contract address
            if (!CCT_CONTRACT_ADDRESS) {
                console.error('❌ VITE_CCT_CONTRACT_ADDRESS chưa được cấu hình trong .env');
                setCctBalance('0');
                setPortfolioValue('0');
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Kiểm tra xem contract có tồn tại không
            const code = await provider.getCode(CCT_CONTRACT_ADDRESS);
            if (code === '0x') {
                console.error('❌ Contract CarbonCredit chưa được deploy tại:', CCT_CONTRACT_ADDRESS);
                setCctBalance('0');
                setPortfolioValue('0');
                return;
            }

            const cctContract = new ethers.Contract(
                CCT_CONTRACT_ADDRESS,
                CarbonCredit.abi,
                signer
            );

            const balance = await cctContract.balanceOf(walletAddress);
            const formattedBalance = ethers.formatUnits(balance, 18);
            setCctBalance(formattedBalance);

            const price = 2.35;
            const value = parseFloat(formattedBalance) * price;
            setPortfolioValue(value.toFixed(2));
        } catch (error) {
            console.error('Error fetching data:', error);
            setCctBalance('0');
            setPortfolioValue('0');
        }
    };

    useEffect(() => {
        fetchData();
    }, [walletAddress]);

    const handleDepositNative = async () => {
        if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
            alert('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        try {
            setIsDepositing(true);

            if (!window.ethereum) {
                alert('Vui lòng cài đặt MetaMask!');
                return;
            }

            if (!EXCHANGE_CONTRACT_ADDRESS) {
                alert('❌ VITE_EXCHANGE_CONTRACT_ADDRESS chưa được cấu hình trong .env');
                return;
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const exchangeCode = await provider.getCode(EXCHANGE_CONTRACT_ADDRESS);
            if (exchangeCode === '0x') {
                alert('❌ Contract Exchange chưa được deploy tại: ' + EXCHANGE_CONTRACT_ADDRESS);
                return;
            }

            const amountInWei = ethers.parseEther(rechargeAmount);

            console.log('📝 Transaction details:', {
                from: walletAddress,
                to: EXCHANGE_CONTRACT_ADDRESS,
                value: amountInWei.toString(),
                amount: rechargeAmount + ' ETH'
            });

            // Interface để encode function call
            const depositInterface = new ethers.Interface([
                "function depositNative() payable"
            ]);
            
            const data = depositInterface.encodeFunctionData("depositNative", []);
            console.log('📝 Encoded data:', data);

            // ⚠️ THAY ĐỔI: Lấy nonce từ 'pending' thay vì 'latest'
            const nonce = await provider.getTransactionCount(walletAddress, 'pending');
            console.log('📝 Nonce (pending):', nonce);

            // Estimate gas
            let gasLimit;
            try {
                gasLimit = await provider.estimateGas({
                    from: walletAddress,
                    to: EXCHANGE_CONTRACT_ADDRESS,
                    value: amountInWei,
                    data: data
                });
                console.log('✅ Gas estimate:', gasLimit.toString());
                gasLimit = gasLimit + BigInt(20000); // Tăng buffer lên 20k
            } catch (gasError: any) {
                console.error('❌ Gas estimation failed:', gasError);
                gasLimit = BigInt(150000); // Tăng fallback gas
                console.log('⚠️ Using fallback gas:', gasLimit.toString());
            }

            // Lấy gas price
            const feeData = await provider.getFeeData();
            console.log('📝 Fee data:', {
                gasPrice: feeData.gasPrice?.toString(),
                maxFeePerGas: feeData.maxFeePerGas?.toString(),
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
            });

            // Tạo transaction object - KHÔNG include nonce và chainId
            const txRequest: any = {
                to: EXCHANGE_CONTRACT_ADDRESS,
                value: amountInWei,
                data: data,
                gasLimit: gasLimit,
            };

            // Thêm gas price
            if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
                txRequest.maxFeePerGas = feeData.maxFeePerGas;
                txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                console.log('Using EIP-1559 gas pricing');
            } else if (feeData.gasPrice) {
                txRequest.gasPrice = feeData.gasPrice;
                console.log('Using legacy gas pricing');
            }

            console.log('📝 Final transaction request:', {
                to: txRequest.to,
                value: txRequest.value.toString(),
                gasLimit: txRequest.gasLimit.toString(),
                maxFeePerGas: txRequest.maxFeePerGas?.toString(),
                maxPriorityFeePerGas: txRequest.maxPriorityFeePerGas?.toString()
            });

            // Send transaction - để MetaMask tự quản lý nonce
            console.log('⏳ Sending transaction via signer (MetaMask manages nonce)...');
            const tx = await signer.sendTransaction(txRequest);

            console.log('✅ Transaction sent:', tx.hash);
            alert('⏳ Đang xử lý giao dịch...\n\nHash: ' + tx.hash);

            // Đợi confirmation với timeout
            const receipt = await Promise.race([
                tx.wait(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Transaction timeout after 2 minutes')), 120000)
                )
            ]) as ethers.TransactionReceipt;

            console.log('✅ Transaction confirmed!', {
                blockNumber: receipt?.blockNumber,
                gasUsed: receipt?.gasUsed.toString(),
                status: receipt?.status
            });

            alert('✅ Nạp tiền thành công!\n\nBlock: ' + receipt?.blockNumber);

            setRechargeAmount('');
            setShowRechargePopup(false);
            await fetchData();

        } catch (error: any) {
            console.error('❌ Full error object:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);

            let errorMessage = 'Unknown error';

            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                errorMessage = 'Bạn đã từ chối giao dịch';
            } else if (error.message?.includes('timeout')) {
                errorMessage = 'Giao dịch quá lâu. Vui lòng kiểm tra lại trên explorer';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Số dư không đủ (bao gồm gas fee)';
            } else if (error.message?.includes('nonce too low') || error.message?.includes('nonce')) {
                errorMessage = 'Lỗi nonce!\n\n📋 Hướng dẫn fix:\n\n1. Mở MetaMask\n2. Settings → Advanced\n3. Click "Clear activity tab data"\n4. Hoặc "Reset Account"\n5. Thử lại';
            } else if (error.message?.includes('replacement fee too low')) {
                errorMessage = 'Transaction đang pending. Đợi vài phút hoặc tăng gas fee';
            } else if (error.reason) {
                errorMessage = error.reason;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert('❌ Lỗi: ' + errorMessage);
        } finally {
            setIsDepositing(false);
        }
    };

    const tokenHistory = [
        { type: 'Increase', amount: '100 CCT', date: '2023-05-20' },
        { type: 'Decrease', amount: '25 CCT', date: '2023-05-19' },
        { type: 'Increase', amount: '50 CCT', date: '2023-05-18' },
        { type: 'Decrease', amount: '10 CCT', date: '2023-05-17' },
    ];

    const trades = [
        { id: 1, type: 'Buy', amount: 25.5, price: 2.31, time: '2024-05-20 10:15:45' },
        { id: 2, type: 'Sell', amount: 10.0, price: 2.38, time: '2024-05-19 18:30:12' },
    ];

    const notifications = [
        { id: 1, type: 'Trade', message: 'Your buy order for 50 CCT has been matched.', time: '2 hours ago', status: 'Completed' },
        { id: 2, type: 'Approval', message: 'Your request for 1000 CCT issuance has been approved.', time: '1 day ago', status: 'Approved' },
        { id: 3, type: 'Alert', message: 'CCT price has increased by 5% in the last 24 hours.', time: '2 days ago', status: 'Alert' },
    ];

    const retiredEntries: RetiredEntry[] = [
        {
            amount: '10.00',
            dateOfIssue: '2024-05-21 10:30:00',
            equivalentTrees: '165'
        },
        {
            amount: '5.50',
            dateOfIssue: '2024-04-15 14:00:00',
            equivalentTrees: '90'
        },
        {
            amount: '12.75',
            dateOfIssue: '2024-03-28 18:45:00',
            equivalentTrees: '210'
        }
    ];

    const stats = [
        {
            name: 'Recharge',
            value: cctBalance,
            change: '+12.5%',
            changeType: 'increase',
            icon: Leaf,
            color: 'from-green-500 to-emerald-500',
            action: () => setShowRechargePopup(true),
        },
        {
            name: 'Withdrawal',
            value: `${creditsOffset} tCO₂`,
            change: '+15.3%',
            changeType: 'increase',
            icon: Award,
            color: 'from-purple-500 to-pink-500',
            action: () => setShowWithdrawalPopup(true),
        },
        {
            name: 'Total Token',
            value: `$${portfolioValue}`,
            change: '+8.2%',
            changeType: 'increase',
            icon: DollarSign,
            color: 'from-blue-500 to-cyan-500',
            action: () => setShowTokenHistoryPopup(true),
        },
        {
            name: 'Certificate',
            value: 'View',
            change: '',
            changeType: 'increase',
            icon: Activity,
            color: 'from-orange-500 to-red-500',
            action: () => setShowCertificatePopup(true),
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
                                <div className={`flex items-center space-x-1 text-sm font-medium ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.changeType === 'increase' ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span>{stat.change}</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                <p className="text-sm text-gray-600">{stat.name}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><Bell className="h-6 w-6 mr-2" />Notifications</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {notifications.map((notification) => (
                                <tr key={notification.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{notification.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{notification.message}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{notification.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${notification.status === 'Completed' ? 'bg-green-100 text-green-800' : notification.status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{notification.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showRechargePopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Recharge</h3>
                            <button onClick={() => setShowRechargePopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex mb-4 border-b">
                            <button onClick={() => setRechargeType('Money')} className={`flex-1 py-2 text-center font-semibold ${rechargeType === 'Money' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-600'}`}>Money</button>
                            <button onClick={() => setRechargeType('Token')} className={`flex-1 py-2 text-center font-semibold ${rechargeType === 'Token' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>Token</button>
                        </div>

                        {rechargeType === 'Money' ? (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-500">Số lượng (ETH)</label>
                                    <input
                                        type="number"
                                        id="amount"
                                        placeholder="0.00"
                                        value={rechargeAmount}
                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                        step="0.001"
                                        min="0"
                                        disabled={isDepositing}
                                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Số dư ví: {cctBalance} CCT</p>
                                </div>
                                <button
                                    onClick={handleDepositNative}
                                    disabled={isDepositing}
                                    className={`w-full text-white px-4 py-3 rounded-lg font-semibold text-lg ${isDepositing
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {isDepositing ? 'Đang xử lý...' : 'Nạp tiền'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-500">Amount (NVQ)</label>
                                    <input type="text" id="amount" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                                </div>
                                <button className={`w-full text-white px-4 py-3 rounded-lg font-semibold text-lg bg-blue-600 hover:bg-blue-700'}`}>
                                    Deposit Token
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showWithdrawalPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Withdrawal</h3>
                            <button onClick={() => setShowWithdrawalPopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex mb-4 border-b">
                            <button onClick={() => setWithdrawalType('Money')} className={`flex-1 py-2 text-center font-semibold ${withdrawalType === 'Money' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-purple-600'}`}>Money</button>
                            <button onClick={() => setWithdrawalType('Token')} className={`flex-1 py-2 text-center font-semibold ${withdrawalType === 'Token' ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>Token</button>
                        </div>

                        {withdrawalType === 'Money' ? (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-500">Amount (USD)</label>
                                    <input type="text" id="amount" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
                                </div>
                                <button className={`w-full text-white px-4 py-3 rounded-lg font-semibold text-lg bg-purple-600 hover:bg-purple-700'}`}>
                                    Withdraw Money
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-500">Amount (NVQ)</label>
                                    <input type="text" id="amount" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500" />
                                </div>
                                <button className={`w-full text-white px-4 py-3 rounded-lg font-semibold text-lg bg-pink-600 hover:bg-pink-700'}`}>
                                    Withdraw Token
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showTokenHistoryPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Total Token History</h3>
                            <button onClick={() => setShowTokenHistoryPopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="text-center mb-6">
                            <p className="text-lg text-gray-600">Total Token Value</p>
                            <p className="text-4xl font-bold text-gray-900">$${portfolioValue}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border border-green-200 rounded-lg">
                                <h4 className="font-semibold text-lg text-green-600 mb-2 text-center">Increase</h4>
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs text-gray-500">
                                        <tr><th>Amount</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {tokenHistory.filter(t => t.type === 'Increase').map((item, index) => (
                                            <tr key={index} className="text-left font-medium">
                                                <td className="text-green-600">{item.amount}</td>
                                                <td className="text-gray-500">{item.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border border-red-200 rounded-lg">
                                <h4 className="font-semibold text-lg text-red-600 mb-2 text-center">Decrease</h4>
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs text-gray-500">
                                        <tr><th>Amount</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {tokenHistory.filter(t => t.type === 'Decrease').map((item, index) => (
                                            <tr key={index} className="text-left font-medium">
                                                <td className="text-red-600">{item.amount}</td>
                                                <td className="text-gray-500">{item.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showTradesPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Active Trades</h3>
                            <button onClick={() => setShowTradesPopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-gray-500">
                                    <th>Type</th>
                                    <th>Amount (NVQ)</th>
                                    <th>Price (USD)</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trades.map((trade) => (
                                    <tr key={trade.id} className="text-left font-medium">
                                        <td className={trade.type === 'Buy' ? 'text-green-600' : 'text-red-600'}>{trade.type}</td>
                                        <td>{trade.amount}</td>
                                        <td>{trade.price}</td>
                                        <td className="text-gray-500 text-xs">{trade.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {showCertificatePopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {selectedCertificate ? 'Carbon Credit Certificate' : 'Carbon Credit Certificates'}
                            </h3>
                            <button onClick={() => {
                                setShowCertificatePopup(false);
                                setSelectedCertificate(null);
                            }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {selectedCertificate ? (
                            <div>
                                <button onClick={() => setSelectedCertificate(null)} className="mb-4 text-sm text-gray-600 hover:text-gray-900">
                                    &larr; Back to list
                                </button>
                                <div className="border-2 border-green-600 p-8 rounded-lg bg-green-50/50 text-center relative">
                                    <div className="absolute top-4 left-4 text-green-600">
                                        <Leaf className="w-12 h-12" />
                                    </div>
                                    <div className="absolute top-4 right-4 text-green-600">
                                        <Award className="w-12 h-12" />
                                    </div>
                                    <h1 className="text-4xl font-bold text-green-800 mb-2">Certificate of Carbon Offset</h1>
                                    <p className="text-lg text-gray-600 mb-6">This certificate is awarded to</p>
                                    <p className="text-2xl font-semibold text-gray-800 mb-4">{walletAddress}</p>
                                    <p className="text-lg text-gray-600 mb-6">for offsetting</p>
                                    <p className="text-5xl font-bold text-green-600 mb-4">{selectedCertificate.amount} tCO₂</p>
                                    <p className="text-sm text-gray-500 mb-8">Equivalent to planting {selectedCertificate.equivalentTrees} trees</p>
                                    <div className="grid grid-cols-1 gap-4 text-left">
                                        <div>
                                            <p className="text-xs text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-1" /> Date of Issue</p>
                                            <p className="font-semibold text-gray-700">{selectedCertificate.dateOfIssue}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retired Amount</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {retiredEntries.map((entry, index) => (
                                        <tr key={index} onClick={() => setSelectedCertificate(entry)} className="cursor-pointer hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.amount} tCO₂</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.dateOfIssue}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default User;
