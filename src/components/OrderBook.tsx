import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/axiosInstance';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

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

const OrderBook: React.FC<OrderBookProps> = ({ creditId }) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ✅ Use useCallback to memoize function
  const loadOrderBook = useCallback(async () => {
    // ✅ Validation: Stop if creditId is invalid
    if (!creditId || creditId === 'undefined' || creditId === 'null') {
      console.warn('⚠️ OrderBook: Invalid creditId, skipping load');
      setError('Invalid credit ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Loading orderbook for creditId:', creditId);

      const response = await api.get(`/orders/snapshot/${creditId}`);
      
      // Transform data from API to OrderBook format
      const data = response.data;
      
      // Process bids (buy orders) - sorted by price DESC
      const bidsArray: OrderLevel[] = [];
      let bidTotal = 0;
      
      if (data.bids && Array.isArray(data.bids)) {
        data.bids.forEach((bid: any) => {
          bidTotal += bid.amount;
          bidsArray.push({
            price: bid.price,
            size: bid.amount,
            total: bidTotal
          });
        });
      }

      // Process asks (sell orders) - sorted by price ASC
      const asksArray: OrderLevel[] = [];
      let askTotal = 0;
      
      if (data.asks && Array.isArray(data.asks)) {
        data.asks.forEach((ask: any) => {
          askTotal += ask.amount;
          asksArray.push({
            price: ask.price,
            size: ask.amount,
            total: askTotal
          });
        });
      }

      setOrderBook({
        creditId: creditId,
        bids: bidsArray,
        asks: asksArray,
        lastUpdate: new Date().toISOString()
      });

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load order book:', error);
      if (error.response?.status === 404) {
        setError('No orderbook found. Be the first to place an order!');
      } else if (error.response?.status === 403) {
        setError('Access denied. Please check permissions.');
      } else {
        setError('Failed to load orderbook');
      }
      setLoading(false);
    }
  }, [creditId]); // ✅ Only re-create when creditId changes

  useEffect(() => {
    // ✅ Skip if invalid creditId
    if (!creditId || creditId === 'undefined' || creditId === 'null') {
      console.warn('⚠️ OrderBook mounted with invalid creditId:', creditId);
      setError('Invalid credit ID');
      return;
    }

    // Initial load
    loadOrderBook();

    // ✅ Auto refresh with longer interval (5 seconds instead of 2)
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        loadOrderBook();
      }, 500000); // ✅ Changed from 2000ms to 5000ms
      
      console.log('🔄 Auto-refresh enabled for creditId:', creditId);
    }

    // ✅ Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
        console.log('🛑 Auto-refresh stopped for creditId:', creditId);
      }
    };
  }, [creditId, autoRefresh, loadOrderBook]); // ✅ Include loadOrderBook in dependencies

  const getVolumeBarWidth = (total: number, maxTotal: number): number => {
    if (maxTotal === 0) return 0;
    return (total / maxTotal) * 100;
  };

  // ✅ Early return if invalid creditId
  if (!creditId || creditId === 'undefined' || creditId === 'null') {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">⚠️ Invalid Credit ID</p>
          <p className="text-sm text-gray-500">
            Please select a valid carbon credit to view the orderbook.
          </p>
        </div>
      </div>
    );
  }

  const maxBidTotal = orderBook?.bids[orderBook.bids.length - 1]?.total || 0;
  const maxAskTotal = orderBook?.asks[orderBook.asks.length - 1]?.total || 0;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  const spreadPrice = orderBook && orderBook.asks.length > 0 && orderBook.bids.length > 0
    ? orderBook.asks[0].price - orderBook.bids[0].price
    : 0;

  const spreadPercent = orderBook && orderBook.bids.length > 0 && spreadPrice > 0
    ? (spreadPrice / orderBook.bids[0].price) * 100
    : 0;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <span>📊 Order Book</span>
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-green-600" />}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
            title={autoRefresh ? 'Auto-refresh every 5 seconds' : 'Manual refresh only'}
          >
            {autoRefresh ? '🟢 Auto (5s)' : '⚪ Manual'}
          </button>
          <button
            onClick={loadOrderBook}
            disabled={loading}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadOrderBook}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Order Book Data */}
      {!error && orderBook && (
        <>
          {/* Spread Info */}
          {spreadPrice > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spread:</span>
                <span className="font-medium text-gray-900">
                  ${spreadPrice.toFixed(2)} ({spreadPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Bids (Buy Orders) */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="text-lg font-semibold text-green-600">Bids (Buy)</h4>
              </div>
              
              {orderBook.bids.length > 0 ? (
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
                    <div>Price (USD)</div>
                    <div className="text-right">Size</div>
                    <div className="text-right">Total</div>
                  </div>
                  {orderBook.bids.slice(0, 10).map((bid, index) => ( // ✅ Limit to top 10
                    <div key={index} className="relative">
                      {/* Volume bar */}
                      <div
                        className="absolute inset-0 bg-green-100 opacity-30 rounded"
                        style={{
                          width: `${getVolumeBarWidth(bid.total, maxTotal)}%`,
                        }}
                      />
                      {/* Data */}
                      <div className="relative grid grid-cols-3 gap-2 py-1.5 px-2 hover:bg-green-50 rounded transition-colors">
                        <div className="text-green-600 font-medium">
                          ${bid.price.toFixed(2)}
                        </div>
                        <div className="text-right text-gray-700">
                          {bid.size.toLocaleString()}
                        </div>
                        <div className="text-right text-gray-500 text-sm">
                          {bid.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {orderBook.bids.length > 10 && (
                    <div className="text-center text-xs text-gray-400 pt-2">
                      +{orderBook.bids.length - 10} more orders
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No buy orders
                </div>
              )}
            </div>

            {/* Asks (Sell Orders) */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h4 className="text-lg font-semibold text-red-600">Asks (Sell)</h4>
              </div>
              
              {orderBook.asks.length > 0 ? (
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
                    <div>Price (USD)</div>
                    <div className="text-right">Size</div>
                    <div className="text-right">Total</div>
                  </div>
                  {orderBook.asks.slice(0, 10).map((ask, index) => ( // ✅ Limit to top 10
                    <div key={index} className="relative">
                      {/* Volume bar */}
                      <div
                        className="absolute inset-0 bg-red-100 opacity-30 rounded"
                        style={{
                          width: `${getVolumeBarWidth(ask.total, maxTotal)}%`,
                        }}
                      />
                      {/* Data */}
                      <div className="relative grid grid-cols-3 gap-2 py-1.5 px-2 hover:bg-red-50 rounded transition-colors">
                        <div className="text-red-600 font-medium">
                          ${ask.price.toFixed(2)}
                        </div>
                        <div className="text-right text-gray-700">
                          {ask.size.toLocaleString()}
                        </div>
                        <div className="text-right text-gray-500 text-sm">
                          {ask.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {orderBook.asks.length > 10 && (
                    <div className="text-center text-xs text-gray-400 pt-2">
                      +{orderBook.asks.length - 10} more orders
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No sell orders
                </div>
              )}
            </div>
          </div>

          {/* Last Update */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            Last updated: {new Date(orderBook.lastUpdate).toLocaleTimeString()}
          </div>
        </>
      )}

      {/* Loading State */}
      {!error && !orderBook && loading && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading orderbook...</p>
        </div>
      )}
    </div>
  );
};

export default OrderBook;