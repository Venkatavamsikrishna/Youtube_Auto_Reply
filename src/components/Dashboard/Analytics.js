import React, { useState, useEffect } from 'react';
import { formatNumber } from '../../utils/helpers';

function Analytics() {
  const [stats, setStats] = useState({
    totalReplies: 0,
    averageResponseTime: 0,
    popularTemplates: [],
    aiUsage: 0,
    successRate: 0
  });

  useEffect(() => {
    // Load analytics data from localStorage
    const repliedComments = JSON.parse(localStorage.getItem('repliedComments') || '{}');
    const replyTemplates = JSON.parse(localStorage.getItem('replyTemplates') || '[]');
    
    // Calculate statistics
    const totalReplies = Object.keys(repliedComments).length;
    const aiUsage = Object.values(repliedComments).filter(reply => reply.usedAI).length;
    
    setStats({
      totalReplies,
      averageResponseTime: '2.5 minutes', // This would be calculated from actual data
      popularTemplates: replyTemplates.slice(0, 3),
      aiUsage,
      successRate: totalReplies > 0 ? ((aiUsage / totalReplies) * 100).toFixed(1) : 0
    });
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-700">Total Replies</h3>
          <p className="text-3xl font-bold text-blue-900">{formatNumber(stats.totalReplies)}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-700">AI Usage</h3>
          <p className="text-3xl font-bold text-green-900">{stats.successRate}%</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-700">Avg Response Time</h3>
          <p className="text-3xl font-bold text-purple-900">{stats.averageResponseTime}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Popular Templates</h3>
        <div className="space-y-3">
          {stats.popularTemplates.map((template, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded">
              <p className="text-gray-700">{template}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Analytics; 