import React, { useState } from 'react';
import OrderBook from './OrderBook';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, LineChart } from 'recharts';

// Component for recent trades
const RecentTrades: React.FC = () => {
  const trades = [
    { time: '10:25:31', price: 2.33, amount: 50, type: 'buy' },
    { time: '10:25:28', price: 2.34, amount: 20, type: 'sell' },
    { time: '10:25:25', price: 2.33, amount: 100, type: 'buy' },
    { time: '10:25:22', price: 2.35, amount: 70, type: 'sell' },
    { time: '10:25:19', price: 2.32, amount: 30, type: 'buy' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Trades</h3>
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
            <tr key={index} className={`text-left font-medium`}>
              <td className={trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}>{trade.price.toFixed(2)}</td>
              <td>{trade.amount}</td>
              <td>{trade.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced component for trade history with filtering
const TradeHistory: React.FC = () => {
  const [historyFilter, setHistoryFilter] = useState<'Buys' | 'Sells'>('Buys');
  const [allHistory, setAllHistory] = useState([
    { id: 1, type: 'Buy', amount: 25.5, price: 2.31, time: '2024-05-20 10:15:45' },
    { id: 2, type: 'Sell', amount: 10.0, price: 2.38, time: '2024-05-19 18:30:12' },
    { id: 3, type: 'Buy', amount: 50.2, price: 2.25, time: '2024-05-18 09:45:33' },
    { id: 4, type: 'Sell', amount: 15.8, price: 2.32, time: '2024-05-17 14:22:01' },
    { id: 5, type: 'Buy', amount: 100.0, price: 2.15, time: '2024-05-16 21:10:59' },
  ]);

  const filteredHistory = allHistory.filter(trade => {
    if (historyFilter === 'Buys') return trade.type === 'Buy';
    if (historyFilter === 'Sells') return trade.type === 'Sell';
    return false;
  });

  const cancelTrade = (id: number) => {
    setAllHistory(allHistory.filter(trade => trade.id !== id));
  };

  return (
    <div>
        <div className="flex mb-4 border-b">
            <button onClick={() => setHistoryFilter('Buys')} className={`flex-1 py-2 text-center font-semibold ${historyFilter === 'Buys' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>Buys</button>
            <button onClick={() => setHistoryFilter('Sells')} className={`flex-1 py-2 text-center font-semibold ${historyFilter === 'Sells' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}>Sells</button>
        </div>
        <div className="h-72 overflow-y-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-gray-500">
                        <th>Type</th>
                        <th>Amount (NVQ)</th>
                        <th>Price (USD)</th>
                        <th>Time</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredHistory.map((trade) => (
                        <tr key={trade.id} className="text-left font-medium">
                            <td className={trade.type === 'Buy' ? 'text-green-600' : 'text-red-600'}>{trade.type}</td>
                            <td>{trade.amount}</td>
                            <td>{trade.price}</td>
                            <td className="text-gray-500 text-xs">{trade.time}</td>
                            <td><button onClick={() => cancelTrade(trade.id)} className='text-red-500'>Cancel</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  )
};

const projectData = [
  { type: 'Forestry', count: 120 },
  { type: 'Renewable Energy', count: 250 },
  { type: 'Methane Capture', count: 80 },
  { type: 'Energy Efficiency', count: 150 },
];

const ProjectDistributionChart: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Projects by Type</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={projectData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="type" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" name="Number of Projects" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const creditData = [
  { month: 'Jan', issued: 4000, retired: 2400 },
  { month: 'Feb', issued: 3000, retired: 1398 },
  { month: 'Mar', issued: 2000, retired: 9800 },
  { month: 'Apr', issued: 2780, retired: 3908 },
  { month: 'May', issued: 1890, retired: 4800 },
  { month: 'Jun', issued: 2390, retired: 3800 },
];

const IssuedCreditsChart: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Issued vs. Retired Credits</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={creditData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="issued" fill="#82ca9d" name="Issued" />
        <Bar dataKey="retired" fill="#d88484" name="Retired" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const transactionData = [
  { date: '2024-05-01', transactions: 150, volume: 12000 },
  { date: '2024-05-02', transactions: 200, volume: 15000 },
  { date: '2024-05-03', transactions: 180, volume: 13000 },
  { date: '2024-05-04', transactions: 220, volume: 18000 },
  { date: '2024-05-05', transactions: 250, volume: 20000 },
];

const TransactionVolumeChart: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Volume</h3>
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={transactionData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" name="Transactions" />
        <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#82ca9d" name="Credits Traded" />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

const creditsOverTimeData = [
  { date: '2024-01', credits: 5000 },
  { date: '2024-02', credits: 5200 },
  { date: '2024-03', credits: 6000 },
  { date: '2024-04', credits: 5800 },
  { date: '2024-05', credits: 6500 },
];

const CreditsOverTimeChart: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Credits Over Time</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={creditsOverTimeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="credits" stroke="#8884d8" name="Total Credits" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const priceByProjectData = [
  { date: 'Jan', Forestry: 2.5, 'Renewable Energy': 3.0, 'Methane Capture': 1.8 },
  { date: 'Feb', Forestry: 2.6, 'Renewable Energy': 3.2, 'Methane Capture': 1.9 },
  { date: 'Mar', Forestry: 2.8, 'Renewable Energy': 3.1, 'Methane Capture': 2.0 },
  { date: 'Apr', Forestry: 2.7, 'Renewable Energy': 3.3, 'Methane Capture': 2.1 },
  { date: 'May', Forestry: 2.9, 'Renewable Energy': 3.4, 'Methane Capture': 2.2 },
];

const PriceByProjectTypeChart: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Price by Project Type</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={priceByProjectData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Forestry" stroke="#8884d8" />
        <Line type="monotone" dataKey="Renewable Energy" stroke="#82ca9d" />
        <Line type="monotone" dataKey="Methane Capture" stroke="#ffc658" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const topProjectsData = [
  { name: 'Amazon Rainforest Conservation', reduction: 50000 },
  { name: 'Gobi Desert Solar Farm', reduction: 45000 },
  { name: 'Midwest Wind Turbines', reduction: 40000 },
  { name: 'Siberian Permafrost Methane Capture', reduction: 35000 },
  { name: 'Appalachian Coal Mine Reforestation', reduction: 30000 },
];

const TopProjectsChart: React.FC = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Emission Reduction Projects</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={topProjectsData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={150} />
        <Tooltip />
        <Legend />
        <Bar dataKey="reduction" fill="#82ca9d" name="CO2 Reduction (tons)" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);


const CryptoMarket: React.FC = () => {
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell' | 'History'>('Buy');
  const [activeChartTab, setActiveChartTab] = useState('project');

  const chartData = [
    { time: '10:00', price: 2.30, volume: 1200 },
    { time: '10:05', price: 2.32, volume: 1500 },
    { time: '10:10', price: 2.31, volume: 1100 },
    { time: '10:15', price: 2.34, volume: 1800 },
    { time: '10:20', price: 2.35, volume: 1600 },
    { time: '10:25', price: 2.33, volume: 1400 },
  ];

  const renderCharts = () => {
    switch (activeChartTab) {
      case 'project':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProjectDistributionChart />
            <TopProjectsChart />
          </div>
        );
      case 'credits':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IssuedCreditsChart />
            <CreditsOverTimeChart />
          </div>
        );
      case 'market':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TransactionVolumeChart />
            <PriceByProjectTypeChart />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Center Column: Chart and Trade Form */}
      <div className="lg:col-span-9 space-y-4">
        {/* Main Chart Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">NVQ/USD</h3>
            <span className="text-2xl font-bold text-green-600 ml-4">2.35</span>
            <div className="ml-4 text-sm">
                <p className="text-gray-500">24h Change</p>
                <p className="text-green-600 font-semibold">+0.05 (2.17%)</p>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="time" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <YAxis yAxisId="left" orientation="left" stroke="#413ea0" domain={[0, 'dataMax + 500']}/>
                <Tooltip />
                <Legend />
                <Bar dataKey="volume" yAxisId="left" barSize={20} fill="#413ea0" name="Volume" />
                <Line type="monotone" dataKey="price" yAxisId="right" stroke="#82ca9d" strokeWidth={2} dot={false} name="Price"/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trading Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex mb-4 border-b">
            <button onClick={() => setTradeType('Buy')} className={`flex-1 py-2 text-center font-semibold ${tradeType === 'Buy' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-600'}`}>Buy</button>
            <button onClick={() => setTradeType('Sell')} className={`flex-1 py-2 text-center font-semibold ${tradeType === 'Sell' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-red-600'}`}>Sell</button>
            <button onClick={() => setTradeType('History')} className={`flex-1 py-2 text-center font-semibold ${tradeType === 'History' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>History</button>
          </div>

          {tradeType === 'History' ? (
            <TradeHistory />
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                  <div className="flex text-sm">
                    <button className="py-1 px-3 bg-gray-200 text-gray-800 rounded-md">Limit</button>
                    <button className="py-1 px-3 text-gray-500 ml-2">Market</button>
                  </div>
                  <p className="text-sm text-gray-500">Wallet: $1,250.00</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-500">Price (USD)</label>
                  <input type="text" id="price" defaultValue="2.35" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-500">Amount (NVQ)</label>
                  <input type="text" id="amount" placeholder="0.00" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                </div>
                <div className="space-y-2 pt-1">
                    <input id="amount-slider" type="range" min="0" max="100" defaultValue="0" step="25" className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer range-sm" />
                    <ul className="flex justify-between w-full px-1 text-xs text-gray-500">
                        <li>0%</li><li>25%</li><li>50%</li><li>75%</li><li>100%</li>
                    </ul>
                </div>

                <div className="flex justify-between text-sm text-gray-500">
                    <span>Total</span>
                    <span>0.00 USD</span>
                </div>

                <button className={`w-full text-white px-4 py-3 rounded-lg font-semibold text-lg ${tradeType === 'Buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {tradeType} NVQ
                </button>
              </div>
            </>
          )}
        </div>
         <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex mb-4 border-b">
            <button onClick={() => setActiveChartTab('project')} className={`flex-1 py-2 text-center font-semibold ${activeChartTab === 'project' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-600'}`}>Project Analysis</button>
            <button onClick={() => setActiveChartTab('credits')} className={`flex-1 py-2 text-center font-semibold ${activeChartTab === 'credits' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-600'}`}>Credit Lifecycle</button>
            <button onClick={() => setActiveChartTab('market')} className={`flex-1 py-2 text-center font-semibold ${activeChartTab === 'market' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-green-600'}`}>Market Data</button>
          </div>
          {renderCharts()}
        </div>
      </div>

      {/* Right Column: Order Book and Recent Trades */}
      <div className="lg:col-span-3 space-y-4">
        <OrderBook />
        <RecentTrades />
      </div>
    </div>
  );
};

export default CryptoMarket;
