import React from 'react';
import { API_ENDPOINTS, SCOPES } from '../../utils/constants';
import { FaYoutube, FaGoogle } from 'react-icons/fa';
import '../../App.css'; // Importing the CSS file

function Login() {
  const handleLogin = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = API_ENDPOINTS.REDIRECT_URI;
    
    const authUrl = `${API_ENDPOINTS.OAUTH_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${SCOPES}&access_type=offline&prompt=consent`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-800">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">
            Welcome to YouTube Comment Manager
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Sign in with your Google account to manage your YouTube channels and comments.
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-lg font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-500 transition duration-300"
        >
          <FaGoogle className="w-6 h-6 mr-3" />
          Sign in with Google
        </button>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our <span className="text-indigo-600">Privacy Policy</span> and <span className="text-indigo-600">Terms of Service</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
