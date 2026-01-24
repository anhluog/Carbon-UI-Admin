import React, { useState, useEffect } from 'react';
import OrderBook from './OrderBook';
import RecentTrades from './RecentTrades';
import CandlestickChart from './CandlestickChart';
import {
  DollarSign,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Shield,
  Info,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import api from '../utils/axiosInstance';

interface CryptoMarketProps {
  walletAddress: string;
  creditId?: string;
}

interface Order {
  id: string;
  creditId: string;
  userId: string;
  orderType: string;
  orderCondition: string;
  price: number;
  amount: number;
  filledAmount: number;
  remainingAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// --- COMPONENT LỊCH SỬ GIAO DỊCH ---
const TradeHistory: React.FC<{ creditId: string }> = ({ creditId }) => {
  const [filter, setFilter] = useState<'BUY' | 'SELL'>('BUY');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [filter, creditId]);

  const loadOrders = async () => {
    if (!creditId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await api.get(`/orders/my-orders`, {
        params: { creditId },
        headers: { Authorization: `Bearer ${token}` }
      });

      const filtered = response.data
        .filter((order: Order) => order.orderType === filter)
        .sort((a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setOrders(filtered);
    } catch (error) {
      console.error('Không thể tải danh sách lệnh:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await api.delete(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Hủy lệnh thành công');
      loadOrders();
    } catch (error: any) {
      alert(`❌ ${error.response?.data?.message || 'Không thể hủy lệnh'}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const mapStatus = (status: string) => {
    switch (status) {
      case 'OPEN': return 'ĐANG MỞ';
      case 'FILLED': return 'ĐÃ KHỚP';
      case 'CANCELLED': return 'ĐÃ HỦY';
      case 'PENDING': return 'CHỜ XỬ LÝ';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button onClick={() => setFilter('BUY')} className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${filter === 'BUY' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ArrowUpRight className="w-4 h-4" /> Lệnh Mua
        </button>
        <button onClick={() => setFilter('SELL')} className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${filter === 'SELL' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ArrowDownRight className="w-4 h-4" /> Lệnh Bán
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 text-gray-400 animate-spin" /></div>
        ) : orders.length > 0 ? (
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                  <th className="px-4 py-3 text-right">Giá</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-gray-400" /><span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span></div></td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{order.amount}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{order.orderCondition === 'MARKET' ? 'Thị trường' : `$${order.price.toFixed(2)}`}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : order.status === 'FILLED' ? 'bg-green-100 text-green-700' : order.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{mapStatus(order.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(order.status === 'OPEN' || order.status === 'PENDING') && (
                        <button onClick={() => cancelOrder(order.id)} className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition-colors">Hủy lệnh</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12"><Package className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Không tìm thấy lệnh {filter === 'BUY' ? 'mua' : 'bán'} nào</p></div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH CRYPTOMARKET ---
const CryptoMarket: React.FC<CryptoMarketProps> = ({ walletAddress, creditId }) => {
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell' | 'History'>('Buy');
  const [selectedCreditId, setSelectedCreditId] = useState<string>(creditId || '');

  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [orderCondition, setOrderCondition] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [sliderValue, setSliderValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (creditId) setSelectedCreditId(creditId);
  }, [creditId]);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
  };

  const calculateTotal = () => {
    if (orderCondition === 'MARKET') return 'Giá Thị trường';
    const p = parseFloat(price) || 0;
    const a = parseFloat(amount) || 0;
    return `$${(p * a).toFixed(2)}`;
  };

  const handlePlaceOrder = async () => {
    if (!selectedCreditId) return alert('⚠️ Vui lòng chọn một loại tín chỉ carbon');
    
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return alert('⚠️ Vui lòng nhập số lượng hợp lệ');
    }

    let priceNum = 0;
    if (orderCondition === 'LIMIT') {
        priceNum = parseFloat(price);
        if (!price || isNaN(priceNum) || priceNum <= 0) {
            return alert('⚠️ Vui lòng nhập giá hợp lệ cho Lệnh Giới hạn');
        }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) return alert('⚠️ Vui lòng đăng nhập để thực hiện giao dịch');

      await api.post(`/orders/place`, {
        creditId: selectedCreditId,
        orderType: tradeType === 'Buy' ? 'BUY' : 'SELL',
        orderCondition,
        price: orderCondition === 'MARKET' ? 0 : priceNum,
        amount: amountNum
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ Đặt lệnh ${tradeType === 'Buy' ? 'Mua' : 'Bán'} thành công!`);
      setPrice('');
      setAmount('');
      setSliderValue(0);
      setTradeType('History');
    } catch (error: any) {
      alert(`❌ ${error.response?.data?.message || 'Đặt lệnh thất bại'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCreditId || selectedCreditId === 'undefined') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-3xl border border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa chọn Tín chỉ</h3>
          <p className="text-gray-600 text-sm">Vui lòng chọn một dự án tín chỉ carbon từ thị trường để bắt đầu giao dịch.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CandlestickChart creditId={selectedCreditId} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[
                { key: 'Buy', label: 'Mua', icon: TrendingUp, activeClass: 'text-green-600', borderClass: 'bg-green-500' },
                { key: 'Sell', label: 'Bán', icon: TrendingDown, activeClass: 'text-red-600', borderClass: 'bg-red-500' },
                { key: 'History', label: 'Lệnh của tôi', icon: Clock, activeClass: 'text-blue-600', borderClass: 'bg-blue-500' }
              ].map(({ key, label, icon: Icon, activeClass, borderClass }) => (
                <button
                  key={key}
                  onClick={() => setTradeType(key as any)}
                  className={`flex-1 py-4 px-6 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 relative ${tradeType === key
                      ? activeClass
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {tradeType === key && (
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${borderClass}`}></div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tradeType === 'History' ? (
                <TradeHistory creditId={selectedCreditId} />
              ) : (
                <div className="space-y-6">
                  {/* Loại lệnh */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Loại lệnh</span>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          Limit: Tự đặt giá | Market: Khớp ngay với giá tốt nhất
                        </div>
                      </div>
                    </div>

                    <div className="flex bg-gray-100 rounded-xl p-1">
                      {[
                        { key: 'LIMIT', label: 'GIỚI HẠN' },
                        { key: 'MARKET', label: 'THỊ TRƯỜNG' }
                      ].map((type) => (
                        <button
                          key={type.key}
                          onClick={() => setOrderCondition(type.key as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${orderCondition === type.key
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nhập giá */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      Giá mỗi Tín chỉ
                    </label>
                    <div className="relative">
                        {orderCondition === 'LIMIT' ? (
                            <>
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="w-full pl-10 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">USD</span>
                            </>
                        ) : (
                            <div className="w-full px-4 py-4 bg-gray-100 border border-gray-200 rounded-xl text-lg font-medium text-gray-500 flex items-center justify-between cursor-not-allowed">
                                <span>Giá Thị trường Tốt nhất</span>
                                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Nhập số lượng */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Package className="w-4 h-4 text-gray-400" />
                      Số lượng
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        step="1"
                        min="1"
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Tín chỉ</span>
                    </div>
                  </div>

                  {/* Thanh trượt % */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Số lượng %</span>
                      <span className="font-medium text-gray-700">{sliderValue}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderValue}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      step="25"
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-500"
                    />
                    <div className="flex justify-between">
                      {[0, 25, 50, 75, 100].map((val) => (
                        <button
                          key={val}
                          onClick={() => setSliderValue(val)}
                          className={`text-xs px-2 py-1 rounded-md transition-colors ${sliderValue === val
                              ? 'bg-green-100 text-green-700 font-medium'
                              : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tóm tắt lệnh */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Loại lệnh</span>
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        {orderCondition === 'MARKET' ? <Zap className="w-3 h-3 text-yellow-500" /> : null}
                        {orderCondition === 'MARKET' ? 'THỊ TRƯỜNG' : 'GIỚI HẠN'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Phí ước tính (0.1%)</span>
                      <span className="text-sm font-medium text-gray-700">--</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Tổng cộng (Ước tính)</span>
                      <span className={`text-xl font-bold ${tradeType === 'Buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {calculateTotal()}
                      </span>
                    </div>
                  </div>

                  {/* Nút đặt lệnh */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || !amount || (orderCondition === 'LIMIT' && !price)}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${tradeType === 'Buy'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        {tradeType === 'Buy' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        {tradeType === 'Buy' ? 'Mua' : 'Bán'} {orderCondition === 'MARKET' ? 'với Giá Thị trường' : 'với Giá Giới hạn'}
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Shield className="w-3 h-3" />
                    <span>Được bảo mật bởi công nghệ blockchain</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cột phải: Sổ lệnh & Giao dịch gần đây */}
        <div className="xl:col-span-4 space-y-6">
          <OrderBook creditId={selectedCreditId} />
          <RecentTrades creditId={selectedCreditId} maxTrades={15} />
        </div>
      </div>
    </div>
  );
};

export default CryptoMarket;