import React, { useState, useEffect, useCallback } from 'react';
import { Leaf, Wallet, Building2, Award, Plus, ShoppingCart, User, Users, CheckCircle, Shield } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MintToken from './components/MintToken';
import ManageOrg from './components/ManageOrg';
import Marketplace from './components/Marketplace';
import RetiredProjects from './components/RetiredProject';
import RequestRole from './components/RequestRole';
import VerifyRole from './components/VerifyRole';
import VerifyProject from './components/VerifyProject';

const ADMIN_ACCOUNTS = [
  '0x1234567890123456789012345678901234567890'.toLowerCase(),
  '0x9618BE83998121F29f93e47F9843cd62c60e221a'.toLowerCase()
];

function App() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleLogout = useCallback(() => {
    setIsWalletConnected(false);
    setWalletAddress('');
    setUserRole('user');
    setShowLogoutConfirmation(false);
    setActiveTab('marketplace');
  }, []);

  const handleLogin = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];

        const message = `Welcome to CarbonCredit! Please sign this message to confirm your identity. This does not cost any gas.`;
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, account],
        });

        if (signature) {
            setWalletAddress(account);
            setIsWalletConnected(true);
            if (ADMIN_ACCOUNTS.includes(account.toLowerCase())) {
              setUserRole('admin');
            }
            setActiveTab('dashboard');
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        alert("Login failed. You need to sign the message to log in.");
      }
    } else {
      alert('Please install MetaMask to use this platform.');
    }
  };

  const renderLogoutConfirmation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
            <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
            <p className="mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-4">
                <button onClick={() => setShowLogoutConfirmation(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
                    Cancel
                </button>
                <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
                    Logout
                </button>
            </div>
        </div>
    </div>
  );

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          handleLogout();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [handleLogout]);

  const tabs = [
    { id: 'dashboard', name: 'User', icon: User, roles: ['user', 'admin'], restricted: true },
    { id: 'mint', name: 'Request Review', icon: Plus, roles: ['user', 'admin'], restricted: true },
    { id: 'requestRole', name: 'Request Role', icon: Users, roles: ['user', 'admin'], restricted: true },
    { id: 'marketplace', name: 'Marketplace', icon: ShoppingCart, roles: ['user', 'admin'], restricted: false },
    { id: 'organization', name: 'Organization', icon: Building2, roles: ['user', 'admin'], restricted: true },
    { id: 'retired', name: 'RetiredProject', icon: Award, roles: ['user', 'admin'], restricted: false },
    { id: 'verifyRole', name: 'Verify Role', icon: CheckCircle, roles: ['admin'], restricted: true },
    { id: 'verifyProject', name: 'Verify Project', icon: Shield, roles: ['admin'], restricted: true }
  ];

  const displayedTabs = isWalletConnected
    ? tabs.filter(tab => tab.roles.includes(userRole))
    : tabs.filter(tab => !tab.restricted);

  const renderContent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);

    if (currentTab?.restricted && !isWalletConnected) {
      return (
        <div className="text-center pt-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-lg text-gray-600 mb-8">You need to connect your wallet to access this page.</p>
          <button onClick={handleLogin} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-3 mx-auto">
            <Wallet className="h-6 w-6" />
            <span>Log In with MetaMask</span>
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard walletAddress={walletAddress} />;
      case 'mint': return <MintToken walletAddress={walletAddress} />;
      case 'requestRole': return <RequestRole walletAddress={walletAddress} />;
      case 'marketplace': return <Marketplace walletAddress={walletAddress} setActiveTab={setActiveTab} />;
      case 'organization': return <ManageOrg walletAddress={walletAddress} />;
      case 'retired': return <RetiredProjects walletAddress={walletAddress} />;
      case 'verifyRole': return <VerifyRole />;
      case 'verifyProject': return <VerifyProject />;
      default: return <Marketplace walletAddress={walletAddress} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {showLogoutConfirmation && renderLogoutConfirmation()}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 rounded-xl">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">CarbonCredit</h1>
                <p className="text-xs text-gray-500">Carbon Trading Platform</p>
              </div>
            </div>

            {isWalletConnected ? (
              <div className="flex items-center space-x-4">
                <button onClick={() => setShowLogoutConfirmation(true)} className="bg-green-100 px-3 py-2 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                </button>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 capitalize">{userRole}</p>
                  <p className="text-xs text-gray-500">$2,875.20 USD</p>
                </div>
              </div>
            ) : (
              <button onClick={handleLogin} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-green-200">
            <div className="flex space-x-2 overflow-x-auto">
              {displayedTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20'
                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                    }`}>
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
