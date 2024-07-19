import React from 'react';
import GithubIssueTemplatePreview from './components/GithubIssueTemplatePreview';

function App() {
  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <h1 className="text-white text-center text-3xl mb-8">GitHub Issue Template Preview</h1>
      <GithubIssueTemplatePreview />
    </div>
  );
}

export default App;
