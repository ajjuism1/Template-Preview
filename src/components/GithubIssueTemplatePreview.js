import React, { useState, useRef } from 'react';
import { parse } from 'yaml';

const styles = {
  container: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
    padding: '2rem',
    borderRadius: '8px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: '2rem',
    position: 'relative',
  },
  textarea: {
    width: '100%',
    height: '300px',
    padding: '0.75rem',
    backgroundColor: '#2d2d2d',
    border: '1px solid #444',
    borderRadius: '4px',
    color: '#e0e0e0',
    fontFamily: "'Fira Code', 'Consolas', monospace",
    fontSize: '0.9rem',
    resize: 'vertical',
  },
  copyButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#4a4a4a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'background-color 0.3s',
  },
  previewContainer: {
    backgroundColor: '#2d2d2d',
    padding: '1.5rem',
    borderRadius: '4px',
    border: '1px solid #444',
  },
  previewHeader: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#ffffff',
  },
  previewDescription: {
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
  },
  fieldContainer: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontWeight: '500',
    marginBottom: '0.5rem',
    color: '#ffffff',
  },
  description: {
    fontSize: '0.85rem',
    color: '#a0a0a0',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#3d3d3d',
    border: '1px solid #555',
    borderRadius: '4px',
    color: '#e0e0e0',
    fontSize: '0.9rem',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#3d3d3d',
    border: '1px solid #555',
    borderRadius: '4px',
    color: '#e0e0e0',
    fontSize: '0.9rem',
  },
  checkbox: {
    marginRight: '0.5rem',
  },
  checkboxLabel: {
    fontSize: '0.95rem',
    color: '#e0e0e0',
  },
  error: {
    backgroundColor: '#ff6b6b',
    color: '#ffffff',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
};

const GithubIssueTemplatePreview = () => {
  const [yamlInput, setYamlInput] = useState('');
  const [parsedTemplate, setParsedTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const textareaRef = useRef(null);

  const parseYaml = (input) => {
    try {
      const parsed = parse(input);
      setParsedTemplate(parsed);
      setError(null);
    } catch (e) {
      setError('Invalid YAML: ' + e.message);
      setParsedTemplate(null);
    }
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    setYamlInput(input);
    parseYaml(input);
  };

  const copyToClipboard = () => {
    textareaRef.current.select();
    document.execCommand('copy');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const renderFormField = (field) => {
    switch (field.type) {
      case 'input':
      case 'textarea':
        return (
          <div key={field.id} style={styles.fieldContainer}>
            <label style={styles.label}>{field.attributes.label}</label>
            <p style={styles.description}>{field.attributes.description}</p>
            {field.type === 'input' ? (
              <input type="text" style={styles.input} placeholder={field.attributes.placeholder} />
            ) : (
              <textarea style={styles.input} rows="3" placeholder={field.attributes.placeholder}></textarea>
            )}
          </div>
        );
      case 'dropdown':
        return (
          <div key={field.id} style={styles.fieldContainer}>
            <label style={styles.label}>{field.attributes.label}</label>
            <p style={styles.description}>{field.attributes.description}</p>
            <select style={styles.select}>
              {field.attributes.options.map((option, index) => (
                <option key={index}>{option}</option>
              ))}
            </select>
          </div>
        );
      case 'checkboxes':
        return (
          <div key={field.id} style={styles.fieldContainer}>
            <label style={styles.label}>{field.attributes.label}</label>
            <p style={styles.description}>{field.attributes.description}</p>
            {field.attributes.options.map((option, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                <input type="checkbox" id={`${field.id}-${index}`} style={styles.checkbox} />
                <label htmlFor={`${field.id}-${index}`} style={styles.checkboxLabel}>{option.label}</label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputContainer}>
        <h2 style={styles.header}>YAML Input</h2>
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={yamlInput}
          onChange={handleInputChange}
          placeholder="Paste your GitHub issue template YAML here..."
        />
        <button
          onClick={copyToClipboard}
          style={{
            ...styles.copyButton,
            backgroundColor: copySuccess ? '#4caf50' : '#4a4a4a',
          }}
        >
          {copySuccess ? 'Copied!' : 'Copy YAML'}
        </button>
      </div>
      <div>
        <h2 style={styles.header}>Preview</h2>
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}
        {parsedTemplate && (
          <div style={styles.previewContainer}>
            <h1 style={styles.previewHeader}>{parsedTemplate.name}</h1>
            <p style={styles.previewDescription}>{parsedTemplate.description}</p>
            {parsedTemplate.body && parsedTemplate.body.map(renderFormField)}
          </div>
        )}
      </div>
    </div>
  );
};

export default GithubIssueTemplatePreview;