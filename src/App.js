import React from 'react';
import GithubIssueTemplatePreview from './components/GithubIssueTemplatePreview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

function App() {
  return (
    <div className="bg-indigo-900 min-h-screen p-8">
      <h1 className="text-white text-center text-3xl mb-8 flex items-center justify-center">
        <FontAwesomeIcon icon={faGithub} className="mr-2 text-4xl" />
        Issue Template Generator
      </h1>
      <GithubIssueTemplatePreview />
    </div>
  );
}

export default App;