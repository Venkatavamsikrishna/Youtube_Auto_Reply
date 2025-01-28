import React, { useState, useEffect } from 'react';
import { fetchVideoComments, generateAIReply, postCommentReply } from '../../services/api';
import ReplyTemplates from './ReplyTemplates';
import Analytics from './Analytics';
import { formatDate } from '../../utils/helpers';
import Loader from '../Common/Loader';

function Comments({ videoId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedReplies, setGeneratedReplies] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [repliedComments, setRepliedComments] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [aiConfig, setAiConfig] = useState({
    tone: 'friendly',
    length: 'medium',
    language: 'english'
  });
  const [autoReplyStatus, setAutoReplyStatus] = useState({});

  useEffect(() => {
    const loadComments = async () => {
      if (!videoId) {
        setError('No video ID provided');
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

        const commentsData = await fetchVideoComments(videoId, accessToken);
        console.log('Fetched comments:', commentsData); // Debug log
        setComments(commentsData);

        // Load existing replied comments from localStorage
        const savedReplies = JSON.parse(localStorage.getItem('repliedComments') || '{}');
        setRepliedComments(savedReplies);

        // Only process comments that haven't been replied to
        commentsData.forEach(comment => {
          if (!savedReplies[comment.id]) {
            handleAutoReply(comment);
          }
        });

      } catch (err) {
        console.error('Error loading comments:', err);
        if (err.response?.data?.error?.message?.includes('disabled comments') || 
            err.response?.data?.error?.message?.includes('videoId')) {
          setComments([]);
        } else {
          setError(err.message || 'Failed to load comments');
        }
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [videoId]);

  const handleAIConfig = (config) => {
    setAiConfig(prev => ({ ...prev, ...config }));
  };

  const handleAutoReply = async (comment) => {
    const commentId = comment.id;
    try {
      setAutoReplyStatus(prev => ({ ...prev, [commentId]: 'generating' }));
      
      const generatedReply = await generateAIReply(
        comment.snippet.topLevelComment.snippet.textDisplay,
        {
          template: selectedTemplate,
          ...aiConfig
        }
      );

      if (!generatedReply) {
        throw new Error('No reply was generated');
      }

      setGeneratedReplies(prev => ({ ...prev, [commentId]: generatedReply }));
      setAutoReplyStatus(prev => ({ ...prev, [commentId]: 'posting' }));

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      await postCommentReply(commentId, generatedReply, accessToken);
      
      setRepliedComments(prev => ({ ...prev, [commentId]: true }));
      setAutoReplyStatus(prev => ({ ...prev, [commentId]: 'completed' }));
      
      const savedReplies = JSON.parse(localStorage.getItem('repliedComments') || '{}');
      localStorage.setItem('repliedComments', JSON.stringify({
        ...savedReplies,
        [commentId]: true
      }));

    } catch (err) {
      console.error('Error in auto-reply:', err);
      setAutoReplyStatus(prev => ({ ...prev, [commentId]: 'error' }));
      setError(err.message || 'Failed to auto-reply');
    }
  };

  const renderCommentStatus = (comment) => {
    const status = autoReplyStatus[comment.id];
    
    if (repliedComments[comment.id]) {
      return (
        <div className="bg-gray-100 p-2 rounded mt-2">
          <div className="text-gray-600 text-sm">
            <span className="mr-2">��</span>
            Reply Already Posted
          </div>
        </div>
      );
    }

    switch (status) {
      case 'generating':
        return <div className="text-blue-600 text-sm mt-2">Generating Reply...</div>;
      case 'posting':
        return <div className="text-orange-600 text-sm mt-2">Posting Reply...</div>;
      case 'error':
        return <div className="text-red-600 text-sm mt-2">Failed to Auto-Reply</div>;
      default:
        return <div className="text-gray-600 text-sm mt-2">Processing...</div>;
    }
  };

  const renderAIConfig = () => (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-3">AI Configuration</h3>
      <div className="grid grid-cols-3 gap-4">
        <select
          value={aiConfig.tone}
          onChange={(e) => handleAIConfig({ tone: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
        </select>

        <select
          value={aiConfig.length}
          onChange={(e) => handleAIConfig({ length: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>

        <select
          value={aiConfig.language}
          onChange={(e) => handleAIConfig({ language: e.target.value })}
          className="p-2 border rounded"
        >
          <option value="english">English</option>
          <option value="spanish">Spanish</option>
          <option value="french">French</option>
        </select>
      </div>
    </div>
  );

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="space-y-4 p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow ${repliedComments[comment.id] ? 'opacity-75' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <img
                  src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl}
                  alt={comment.snippet.topLevelComment.snippet.authorDisplayName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="font-semibold">
                    {comment.snippet.topLevelComment.snippet.authorDisplayName}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {comment.snippet.topLevelComment.snippet.textDisplay}
                  </div>
                  
                  {/* Generated Reply Section */}
                  {generatedReplies[comment.id] && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{generatedReplies[comment.id]}</p>
                    </div>
                  )}

                  {/* Status Section */}
                  {renderCommentStatus(comment)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!comments.length) {
    return (
      <div className="space-y-4 p-4">
        <Analytics />
        {renderAIConfig()}
        <ReplyTemplates onSelectTemplate={setSelectedTemplate} />
        
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Comments Available</h3>
          <p className="text-gray-500">
            This video currently has no comments available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Analytics />
      {renderAIConfig()}
      <ReplyTemplates onSelectTemplate={setSelectedTemplate} />
      
      <h2 className="text-xl font-bold mb-4">Comments</h2>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow ${
              repliedComments[comment.id] ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <img
                src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl}
                alt={comment.snippet.topLevelComment.snippet.authorDisplayName}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-semibold">
                  {comment.snippet.topLevelComment.snippet.authorDisplayName}
                </div>
                <div className="text-gray-600 mt-1">
                  {comment.snippet.topLevelComment.snippet.textDisplay}
                </div>
                
                {/* Generated Reply Section */}
                {generatedReplies[comment.id] && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">{generatedReplies[comment.id]}</p>
                  </div>
                )}

                {/* Status Section */}
                {renderCommentStatus(comment)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Comments; 