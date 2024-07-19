import React from 'react';
import GithubIssueTemplatePreview from './components/GithubIssueTemplatePreview';

function App() {
  return (
    <div style={{backgroundColor: '#121212', minHeight: '100vh', padding: '2rem'}}>
      <h1 style={{color: '#ffffff', textAlign: 'center', marginBottom: '2rem'}}>GitHub Issue Template Preview</h1>
      <GithubIssueTemplatePreview />
    </div>
  );
}

export default App;