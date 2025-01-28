import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserChannels } from '../../services/api';
import Channel from './Channel';
import Loader from '../Common/Loader';
import ConfirmationModal from '../Common/ConfirmationModal';

function Channels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('accessToken');
        
        console.log('Starting channel load...'); // Debug log
        
        if (!accessToken) {
          console.log('No access token found, redirecting to login...');
          navigate('/login');
          return;
        }

        const channelsData = await fetchUserChannels(accessToken);
        console.log('Channels loaded:', channelsData); // Debug log
        
        if (!channelsData || channelsData.length === 0) {
          setError('No YouTube channels found for this account');
          return;
        }

        setChannels(channelsData);
      } catch (err) {
        console.error('Channel loading error:', err);
        if (err.message.includes('quota')) {
          setError(
            'YouTube API quota limit reached. Some data might be outdated. ' +
            'The quota will reset at midnight Pacific Time.'
          );
        } else if (err.message.includes('Authentication expired')) {
          navigate('/login');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [navigate]);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('oauth_state');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-8 py-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error Loading Channels</h2>
          <p>{error}</p>
          <div className="mt-4 flex space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedChannel) {
    return <Channel channelId={selectedChannel.id} channelInfo={selectedChannel} />;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your YouTube Channels</h1>
          <button
            onClick={handleLogoutClick}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map(channel => (
            <div
              key={channel.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedChannel(channel)}
            >
              <img
                src={channel.snippet.thumbnails.medium.url}
                alt={channel.snippet.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="font-semibold text-xl mb-2">{channel.snippet.title}</h2>
                <div className="text-sm text-gray-600">
                  <p>{channel.statistics?.subscriberCount || 0} subscribers</p>
                  <p>{channel.statistics?.videoCount || 0} videos</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You'll need to sign in again to access your channels."
      />
    </>
  );
}

export default Channels; 