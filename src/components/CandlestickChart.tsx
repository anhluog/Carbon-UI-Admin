import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  Time,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts';
import { Client } from '@stomp/stompjs';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import api from '../utils/axiosInstance';

const SOCKET_URL = 'ws://localhost:8081/ws';

interface CandlestickChartProps {
  creditId: string;
}

interface PriceStats {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const CandlestickChart: React.FC<CandlestickChartProps> = ({ creditId }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCloseRef = useRef<number>(0);

  const [timeFrame, setTimeFrame] = useState<TimeFrame>('15m');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priceStats, setPriceStats] = useState<PriceStats>({
    currentPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    high24h: 0,
    low24h: 0,
    volume24h: 0
  });

  const getIntervalSeconds = useCallback((tf: TimeFrame): number => {
    switch (tf) {
      case '1m': return 60;
      case '5m': return 300;
      case '15m': return 900;
      case '1h': return 3600;
      case '4h': return 14400;
      case '1d': return 86400;
      default: return 900;
    }
  }, []);

  // ✅ Load dữ liệu THỰC từ API
  const loadRealData = useCallback(async () => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !creditId) return;

    setLoading(true);

    try {
      const response = await api.get(`/market/ohlc/${creditId}`, {
        params: { timeframe: timeFrame, limit: 100 }
      });

      const { candles, stats } = response.data;

      if (candles && candles.length > 0) {
        // Chuyển đổi dữ liệu từ API
        const candleData = candles.map((c: any) => ({
          time: Math.floor(c.timestamp / 1000) as Time, // <-- ensure seconds
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
        }));

        const volumeData = candles.map((c: any) => ({
          time: c.timestamp as Time,
          value: c.volume,
          color: parseFloat(c.close) >= parseFloat(c.open)
            ? 'rgba(34, 197, 94, 0.5)'
            : 'rgba(239, 68, 68, 0.5)',
        }));

        candlestickSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);

        // đặt giá hiện tại từ last candle
        const lastClose = candleData[candleData.length - 1]?.close ?? 0;
        setPriceStats(prev => ({ ...prev, currentPrice: lastClose }));
        lastCloseRef.current = lastClose;

        chartRef.current?.timeScale().fitContent();
        console.log('✅ Loaded', candles.length, 'candles from API');
      } else {
        console.warn('⚠️ No candle data from API');
      }
    } catch (error) {
      console.error('❌ Failed to load OHLC data:', error);
      // Có thể hiển thị message "No data available"
    } finally {
      setLoading(false);
    }
  }, [creditId, timeFrame]);

  // Khởi tạo chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
        vertLine: { width: 1, color: '#9B7DFF', style: 2 },
        horzLine: { width: 1, color: '#9B7DFF', style: 2 },
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // ✅ Load dữ liệu khi chart ready hoặc đổi timeframe
  useEffect(() => {
    if (candlestickSeriesRef.current && volumeSeriesRef.current) {
      loadRealData();
    }
  }, [timeFrame, loadRealData]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!creditId) return;

    const client = new Client({
      brokerURL: SOCKET_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        console.log('🟢 Connected to Price WS');

        client.subscribe(`/topic/price/${creditId}`, (message) => {
          if (message.body) {
            const priceUpdate = JSON.parse(message.body);
            console.log('💲 Price update:', priceUpdate);
            updateLastCandle(
              parseFloat(priceUpdate.price),
              priceUpdate.volume || 0
            );
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('🔴 Disconnected from Price WS');
      },
      onStompError: (frame) => {
        console.error('Broker error:', frame.headers['message']);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
      }
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [creditId]);

  // Update last candle with new price from WebSocket
  const updateLastCandle = (newPrice: number, volume: number) => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const now = Math.floor(Date.now() / 1000);
    const interval = getIntervalSeconds(timeFrame);
    const candleTime = (Math.floor(now / interval) * interval) as Time;

    const previousPrice = lastCloseRef.current || newPrice;

    candlestickSeriesRef.current.update({
      time: candleTime,
      open: previousPrice,
      high: Math.max(previousPrice, newPrice),
      low: Math.min(previousPrice, newPrice),
      close: newPrice,
    });

    volumeSeriesRef.current.update({
      time: candleTime,
      value: volume,
      color: newPrice >= previousPrice
        ? 'rgba(34, 197, 94, 0.5)'
        : 'rgba(239, 68, 68, 0.5)',
    });

    setPriceStats(prev => {
      const change = newPrice - (prev.currentPrice || newPrice);
      const changePercent = prev.currentPrice > 0
        ? (change / prev.currentPrice) * 100
        : 0;

      lastCloseRef.current = newPrice;

      return {
        currentPrice: newPrice,
        priceChange: change,
        priceChangePercent: changePercent,
        high24h: Math.max(prev.high24h, newPrice),
        low24h: prev.low24h === 0 ? newPrice : Math.min(prev.low24h, newPrice),
        volume24h: prev.volume24h + volume,
      };
    });
  };

  const timeFrames: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
  const isPositive = priceStats.priceChange >= 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Carbon Credit #{creditId}</span>
                {isConnected ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    CONNECTING
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-bold text-gray-900">
                  ${priceStats.currentPrice.toFixed(2)}
                </span>
                {priceStats.currentPrice > 0 && (
                  <span className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? '+' : ''}{priceStats.priceChange.toFixed(2)}
                    ({isPositive ? '+' : ''}{priceStats.priceChangePercent.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>

            {priceStats.currentPrice > 0 && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div>
                  <p className="text-gray-400">24h High</p>
                  <p className="font-semibold text-green-600">${priceStats.high24h.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">24h Low</p>
                  <p className="font-semibold text-red-600">${priceStats.low24h.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">24h Volume</p>
                  <p className="font-semibold text-gray-700">{priceStats.volume24h.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {timeFrames.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFrame === tf
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" style={{ height: '400px' }} />
      </div>

      {/* Mobile Stats */}
      {priceStats.currentPrice > 0 && (
        <div className="md:hidden p-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-400 text-xs">24h High</p>
              <p className="font-semibold text-green-600">${priceStats.high24h.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">24h Low</p>
              <p className="font-semibold text-red-600">${priceStats.low24h.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Volume</p>
              <p className="font-semibold text-gray-700">{priceStats.volume24h.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;