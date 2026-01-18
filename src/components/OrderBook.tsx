import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/axiosInstance';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Client } from '@stomp/stompjs';

const SOCKET_URL = 'ws://localhost:8080/ws';

interface OrderBookProps {
  creditId: string;
}

interface OrderLevel {
  price: number;
  size: number;
  total: number;
}

interface OrderBookData {
  creditId: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  lastUpdate: string;
}

// Helper to calculate accumulated totals
const processOrderLevels = (rawLevels: any[], isBid: boolean): OrderLevel[] => {
  if (!rawLevels || !Array.isArray(rawLevels)) return [];

  const levels: OrderLevel[] = [];
  let total = 0;

  // Clone and sort
  // Bids: High to Low
  // Asks: Low to High
  const sorted = [...rawLevels].sort((a, b) => isBid ? b.price - a.price : a.price - b.price);

  sorted.forEach((item) => {
    total += item.amount;
    levels.push({ price: item.price, size: item.amount, total: total });
  });

  return levels;
};

const OrderBook: React.FC<OrderBookProps> = ({ creditId }) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const stompClientRef = useRef<Client | null>(null);

  // 1. Initial REST Load (Snapshot)
  const loadOrderBookSnapshot = useCallback(async () => {
    if (!creditId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/orders/snapshot/${creditId}`);
      const data = response.data;

      setOrderBook({
        creditId: creditId,
        bids: processOrderLevels(data.bids, true),
        asks: processOrderLevels(data.asks, false),
        lastUpdate: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn('⚠️ Snapshot failed, waiting for WebSocket:', err.message);
      // Không set error - WebSocket sẽ cung cấp data
    } finally {
      setLoading(false);
    }
  }, [creditId]);

  // 2. WebSocket Connection
  useEffect(() => {
    if (!creditId) return;

    // Load initial snapshot first
    loadOrderBookSnapshot();
    
    // Setup STOMP Client - Native WebSocket (không dùng SockJS)
    const client = new Client({
      brokerURL: SOCKET_URL,  // ← DÙNG brokerURL thay vì webSocketFactory
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        console.log('🟢 Connected to OrderBook WS');
        // Subscribe to specific credit topic
        client.subscribe(`/topic/orderbook/${creditId}`, (message) => {
          if (message.body) {
            const update = JSON.parse(message.body);

            // Recalculate totals on the fly
            setOrderBook({
              creditId: creditId,
              bids: processOrderLevels(update.bids, true),
              asks: processOrderLevels(update.asks, false),
              lastUpdate: new Date().toISOString()
            });
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('🔴 Disconnected from OrderBook WS');
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        setError('Real-time connection failed');
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
  }, [creditId, loadOrderBookSnapshot]);

  const getVolumeBarWidth = (total: number, maxTotal: number): number => {
    if (maxTotal === 0) return 0;
    return (total / maxTotal) * 100;
  };

  if (!creditId) return null;

  const maxBidTotal = orderBook?.bids[orderBook.bids.length - 1]?.total || 0;
  const maxAskTotal = orderBook?.asks[orderBook.asks.length - 1]?.total || 0;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  const bestBid = orderBook?.bids[0]?.price || 0;
  const bestAsk = orderBook?.asks[0]?.price || 0;
  const spreadPrice = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPercent = bestBid > 0 ? (spreadPrice / bestBid) * 100 : 0;

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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-600" />
          <span> Order Book</span>
        </h3>
      </div>
      {/* Error */}
      {error && (
        <div className="text-center py-4 bg-red-50 rounded-lg mb-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {/* Content */}
      {orderBook ? (
        <>
          {/* Spread */}
          {spreadPrice > 0 && (
            <div className="flex justify-center items-center space-x-2 mb-4 text-xs font-medium text-gray-500 bg-gray-50 py-1 rounded-md">
              <span>Spread: <span className="text-gray-900">${spreadPrice.toFixed(2)}</span></span>
              <span>({spreadPercent.toFixed(2)}%)</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">

            {/* BIDS */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">Buy Orders</span>
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="grid grid-cols-3 text-[10px] text-gray-400 font-medium px-2 mb-1">
                  <span>Price</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Total</span>
                </div>

                {orderBook.bids.length === 0 && <div className="text-center text-xs text-gray-400 py-4">No Bids</div>}
                {orderBook.bids.map((bid, i) => (
                  <div key={i} className="relative group cursor-default">
                    {/* Bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-green-100/50 transition-all duration-300"
                      style={{ width: `${getVolumeBarWidth(bid.total, maxTotal)}%` }}
                    />

                    <div className="relative grid grid-cols-3 text-xs py-1.5 px-2 hover:bg-green-50/80 transition-colors">
                      <span className="text-green-700 font-mono font-medium">${bid.price.toFixed(2)}</span>
                      <span className="text-right text-gray-700">{bid.size}</span>
                      <span className="text-right text-gray-400">{bid.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* ASKS */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-100">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-gray-700">Sell Orders</span>
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="grid grid-cols-3 text-[10px] text-gray-400 font-medium px-2 mb-1">
                  <span>Price</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Total</span>
                </div>
                {orderBook.asks.length === 0 && <div className="text-center text-xs text-gray-400 py-4">No Asks</div>}
                {orderBook.asks.map((ask, i) => (
                  <div key={i} className="relative group cursor-default">
                    {/* Bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-red-100/50 transition-all duration-300"
                      style={{ width: `${getVolumeBarWidth(ask.total, maxTotal)}%` }}
                    />

                    <div className="relative grid grid-cols-3 text-xs py-1.5 px-2 hover:bg-red-50/80 transition-colors">
                      <span className="text-red-700 font-mono font-medium">${ask.price.toFixed(2)}</span>
                      <span className="text-right text-gray-700">{ask.size}</span>
                      <span className="text-right text-gray-400">{ask.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        // Loading Skeleton
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-50 rounded"></div>
            <div className="h-32 bg-gray-50 rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderBook;