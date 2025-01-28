import React, { useState, useEffect } from 'react';

function ReplyTemplates({ onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState('');

  useEffect(() => {
    const savedTemplates = JSON.parse(localStorage.getItem('replyTemplates') || '[]');
    setTemplates(savedTemplates);
  }, []);

  const handleAddTemplate = () => {
    if (!newTemplate.trim()) return;
    
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('replyTemplates', JSON.stringify(updatedTemplates));
    setNewTemplate('');
  };

  const handleDeleteTemplate = (index) => {
    const updatedTemplates = templates.filter((_, i) => i !== index);
    setTemplates(updatedTemplates);
    localStorage.setItem('replyTemplates', JSON.stringify(updatedTemplates));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-3">Reply Templates</h3>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={newTemplate}
          onChange={(e) => setNewTemplate(e.target.value)}
          placeholder="Enter new template..."
          className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddTemplate}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {templates.map((template, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <button
              onClick={() => onSelectTemplate(template)}
              className="flex-1 text-left hover:text-blue-500"
            >
              {template}
            </button>
            <button
              onClick={() => handleDeleteTemplate(index)}
              className="ml-2 text-red-500 hover:text-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReplyTemplates; 