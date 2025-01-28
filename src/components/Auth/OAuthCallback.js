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
        
        console.log('Received auth code:', code); // Debug log

        if (!code) {
          throw new Error('No authorization code received');
        }

        const tokens = await getTokens(code);
        console.log('Received tokens:', { 
          accessToken: tokens.access_token ? 'Present' : 'Missing',
          refreshToken: tokens.refresh_token ? 'Present' : 'Missing'
        }); // Debug log

        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('refreshToken', tokens.refresh_token);

        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
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