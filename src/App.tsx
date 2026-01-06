import React, { useState, useEffect, useCallback } from 'react';
import { Leaf, Wallet, Building2, Award, Plus, ShoppingCart, User as UserIcon, Users, CheckCircle, Shield, Edit3 } from 'lucide-react';
import { ethers, id } from 'ethers';  // Import ethers cho provider/signer
import axios from 'axios';  // Import axios cho API call
import User from './components/User';
import Profile from './components/UpdateProfile';  // Thêm import cho Profile component
import RequestReview from './components/RequestReview';
import Marketplace from './components/Marketplace';
import Projects from './components/Project';
import RequestRole from './components/RequestRole';
import VerifyRole from './components/VerifyRole';
import VerifyProject from './components/VerifyProject';
import MyToken from './components/MyToken';
import ApprovedProject from './components/ApprovedProject';


function App() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConnect = useCallback((address: string, role: string = 'user') => {
    setWalletAddress(address);
    setIsWalletConnected(true);
    setUserRole(role);
    setActiveTab('user');
    setError(null);
  }, []);

  const handleConnect = async (walletType: string) => {
    if (walletType !== "MetaMask") {
      alert(`🚧 ${walletType} chưa được hỗ trợ, chỉ hỗ trợ MetaMask hiện tại.`);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Kiểm tra có cài MetaMask chưa
      if (!window.ethereum) {
        throw new Error("Vui lòng cài đặt MetaMask trước khi tiếp tục!");
      }

      // Kiểm tra kết nối hiện tại (không mở popup nếu đã connect)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();  // Lấy accounts hiện tại (không request)

      let address: string;

      const extractAddress = async (acct: unknown): Promise<string> => {
        // If it's already a string address
        if (typeof acct === 'string') return acct;
        
        // If it's a signer-like object with getAddress()
        if (acct && typeof acct === 'object') {
          // Type guard for object with getAddress method
          if ('getAddress' in acct && typeof acct.getAddress === 'function') {
            return await (acct.getAddress as () => Promise<string>)();
          }
          // Some providers return objects with an 'address' field
          if ('address' in acct && typeof acct.address === 'string') {
            return acct.address;
          }
        }
        throw new Error('Không thể lấy địa chỉ từ tài khoản được trả về');
      };

      if (accounts.length === 0) {
        // Chưa connect: Yêu cầu kết nối (mở popup MetaMask)
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // Sau request, lấy lại accounts
        const newAccounts = await provider.listAccounts();
        if (newAccounts.length === 0) {
          throw new Error("Người dùng từ chối kết nối ví!");
        }
        address = await extractAddress(newAccounts[0]);
      } else {
        // Đã connect: Lấy address hiện tại (không mở popup)
        address = await extractAddress(accounts[0]);
        console.log("✅ Đã kết nối sẵn:", address);
      }

      // Lấy signer từ provider (default to first account - no param to avoid type issue)
      const signer = await provider.getSigner();  // This returns JsonRpcSigner, but we use it for methods only

      // Kiểm tra network (Polygon Amoy - chainId 80002 / 0x13882)
      const network = await provider.getNetwork();
      if (network.chainId !== 80002n) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }],  // Polygon Amoy hex
          });
        } catch (switchError: unknown) {
          // Type guard to check if error has code property
          const isErrorWithCode = (err: unknown): err is { code: number } => {
            return (
              typeof err === 'object' &&
              err !== null &&
              'code' in err &&
              typeof (err as { code: unknown }).code === 'number'
            );
          };

          if (isErrorWithCode(switchError) && switchError.code === 4902) {
            // Network chưa add: Add Polygon Amoy
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x13882",
                chainName: "Polygon Amoy",
                rpcUrls: ["https://polygon-amoy.infura.io/v3/9280fa3258a544b4a595e79e909d3f85"],
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                blockExplorerUrls: ["https://amoy.polygonscan.com/"],
              }],
            });
          } else {
            throw new Error("Vui lòng chuyển sang mạng Polygon Amoy!");
          }
        }
      }

      // Sign message để auth với BE (order: message, address)
      const message = `Login to CarbonCredit App - ${new Date().toISOString()}`;
      const signature = await signer.signMessage(message);  // Returns Promise<string> - type-safe

      // Gọi BE API auth
      const response = await axios.post("http://localhost:8080/api/auth/login", { 
        address,
        message,
        signature
      });


      console.log("✅ Auth success:", response.data);

      // ← SỬA: Lưu token chỉ khi success và token tồn tại
      if (response.status === 200 && response.data.token) {
        // Ví dụ trong login handler
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Đảm bảo response.data.user có { id: '...', ... }
        localStorage.setItem('token', response.data.token);
        console.log("Token saved to localStorage:", response.data.token.substring(0, 20) + "...");  // Debug

        
        // Set role từ response nếu có (backend trả roleId)
        let role = 'user';  // Default role
        if(response.data.user?.roleId == 'ADMIN'){
          role = 'admin';
        }
        else if(response.data.user?.roleId == 'VERIFIER'){
          role = 'verifier';
        }else if(response.data.user?.roleId == 'GOVERNMENT'){
          role = 'government';
        }else if(response.data.user?.roleId == 'OWNER'){
          role = 'owner';
        }else if(response.data.user?.roleId == 'SUPERADMIN'){
          role = 'superadmin';
        }

        onConnect(address.toLowerCase(),role );  // Redirect với role

        console.log(`✅ Wallet connected: ${address} with role ${role}`);
        
      } else {
        throw new Error("Auth failed: No token in response");
      }

      // Lắng nghe thay đổi (reload trang để reset state)
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());

    } catch (error: unknown) {
      console.error("❌ Lỗi kết nối MetaMask:", error);
      
      // Type guard to check if error is an Error object
      const isError = (err: unknown): err is Error => {
        return err instanceof Error;
      };

      // Type guard to check if error has code property
      const hasCode = (err: unknown): err is { code: number } => {
        return (
          typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          typeof (err as { code: unknown }).code === 'number'
        );
      };

      if (isError(error)) {
        setError(error.message || "Kết nối thất bại. Vui lòng thử lại!");
      } else {
        setError("Kết nối thất bại. Vui lòng thử lại!");
      }

      if (hasCode(error) && error.code === 4001) {
        setError("Người dùng từ chối kết nối ví!");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = useCallback(() => {
    setIsWalletConnected(false);
    setWalletAddress('');
    setUserRole('user');
    setShowLogoutConfirmation(false);
    setActiveTab('marketplace');
    localStorage.removeItem('token');  // Clear token khi logout
    window.ethereum?.removeAllListeners();  // Clear listeners
  }, []);

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
      const handleAccountsChanged = (accounts: unknown) => {
        // Type guard to check if accounts is an array
        if (Array.isArray(accounts)) {
          if (accounts.length === 0) {
            handleLogout();
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [handleLogout]);

  const tabs = [
    { id: 'user', name: 'User', icon: UserIcon, roles: ['user', 'admin', 'superadmin', 'verifier','government'], restricted: true },
    { id: 'requestReview', name: 'Request Review', icon: Plus, roles: ['owner'], restricted: true },
    { id: 'requestRole', name: 'Request Role', icon: Users, roles: ['user',], restricted: true },
    { id: 'marketplace', name: 'Marketplace', icon: ShoppingCart, roles: ['user','owner','verifier', 'admin','government'], restricted: false },
    { id: 'project', name: 'Project', icon: Award, roles: ['owner'], restricted: false },
    { id: 'verifyRole', name: 'Verify Role', icon: CheckCircle, roles: ['admin','superadmin'], restricted: true },
    { id: 'verifyProject', name: 'Verify Project', icon: Shield, roles: ['verifier','admin'], restricted: true },
    { id: 'updateProfile', name: 'Update Profile', icon: Edit3, roles: ['user'], restricted: true },
    { id: 'approvedProject', name: 'Approved Project', icon: CheckCircle, roles: ['government'], restricted: true },
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
          <button 
            onClick={() => handleConnect('MetaMask')} 
            disabled={isConnecting}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-3 mx-auto disabled:opacity-50"
          >
            <Wallet className="h-6 w-6" />
            <span>{isConnecting ? 'Connecting...' : 'Log In with MetaMask'}</span>
          </button>
          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        </div>
      );
    }

    switch (activeTab) {
      case 'user': return <User walletAddress={walletAddress} />;
      case 'myToken': return <MyToken />;
      case 'requestReview': return <RequestReview walletAddress={walletAddress} />;
      case 'requestRole': return <RequestRole walletAddress={walletAddress} />;
      case 'marketplace': return <Marketplace walletAddress={walletAddress} setActiveTab={setActiveTab} />;
      case 'project': return <Projects />;
      case 'verifyRole': return <VerifyRole />;
      case 'verifyProject': return <VerifyProject />;
      case 'updateProfile': return <Profile walletAddress={walletAddress} setActiveTab={setActiveTab} />;
      case 'approvedProject': return <ApprovedProject  />;
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
              <button 
                onClick={() => handleConnect('MetaMask')} 
                disabled={isConnecting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Wallet className="h-5 w-5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
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