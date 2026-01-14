import React, { useState, useEffect } from 'react';
import OrderBook from './OrderBook';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, LineChart } from 'recharts';
import api from '../utils/axiosInstance';
import { DollarSign, Package, AlertCircle } from 'lucide-react';

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

// Component for recent trades
const RecentTrades: React.FC<{ creditId: string }> = ({ creditId }) => {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentTrades();
    const interval = setInterval(loadRecentTrades, 3000);
    return () => clearInterval(interval);
  }, [creditId]);

  const loadRecentTrades = async () => {
    if (!creditId) return;
    
    try {
      setLoading(true);
      // TODO: Implement /api/trades/recent/{creditId} endpoint
      // const response = await axios.get(`http://localhost:8080/api/trades/recent/${creditId}`);
      // setTrades(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load recent trades:', error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Trades</h3>
      {trades.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th>Price (USD)</th>
              <th>Amount</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr key={index} className="text-left font-medium">
                <td className={trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                  ${trade.price.toFixed(2)}
                </td>
                <td>{trade.amount}</td>
                <td className="text-xs text-gray-500">{trade.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-400 text-sm py-8">No recent trades</p>
      )}
    </div>
  );
};

// Trade History Component
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
        params: {
          creditId: creditId
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const filtered = response.data.filter((order: Order) => 
        order.orderType === filter
      );
      
      setOrders(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      
      await api.delete(`/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      alert('✅ Order cancelled successfully');
      loadOrders();
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      alert(`❌ ${error.response?.data?.message || 'Failed to cancel order'}`);
    }
  };

  return (
    <div>
      <div className="flex mb-4 border-b">
        <button 
          onClick={() => setFilter('BUY')} 
          className={`flex-1 py-2 text-center font-semibold ${
            filter === 'BUY' 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-gray-500'
          }`}
        >
          Buy Orders
        </button>
        <button 
          onClick={() => setFilter('SELL')} 
          className={`flex-1 py-2 text-center font-semibold ${
            filter === 'SELL' 
              ? 'text-red-600 border-b-2 border-red-600' 
              : 'text-gray-500'
          }`}
        >
          Sell Orders
        </button>
      </div>

      <div className="h-72 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : orders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th>Type</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="text-left font-medium">
                  <td className={order.orderType === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                    {order.orderType}
                  </td>
                  <td>{order.amount}</td>
                  <td>${order.price.toFixed(2)}</td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'FILLED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {(order.status === 'OPEN' || order.status === 'PENDING') && (
                      <button 
                        onClick={() => cancelOrder(order.id)} 
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-400 py-8">No {filter.toLowerCase()} orders</p>
        )}
      </div>
    </div>
  );
};

// Main CryptoMarket Component
const CryptoMarket: React.FC<CryptoMarketProps> = ({ walletAddress, creditId }) => {
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell' | 'History'>('Buy');
  const [selectedCreditId, setSelectedCreditId] = useState<string>(creditId || '');
  
  // Order form state
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [orderCondition, setOrderCondition] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [sliderValue, setSliderValue] = useState(0);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (creditId) {
      setSelectedCreditId(creditId);
    }
  }, [creditId]);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    // TODO: Calculate amount based on wallet balance and slider value
    // const maxAmount = walletBalance / price;
    // setAmount(((maxAmount * value) / 100).toFixed(2));
  };

  const calculateTotal = () => {
    const p = parseFloat(price) || 0;
    const a = parseFloat(amount) || 0;
    return (p * a).toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (!selectedCreditId) {
      alert('⚠️ Please select a carbon credit');
      return;
    }

    if (!price || !amount) {
      alert('⚠️ Please enter price and amount');
      return;
    }

    console.log('Placing order with:', { price, amount });

    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('⚠️ Please enter a valid price');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      alert('⚠️ Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        alert('⚠️ Please login to place orders');
        setLoading(false);
        return;
      }
      
      console.log(priceNum);

      const response = await api.post(
        `/orders/place`,
        {
          creditId: selectedCreditId,
          orderType: tradeType === 'Buy' ? 'BUY' : 'SELL',
          orderCondition: orderCondition,
          price: priceNum,
          amount: amountNum
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(`✅ ${tradeType} order placed successfully!`);
      
      // Reset form
      setPrice('');
      setAmount('');
      setSliderValue(0);
      setLoading(false);

      // Switch to history tab to see the order
      setTradeType('History');

    } catch (error: any) {
      console.error('Failed to place order:', error);
      const errorMsg = error.response?.data?.message || 'Failed to place order';
      alert(`❌ ${errorMsg}`);
      setLoading(false);
    }
  };

  if (!selectedCreditId || selectedCreditId === 'undefined') {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Credit Selected</h3>
          <p className="text-gray-600">Please select a carbon credit from the marketplace to start trading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Center Column: Chart and Trade Form */}
      <div className="lg:col-span-9 space-y-4">
        {/* Credit Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trading Token</p>
              <p className="text-2xl font-bold text-gray-900">Credit #{selectedCreditId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Wallet</p>
              <p className="text-lg font-semibold text-gray-900">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
            </div>
          </div>
        </div>

        {/* Trading Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex mb-4 border-b">
            <button 
              onClick={() => setTradeType('Buy')} 
              className={`flex-1 py-2 text-center font-semibold ${
                tradeType === 'Buy' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:text-green-600'
              }`}
            >
              Buy
            </button>
            <button 
              onClick={() => setTradeType('Sell')} 
              className={`flex-1 py-2 text-center font-semibold ${
                tradeType === 'Sell' 
                  ? 'text-red-600 border-b-2 border-red-600' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              Sell
            </button>
            <button 
              onClick={() => setTradeType('History')} 
              className={`flex-1 py-2 text-center font-semibold ${
                tradeType === 'History' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              My Orders
            </button>
          </div>

          {tradeType === 'History' ? (
            <TradeHistory creditId={selectedCreditId} />
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex text-sm space-x-2">
                  <button 
                    onClick={() => setOrderCondition('LIMIT')}
                    className={`py-1 px-3 rounded-md ${
                      orderCondition === 'LIMIT'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    Limit
                  </button>
                  <button 
                    onClick={() => setOrderCondition('MARKET')}
                    className={`py-1 px-3 rounded-md ${
                      orderCondition === 'MARKET'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    Market
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {orderCondition === 'LIMIT' && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Price (USD)
                    </label>
                    <input 
                      type="number" 
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="inline h-4 w-4 mr-1" />
                    Amount (Credits)
                  </label>
                  <input 
                    type="number" 
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    step="1"
                    min="1"
                    className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <input 
                    id="amount-slider" 
                    type="range" 
                    min="0" 
                    max="100"
                    value={sliderValue}
                    onChange={(e) => handleSliderChange(Number(e.target.value))}
                    step="25" 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" 
                  />
                  <ul className="flex justify-between w-full px-1 text-xs text-gray-500">
                    <li>0%</li><li>25%</li><li>50%</li><li>75%</li><li>100%</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-gray-900">${calculateTotal()} USD</span>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading || !price || !amount}
                  className={`w-full text-white px-4 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    tradeType === 'Buy' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500' 
                      : 'bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500'
                  } disabled:cursor-not-allowed`}
                >
                  {loading ? 'Placing Order...' : `${tradeType} Credits`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Order Book and Recent Trades */}
      <div className="lg:col-span-3 space-y-4">
        <OrderBook creditId={selectedCreditId} />
        <RecentTrades creditId={selectedCreditId} />
      </div>
    </div>
  );
};

export default CryptoMarket;