import React, { useState, useEffect } from 'react';
import { fetchChannelVideos } from '../../services/api';
import { formatDate, formatNumber } from '../../utils/helpers';
import Loader from '../Common/Loader';

function ChannelVideos({ channelId, onVideoSelect }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVideos = async () => {
      if (!channelId) {
        setError('No channel ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          throw new Error('No access token found');
        }

        const videosData = await fetchChannelVideos(channelId, accessToken);
        setVideos(videosData);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err.message || 'Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [channelId]);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!videos?.length) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900">No Videos Found</h3>
        <p className="text-gray-500">This channel doesn't have any videos yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onVideoSelect(video.id)}
        >
          <div className="relative">
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="w-full h-48 object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              {formatNumber(video.statistics?.viewCount || 0)} views
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {video.snippet.title}
            </h3>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{formatDate(video.snippet.publishedAt)}</span>
              <span>{formatNumber(video.statistics?.commentCount || 0)} comments</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChannelVideos; 