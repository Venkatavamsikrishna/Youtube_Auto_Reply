import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import OAuthCallback from './components/Auth/OAuthCallback';
import Channels from './components/Dashboard/Channels';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/oauth/callback" element={<OAuthCallback />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Channels />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
