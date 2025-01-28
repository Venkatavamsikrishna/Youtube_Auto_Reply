import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTokens } from '../../services/api';

function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        // Verify state to prevent CSRF attacks
        const savedState = localStorage.getItem('oauth_state');
        if (state !== savedState) {
          throw new Error('Invalid state parameter');
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        const tokens = await getTokens(code);
        
        // Store tokens
        localStorage.setItem('accessToken', tokens.access_token);
        if (tokens.refresh_token) {
          localStorage.setItem('refreshToken', tokens.refresh_token);
        }
        
        // Clear state
        localStorage.removeItem('oauth_state');

        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login', { 
          state: { 
            error: 'Authentication failed. Please try again.' 
          }
        });
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Authenticating...</h2>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}

export default OAuthCallback; 