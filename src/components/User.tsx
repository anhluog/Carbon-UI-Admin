import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TrendingUp, TrendingDown, DollarSign, Leaf, Award, Activity, X, MapPin, Calendar, Bell } from 'lucide-react';
import CarbonCredit from '../abi/CarbonCredit.json';

interface UserProps {
  walletAddress: string;
}

const User: React.FC<UserProps> = ({ walletAddress }) => {
    const [cctBalance, setCctBalance] = useState('0');
    const [portfolioValue, setPortfolioValue] = useState('0');
    const [creditsOffset, setCreditsOffset] = useState('0');
    const [showRechargePopup, setShowRechargePopup] = useState(false);
    const [showWithdrawalPopup, setShowWithdrawalPopup] = useState(false);
    const [showTokenHistoryPopup, setShowTokenHistoryPopup] = useState(false);
    const [showTradesPopup, setShowTradesPopup] = useState(false);
    const [rechargeType, setRechargeType] = useState('Money');
    const [withdrawalType, setWithdrawalType] = useState('Money');

    useEffect(() => {
        const fetchData = async () => {
            if (window.ethereum && walletAddress) {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const cctContract = new ethers.Contract('0x5FbDB2315678afecb367f032d93F642f64180aa3', CarbonCredit.abi, signer);

                const balance = await cctContract.balanceOf(walletAddress);
                const formattedBalance = ethers.utils.formatUnits(balance, 18);
                setCctBalance(formattedBalance);

                const price = 2.35;
                const value = parseFloat(formattedBalance) * price;
                setPortfolioValue(value.toFixed(2));
            }
        };

        fetchData();
    }, [walletAddress]);

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
      value: '7',
      change: '-2',
      changeType: 'decrease',
      icon: Activity,
      color: 'from-orange-500 to-red-500',
      action: () => setShowTradesPopup(true),
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
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
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
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center"><Bell className="h-6 w-6 mr-2"/>Notifications</h3>
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
                          <label htmlFor="amount" className="block text-sm font-medium text-gray-500">Amount (USD)</label>
                          <input type="text" id="amount" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <button className={`w-full text-white px-4 py-3 rounded-lg font-semibold text-lg bg-green-600 hover:bg-green-700'}`}>
                          Deposit Money
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
    </div>
  );
};

export default User;
