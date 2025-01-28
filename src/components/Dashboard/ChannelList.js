import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserChannels } from '../../services/api';

function ChannelList() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const channelData = await fetchUserChannels(accessToken);
        setChannels(channelData);
      } catch (error) {
        console.error('Error loading channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  if (loading) {
    return <div>Loading channels...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your YouTube Channels</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/videos/${channel.id}`)}
          >
            <img
              src={channel.snippet.thumbnails.default.url}
              alt={channel.snippet.title}
              className="w-24 h-24 rounded-full mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-center mb-2">
              {channel.snippet.title}
            </h2>
            <p className="text-gray-600 text-center">
              {channel.statistics.subscriberCount} subscribers
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChannelList; 