import React from 'react';

const OrderBook: React.FC = () => {
  // Mock data for the order book
  const bids = [
    { price: 2.30, size: 1500, total: 1500 },
    { price: 2.29, size: 1200, total: 2700 },
    { price: 2.28, size: 1000, total: 3700 },
    { price: 2.27, size: 800, total: 4500 },
    { price: 2.26, size: 600, total: 5100 },
  ];

  const asks = [
    { price: 2.31, size: 1300, total: 1300 },
    { price: 2.32, size: 1100, total: 2400 },
    { price: 2.33, size: 900, total: 3300 },
    { price: 2.34, size: 700, total: 4000 },
    { price: 2.35, size: 500, total: 4500 },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Order Book</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-lg font-semibold text-green-600 mb-2">Bids</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th>Price (USD)</th>
                <th>Size</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => (
                <tr key={index} className="text-left">
                  <td className="text-green-600">{bid.price.toFixed(2)}</td>
                  <td>{bid.size}</td>
                  <td>{bid.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-red-600 mb-2">Asks</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th>Price (USD)</th>
                <th>Size</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {asks.map((ask, index) => (
                <tr key={index} className="text-left">
                  <td className="text-red-600">{ask.price.toFixed(2)}</td>
                  <td>{ask.size}</td>
                  <td>{ask.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
