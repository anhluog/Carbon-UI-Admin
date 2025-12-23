import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TrendingUp, TrendingDown, DollarSign, Leaf, Award, Activity, ArrowUpRight, ArrowDownLeft, X, MapPin, Calendar, CheckCircle, Users, Bell } from 'lucide-react';
import CarbonCredit from '../abi/CarbonCredit.json';

interface UserProps {
  walletAddress: string;
}

const User: React.FC<UserProps> = ({ walletAddress }) => {
    const [cctBalance, setCctBalance] = useState('0');
    const [portfolioValue, setPortfolioValue] = useState('0');
    const [creditsOffset, setCreditsOffset] = useState('0');
    const [showProjectsPopup, setShowProjectsPopup] = useState(false);
    const [showTokenHistoryPopup, setShowTokenHistoryPopup] = useState(false);
    const [showTradesPopup, setShowTradesPopup] = useState(false);
    const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);

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

    const projects = [
        {
            id: 1,
            projectName: 'Amazon Rainforest Conservation',
            projectType: 'Forest Protection',
            location: 'Brazil',
            retiree: '0x123...abc',
            retiredAmount: 50.5,
            vintage: 2024,
            retiredDate: '2024-01-15',
        },
    ];

    const tokenHistory = [
        { type: 'Increase', amount: '100 CCT', date: '2023-05-20' },
        { type: 'Decrease', amount: '25 CCT', date: '2023-05-19' },
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
      name: 'Total Project',
      value: cctBalance,
      change: '+12.5%',
      changeType: 'increase',
      icon: Leaf,
      color: 'from-green-500 to-emerald-500',
      action: () => setShowProjectsPopup(true),
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
      name: 'Active Trades',
      value: '7',
      change: '-2',
      changeType: 'decrease',
      icon: Activity,
      color: 'from-orange-500 to-red-500',
        action: () => setShowTradesPopup(true),
    },
    {
        name: 'Notifications',
        value: notifications.length.toString(),
        change: '+3',
        changeType: 'increase',
        icon: Bell,
        color: 'from-yellow-500 to-amber-500',
        action: () => setShowNotificationsPopup(true),
    },
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

        {showProjectsPopup && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Total Projects</h3>
                        <button onClick={() => setShowProjectsPopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retiree</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Retired</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vintage</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retirement Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {projects.map((project) => (
                                    <tr key={project.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.projectName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.projectType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><div className="flex items-center"><MapPin className="h-4 w-4 mr-1.5 text-gray-400" />{project.location}</div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{project.retiree}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.retiredAmount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.vintage}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><div className="flex items-center"><Calendar className="h-4 w-4 mr-1.5 text-gray-400" />{project.retiredDate}</div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {showTokenHistoryPopup && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Total Token History</h3>
                        <button onClick={() => setShowTokenHistoryPopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <ul className="space-y-4">
                        {tokenHistory.map((item, index) => (
                            <li key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <span className={`font-medium ${item.type === 'Increase' ? 'text-green-600' : 'text-red-600'}`}>{item.type}</span>
                                <span>{item.amount}</span>
                                <span className="text-sm text-gray-500">{item.date}</span>
                            </li>
                        ))}
                    </ul>
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

        {showNotificationsPopup && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Notifications</h3>
                        <button onClick={() => setShowNotificationsPopup(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
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
        )}
    </div>
  );
};

export default User;

interface MarketplaceProps {
    walletAddress: string;
    setActiveTab: (tab: string) => void;
}