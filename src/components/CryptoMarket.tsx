import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

const CryptoMarket: React.FC<{ projects: any[] }> = ({ projects }) => {

  // 1. Number of projects by type
  const projectTypeCounts = projects.reduce((acc, project) => {
    acc[project.projectType] = (acc[project.projectType] || 0) + 1;
    return acc;
  }, {});
  const projectTypeData = Object.keys(projectTypeCounts).map(type => ({
    name: type,
    projects: projectTypeCounts[type],
  }));

  // 2. Number of transactions and credits traded
  const creditsTradedByType = projects.reduce((acc, project) => {
    acc[project.projectType] = (acc[project.projectType] || 0) + project.retiredAmount;
    return acc;
  }, {});
  const creditsTradedData = Object.keys(creditsTradedByType).map(type => ({
      name: type,
      credits: creditsTradedByType[type],
      transactions: projectTypeCounts[type] || 0
  }));

  // 3. Credit chart by Time
  const creditsOverTime = projects
    .map(p => ({ date: new Date(p.retiredDate), amount: p.retiredAmount }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(p => ({ date: p.date.toLocaleDateString(), amount: p.amount }));

  // 4. Price by project
  const priceByProjectData = projects.map(p => ({
      name: p.projectName,
      price: p.retiredPrice,
  }));

  // 5. Top projects to contribute to reducing emissions
  const topProjectsData = [...projects]
    .sort((a, b) => b.retiredAmount - a.retiredAmount)
    .slice(0, 5)
    .map(p => ({
      name: p.projectName,
      reduction: p.retiredAmount,
    }));


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      {/* Number of Projects by Type */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Number of Projects by Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={projectTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="projects" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions and Credits Traded */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Transactions and Credits Traded</h3>
          <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={creditsTradedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="credits" barSize={20} fill="#413ea0" name="Credits Traded" />
                  <Bar dataKey="transactions" barSize={20} fill="#82ca9d" name="Number of Transactions" />
              </ComposedChart>
          </ResponsiveContainer>
      </div>

      {/* Credit Chart by Time */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Credits Retired Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={creditsOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Price by Project */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Price by Project</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceByProjectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="price" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Projects */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Projects by Emission Reduction</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProjectsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150}/>
                <Tooltip />
                <Legend />
                <Bar dataKey="reduction" fill="#ff7300" name="tCO2 Reduced"/>
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CryptoMarket;
