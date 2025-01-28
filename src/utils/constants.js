export const CACHE_DURATION = {
  CHANNELS: 24 * 60 * 60 * 1000,    // 24 hours for channels
  VIDEOS: 12 * 60 * 60 * 1000,      // 12 hours for videos
  COMMENTS: 30 * 60 * 1000          // 30 minutes for comments
};

export const API_ENDPOINTS = {
  YOUTUBE_BASE_URL: 'https://youtube.googleapis.com/youtube/v3',
  OAUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  REDIRECT_URI: process.env.NODE_ENV === 'production' 
    ? 'https://youtubeautoreply.vercel.app/login/oauth/callback'
    : 'http://localhost:3000/oauth/callback'
};

export const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.channel-memberships.creator'
].join(' ');

export const MAX_RESULTS = {
  VIDEOS: 50,
  COMMENTS: 50
}; 