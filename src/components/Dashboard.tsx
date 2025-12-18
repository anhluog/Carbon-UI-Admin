import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Leaf, Award, Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface DashboardProps {
  walletAddress: string;
}

const Dashboard: React.FC<DashboardProps> = ({ walletAddress }) => {
  const stats = [
    {
      name: 'Total CCT Balance',
      value: '1,250.45',
      change: '+12.5%',
      changeType: 'increase',
      icon: Leaf,
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Portfolio Value',
      value: '$2,875.20',
      change: '+8.2%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Credits Offset',
      value: '325.8 tCO₂',
      change: '+15.3%',
      changeType: 'increase',
      icon: Award,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Active Trades',
      value: '7',
      change: '-2',
      changeType: 'decrease',
      icon: Activity,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const recentTransactions = [
    {
      type: 'buy',
      amount: '50.0 CCT',
      value: '$115.50',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      type: 'sell',
      amount: '25.0 CCT',
      value: '$57.75',
      time: '1 day ago',
      status: 'completed'
    },
    {
      type: 'mint',
      amount: '100.0 CCT',
      value: '$231.00',
      time: '3 days ago',
      status: 'completed'
    },
    {
      type: 'transfer',
      amount: '15.0 CCT',
      value: '$34.65',
      time: '1 week ago',
      status: 'completed'
    }
  ];

  const topProjects = [
    {
      name: 'Amazon Rainforest Conservation',
      credits: '450.2 tCO₂',
      price: '$2.31/CCT',
      change: '+5.2%'
    },
    {
      name: 'Solar Energy Project Thailand',
      credits: '280.5 tCO₂',
      price: '$2.45/CCT',
      change: '+3.8%'
    },
    {
      name: 'Wind Farm Development Mexico',
      credits: '190.8 tCO₂',
      price: '$2.28/CCT',
      change: '+1.9%'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'buy' ? 'bg-green-100 text-green-600' :
                    transaction.type === 'sell' ? 'bg-red-100 text-red-600' :
                    transaction.type === 'mint' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {transaction.type === 'buy' ? <ArrowDownLeft className="h-5 w-5" /> :
                     transaction.type === 'sell' ? <ArrowUpRight className="h-5 w-5" /> :
                     transaction.type === 'mint' ? <Leaf className="h-5 w-5" /> :
                     <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{transaction.type}</p>
                    <p className="text-sm text-gray-500">{transaction.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{transaction.amount}</p>
                  <p className="text-sm text-gray-500">{transaction.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Projects */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Carbon Projects</h3>
          <div className="space-y-4">
            {topProjects.map((project, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{project.name}</h4>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {project.change}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{project.credits}</p>
                  <p className="text-sm font-medium text-gray-900">{project.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carbon Footprint Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Carbon Impact Over Time</h3>
        <div className="h-64 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl flex items-center justify-center border border-green-100">
          <div className="text-center">
            <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">325.8 tCO₂ Offset</p>
            <p className="text-sm text-gray-600">Equivalent to planting 412 trees</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;