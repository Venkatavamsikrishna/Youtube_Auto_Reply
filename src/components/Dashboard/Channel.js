import React, { useState, useEffect } from 'react';
import ChannelVideos from './ChannelVideos';
import Comments from './Comments';
import { handleQuotaError } from '../../services/api';
import { CACHE_DURATION, API_ENDPOINTS } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../Common/ConfirmationModal';

const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

function Channel({ channelId }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        const cacheKey = `channel_info_${channelId}`;
        const cachedInfo = localStorage.getItem(cacheKey);
        
        // Always try to use cache first
        if (cachedInfo) {
          const { data, timestamp } = JSON.parse(cachedInfo);
          const isExpired = Date.now() - timestamp > CACHE_DURATION.CHANNELS;
          
          if (!isExpired) {
            setChannelInfo(data);
            setLoading(false);
            return;
          }
        }

        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(
          `${API_ENDPOINTS.YOUTUBE_BASE_URL}/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );
        
        const data = await response.json();
        
        if (data.error && handleQuotaError(data)) {
          if (cachedInfo) {
            const { data: cachedData } = JSON.parse(cachedInfo);
            setChannelInfo(cachedData);
            return;
          }
        }

        if (data.items?.length) {
          setChannelInfo(data.items[0]);
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data.items[0],
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchChannelInfo();
    }
  }, [channelId]);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('oauth_state');
    navigate('/login');
  };

  if (loading) return <div>Loading channel...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!channelInfo) return <div>Channel not found</div>;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {channelInfo.snippet.title}
          </h1>
          <button
            onClick={handleLogoutClick}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="mb-8">
          {!selectedVideo ? (
            <ChannelVideos 
              channelId={channelId} 
              onVideoSelect={setSelectedVideo} 
            />
          ) : (
            <div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="mb-4 text-blue-500 hover:text-blue-600"
              >
                ← Back to Videos
              </button>
              <Comments videoId={selectedVideo} />
            </div>
          )}
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

export default Channel; 