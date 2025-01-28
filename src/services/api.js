import axios from 'axios';
import { API_ENDPOINTS, SCOPES, MAX_RESULTS, CACHE_DURATION } from '../utils/constants';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
const CLIENT_SECRET = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
const REDIRECT_URL = API_ENDPOINTS.REDIRECT_URI;
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const BASE_URL = 'https://youtube.googleapis.com/youtube/v3';

// Add these constants at the top
const QUOTA_LIMITS = {
  DAILY_LIMIT: 10000,
  CHANNELS_COST: 1,
  VIDEOS_COST: 1,
  COMMENTS_COST: 1
};

const QUOTA_KEY = 'youtube_api_quota';
const QUOTA_RESET_KEY = 'youtube_quota_reset_date';

// Load the Google API client library
const loadGoogleAuth = () => {
  return new Promise((resolve) => {
    window.gapi.load('auth2', () => {
      window.gapi.auth2
        .init({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES.join(' ')
        })
        .then(resolve);
    });
  });
};

// Authentication functions
export const initAuth = async () => {
  if (!window.gapi) {
    console.error('Google API client library not loaded');
    return;
  }
  
  try {
    await loadGoogleAuth();
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    throw error;
  }
};

export const getAuthUrl = () => {
  const state = Math.random().toString(36).substring(7);
  localStorage.setItem('oauth_state', state);
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URL,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    state: state,
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const getTokens = async (code) => {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URL,
      grant_type: 'authorization_code'
    });

    return response.data;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

// Add these helper functions
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION.CHANNELS) {
      console.log('Cache expired, but using it due to quota limits');
    }
    return data;
  } catch (error) {
    console.error('Cache reading error:', error);
    return null;
  }
};

const setCachedData = (key, data) => {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

// Add this helper function
const getCacheKey = (type, identifier) => `youtube_${type}_${identifier}`;

// Add these quota management functions
const getQuotaUsage = () => {
  const usage = localStorage.getItem(QUOTA_KEY);
  const resetDate = localStorage.getItem(QUOTA_RESET_KEY);
  
  // Reset quota if it's a new day
  if (resetDate && new Date(resetDate).getDate() !== new Date().getDate()) {
    localStorage.setItem(QUOTA_KEY, '0');
    localStorage.setItem(QUOTA_RESET_KEY, new Date().toISOString());
    return 0;
  }
  
  return parseInt(usage || '0', 10);
};

const updateQuotaUsage = (cost) => {
  const currentUsage = getQuotaUsage();
  localStorage.setItem(QUOTA_KEY, (currentUsage + cost).toString());
  localStorage.setItem(QUOTA_RESET_KEY, new Date().toISOString());
};

const checkQuota = (cost) => {
  const currentUsage = getQuotaUsage();
  return (currentUsage + cost) <= QUOTA_LIMITS.DAILY_LIMIT;
};

// Fetch user's channels
export const fetchUserChannels = async (accessToken) => {
  const cacheKey = getCacheKey('channels', accessToken.slice(-10));
  
  try {
    // Always try to get cached data first
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > CACHE_DURATION.CHANNELS;
      
      if (!isExpired || !checkQuota(QUOTA_LIMITS.CHANNELS_COST)) {
        console.log(isExpired ? 'Using expired cache due to quota' : 'Using fresh cached data');
        return data;
      }
      
      console.log('Cache expired, attempting to fetch fresh data');
    }

    // Check quota before making API call
    if (!checkQuota(QUOTA_LIMITS.CHANNELS_COST)) {
      throw new Error('quota_exceeded');
    }

    const response = await axios.get(
      `${API_ENDPOINTS.YOUTUBE_BASE_URL}/channels`,
      {
        params: {
          part: 'snippet,statistics,contentDetails',
          mine: true,
          maxResults: 5,
          key: YOUTUBE_API_KEY
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    updateQuotaUsage(QUOTA_LIMITS.CHANNELS_COST);
    const freshData = response.data.items || [];
    
    // Update cache with fresh data
    localStorage.setItem(cacheKey, JSON.stringify({
      data: freshData,
      timestamp: Date.now()
    }));

    return freshData;

  } catch (error) {
    console.error('Error in fetchUserChannels:', error);
    
    if (error.message === 'quota_exceeded' || 
        error.response?.data?.error?.message?.includes('quota')) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        console.log('Quota exceeded, using cached data');
        return data;
      }
      throw new Error('YouTube API quota exceeded. Please try again later.');
    }
    
    throw error;
  }
};

// Fetch channel videos
export const fetchChannelVideos = async (channelId, accessToken) => {
  try {
    const channelResponse = await axios.get(
      `${API_ENDPOINTS.YOUTUBE_BASE_URL}/channels`,
      {
        params: {
          part: 'contentDetails',
          id: channelId,
          key: YOUTUBE_API_KEY
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

    const videosResponse = await axios.get(
      `${API_ENDPOINTS.YOUTUBE_BASE_URL}/playlistItems`,
      {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: 50,
          key: YOUTUBE_API_KEY
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const videoIds = videosResponse.data.items.map(item => item.contentDetails.videoId).join(',');
    
    const detailedVideosResponse = await axios.get(
      `${API_ENDPOINTS.YOUTUBE_BASE_URL}/videos`,
      {
        params: {
          part: 'snippet,statistics',
          id: videoIds,
          key: YOUTUBE_API_KEY
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return detailedVideosResponse.data.items || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch videos');
  }
};

// Fetch video comments
export const fetchVideoComments = async (videoId, accessToken) => {
  try {
    const response = await axios.get(
      `${API_ENDPOINTS.YOUTUBE_BASE_URL}/commentThreads`,
      {
        params: {
          part: 'snippet,replies',
          videoId: videoId,
          maxResults: 50,
          order: 'time',
          key: YOUTUBE_API_KEY
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    if (error.response?.data?.error?.message?.includes('disabled comments')) {
      return [];
    }
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch comments');
  }
};

// Post a reply to a comment
export const postCommentReply = async (commentId, replyText, accessToken) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.YOUTUBE_BASE_URL}/comments`,
      {
        snippet: {
          parentId: commentId,
          textOriginal: replyText
        }
      },
      {
        params: {
          part: 'snippet',
          key: YOUTUBE_API_KEY
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error posting reply:', error);
    throw new Error(error.response?.data?.error?.message || 'Failed to post reply');
  }
};

// Helper function to check if token needs refresh
export const checkAndRefreshToken = async (accessToken, refreshToken) => {
  try {
    if (!GOOGLE_CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Google OAuth credentials are not configured');
    }

    // Check token validity
    try {
      await axios.get('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        params: { access_token: accessToken }
      });
      return null; // Token is still valid
    } catch (error) {
      // If token is invalid, refresh it
      if (error.response && error.response.status === 401) {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: GOOGLE_CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        });
        
        return {
          access_token: response.data.access_token,
          expiry_date: Date.now() + (response.data.expires_in * 1000)
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// OpenAI integration for generating replies
export const generateAIReply = async (commentText, config = {}) => {
  try {
    if (!commentText) {
      throw new Error('No comment text provided');
    }

    // Check if Gemini API key is configured
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured in environment variables');
    }

    const prompt = generateAdvancedPrompt(commentText, config);

    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: getMaxTokens(config.length),
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      let reply = response.data.candidates[0].content.parts[0].text.trim();
      
      // Apply template if provided
      if (config.template) {
        reply = applyTemplate(reply, config.template);
      }

      return reply;
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw error;
  }
};

// Helper functions for advanced AI responses
function generateAdvancedPrompt(commentText, config) {
  const { tone = 'friendly', language = 'english' } = config;
  
  return `As a helpful YouTube channel manager, generate a ${tone} reply in ${language} to this comment: "${commentText}". 
          The reply should be ${config.length || 'medium'} in length and maintain a ${tone} tone throughout.
          ${config.template ? `Use this template as a guide: ${config.template}` : ''}`;
}

function getMaxTokens(length) {
  const tokenLengths = {
    short: 50,
    medium: 150,
    long: 300
  };
  return tokenLengths[length] || 150;
}

function applyTemplate(reply, template) {
  // Replace template placeholders with generated content
  return template.replace('[REPLY]', reply);
}

// Add this function to handle quota errors globally
export const handleQuotaError = (error) => {
  if (error.response?.data?.error?.message?.includes('quota')) {
    console.warn('YouTube API quota exceeded, using cached data where available');
    return true;
  }
  return false;
}; 