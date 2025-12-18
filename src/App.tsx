import React, { useState } from 'react';
import { Leaf, Wallet, Building2, TrendingUp, Award, Plus, ShoppingCart, User, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MintToken from './components/MintToken';
import ManageOrg from './components/ManageOrg';
import Marketplace from './components/Marketplace';
import P2PTrading from './components/P2PTrading';
import AMMTrading from './components/AMMTrading';
import RetiredProjects from './components/RetiredProject';
import CryptoMarket from './components/CryptoMarket';
import RequestRole from './components/RequestRole';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isWalletConnected, setIsWalletConnected] = useState(true);
  const [walletAddress, setWalletAddress] = useState('0x1234567890123456789012345678901234567890');

  const tabs = [
    { id: 'dashboard', name: 'User', icon: User },
    { id: 'crypto', name: 'Crypto Market', icon: TrendingUp },
    { id: 'mint', name: 'Request Review', icon: Plus },
    { id: 'requestRole', name: 'Request Role', icon: Users },
    { id: 'marketplace', name: 'Marketplace', icon: ShoppingCart },
    { id: 'organization', name: 'Organization', icon: Building2 },
    { id: 'retired', name: 'RetiredProject', icon: Award }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard walletAddress={walletAddress} />;
      case 'crypto':
        return <CryptoMarket />;
      case 'mint':
        return <MintToken walletAddress={walletAddress} />;
      case 'requestRole':
        return <RequestRole walletAddress={walletAddress} />;
      case 'marketplace':
        return <Marketplace walletAddress={walletAddress} setActiveTab={setActiveTab} />;
      case 'organization':
        return <ManageOrg walletAddress={walletAddress} />;
      case 'retired':
        return <RetiredProjects walletAddress={walletAddress}/>; 
      default:
        return <Dashboard walletAddress={walletAddress} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 rounded-xl">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                  CarbonCredit
                </h1>
                <p className="text-xs text-gray-500">Carbon Trading Platform</p>
              </div>
            </div>
            
            {isWalletConnected && (
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 px-3 py-2 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">1,250.45 NVQ</p>
                  <p className="text-xs text-gray-500">$2,875.20 USD</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isWalletConnected && (
          <nav className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-green-200">
              <div className="flex space-x-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20'
                          : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        )}

        {renderContent()}
      </div>
    </div>
  );
}

export default App;
