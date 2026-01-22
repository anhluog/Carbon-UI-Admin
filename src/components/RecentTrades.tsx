import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { ArrowUpRight, ArrowDownRight, Zap, RefreshCw } from 'lucide-react';
import api from '../utils/axiosInstance';

const SOCKET_URL = 'ws://localhost:8080/ws';

interface RecentTradesProps {
  creditId?: string;
  maxTrades?: number;
}

interface Trade {
  tradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  creditId: string;
  amount: number;        
  price: number;
  totalValue: number;    
  tradeAt: string;       
}

const RecentTrades: React.FC<RecentTradesProps> = ({ 
  creditId, 
  maxTrades = 20 
}) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const stompClientRef = useRef<Client | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  // ✅ Load lịch sử trades từ API khi mount
  useEffect(() => {
    const loadHistoricalTrades = async () => {
      if (!creditId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await api.get(`/trades/recent/${creditId}`, {
          params: { limit: maxTrades }
        });
        
        if (response.data && Array.isArray(response.data)) {
          // Sắp xếp mới nhất lên đầu
          const sortedTrades = response.data.sort((a: Trade, b: Trade) => 
            new Date(b.tradeAt).getTime() - new Date(a.tradeAt).getTime()
          );
          setTrades(sortedTrades);
          
          if (sortedTrades.length > 0) {
            setLastPrice(sortedTrades[0].price);
          }
          console.log('✅ Loaded', sortedTrades.length, 'historical trades');
        }
      } catch (error) {
        console.warn('⚠️ Could not load historical trades:', error);
        // Không có API thì để trống, WebSocket sẽ cập nhật sau
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalTrades();
  }, [creditId, maxTrades]);

  // ✅ WebSocket cho trades real-time
  useEffect(() => {
    const client = new Client({
      brokerURL: SOCKET_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        console.log('🟢 Connected to Trades WS');

        const topic = creditId 
          ? `/topic/trades/${creditId}` 
          : '/topic/trades/all';

        client.subscribe(topic, (message) => {
          if (message.body) {
            const trade: Trade = JSON.parse(message.body);
            console.log('📊 Received trade:', trade);
            
            setTrades(prev => {
              // Kiểm tra trade đã tồn tại chưa (tránh duplicate)
              const exists = prev.some(t => t.tradeId === trade.tradeId);
              if (exists) return prev;
              
              const updated = [trade, ...prev];
              return updated.slice(0, maxTrades);
            });

            setLastPrice(trade.price);
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('🔴 Disconnected from Trades WS');
      },
      onStompError: (frame) => {
        console.error('Broker error:', frame.headers['message']);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [creditId, maxTrades]);

  const formatTime = (tradeAt: string) => {
    if (!tradeAt) return '--:--:--';
    const date = new Date(tradeAt);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getPriceChange = (currentPrice: number, index: number): 'up' | 'down' | 'neutral' => {
    if (index >= trades.length - 1) return 'neutral';
    const prevPrice = trades[index + 1]?.price;
    if (!prevPrice) return 'neutral';
    if (currentPrice > prevPrice) return 'up';
    if (currentPrice < prevPrice) return 'down';
    return 'neutral';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col relative">
      {/* Live Indicator */}
      {isConnected ? (
        <div className="absolute top-4 right-4 flex items-center space-x-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full animate-pulse border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>LIVE</span>
        </div>
      ) : (
        <div className="absolute top-4 right-4 flex items-center space-x-1 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span>CONNECTING...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span>Recent Trades</span>
        </h3>
        {lastPrice && (
          <div className="text-sm font-semibold text-gray-700">
            Last: <span className="text-green-600">${lastPrice.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-4 text-xs text-gray-400 font-medium px-2 py-2 border-b border-gray-100">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto max-h-80 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            Waiting for trades...
          </div>
        ) : (
          trades.map((trade, index) => {
            const priceDirection = getPriceChange(trade.price, index);
            
            return (
              <div 
                key={trade.tradeId || index}
                className={`grid grid-cols-4 text-xs py-2 px-2 hover:bg-gray-50 transition-colors ${
                  index === 0 ? 'animate-pulse bg-yellow-50' : ''
                }`}
              >
                {/* Price */}
                <div className="flex items-center space-x-1">
                  {priceDirection === 'up' && (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  )}
                  {priceDirection === 'down' && (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`font-mono font-medium ${
                    priceDirection === 'up' ? 'text-green-600' : 
                    priceDirection === 'down' ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    ${trade.price.toFixed(2)}
                  </span>
                </div>

                {/* Amount */}
                <span className="text-right text-gray-700">
                  {trade.amount}
                </span>

                {/* Total */}
                <span className="text-right text-gray-500">
                  ${trade.totalValue.toFixed(2)}
                </span>

                {/* Time */}
                <span className="text-right text-gray-400">
                  {formatTime(trade.tradeAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      {trades.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          <span>
            Total: <span className="font-medium text-gray-700">{trades.length}</span> trades
          </span>
          <span>
            Volume: <span className="font-medium text-gray-700">
              {trades.reduce((sum, t) => sum + t.amount, 0)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default RecentTrades;