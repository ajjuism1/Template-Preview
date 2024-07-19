import React, { useState, useRef, Fragment } from 'react';
import { parse } from 'yaml';
import { Dialog, Transition } from '@headlessui/react';

const GithubIssueTemplatePreview = () => {
  const [yamlInput, setYamlInput] = useState('');
  const [parsedTemplate, setParsedTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [templateInfo, setTemplateInfo] = useState({ name: '', description: '', title: '', labels: '', projects: '', assignees: '' });
  const [step, setStep] = useState(1);
  const [newField, setNewField] = useState({ type: '', id: '', label: '', description: '', placeholder: '', options: [], multiple: false });
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

  const addFieldToYaml = () => {
    const newYamlInput = 
      `name: ${templateInfo.name}\n` +
      `description: ${templateInfo.description}\n` +
      `title: "${templateInfo.title}"\n` +
      `labels: [${templateInfo.labels}]\n` +
      `projects: [${templateInfo.projects}]\n` +
      `assignees:\n  - ${templateInfo.assignees.split(',').join('\n  - ')}\n` +
      `body:\n` + 
      formFields.map(field => {
        if (field.type === 'dropdown' || field.type === 'checkboxes') {
          return `  - type: ${field.type}\n    id: ${field.id}\n    attributes:\n      label: ${field.label}\n      description: ${field.description}\n      ${field.type === 'dropdown' ? 'options' : 'multiple'}: ${JSON.stringify(field.options)}\n      placeholder: ${field.placeholder}`;
        }
        return `  - type: ${field.type}\n    id: ${field.id}\n    attributes:\n      label: ${field.label}\n      description: ${field.description}\n      placeholder: ${field.placeholder}`;
      }).join('\n');
    setYamlInput(newYamlInput);
    parseYaml(newYamlInput);
    setIsModalOpen(false);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setNewField({ ...newField, [name]: value });
  };

  const handleOptionsChange = (index, value) => {
    const options = [...newField.options];
    options[index] = value;
    setNewField({ ...newField, options });
  };

  const addOption = () => {
    setNewField({ ...newField, options: [...newField.options, ''] });
  };

  const removeOption = (index) => {
    const options = [...newField.options];
    options.splice(index, 1);
    setNewField({ ...newField, options });
  };

  const addNewField = () => {
    setFormFields([...formFields, newField]);
    setNewField({ type: '', id: '', label: '', description: '', placeholder: '', options: [], multiple: false });
  };

  const deleteField = (index) => {
    const updatedFields = [...formFields];
    updatedFields.splice(index, 1);
    setFormFields(updatedFields);
  };

  const handleTemplateInfoChange = (e) => {
    const { name, value } = e.target;
    setTemplateInfo({ ...templateInfo, [name]: value });
  };

  const renderFormField = (field) => {
    switch (field.type) {
      case 'input':
      case 'textarea':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-white font-medium mb-1">{field.attributes?.label}</label>
            <p className="text-gray-400 text-sm mb-1">{field.attributes?.description}</p>
            {field.type === 'input' ? (
              <input type="text" className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white" placeholder={field.attributes?.placeholder} />
            ) : (
              <textarea className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white" rows="3" placeholder={field.attributes?.placeholder}></textarea>
            )}
          </div>
        );
      case 'dropdown':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-white font-medium mb-1">{field.attributes?.label}</label>
            <p className="text-gray-400 text-sm mb-1">{field.attributes?.description}</p>
            <select className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white">
              {field.attributes?.options?.map((option, index) => (
                <option key={index}>{option}</option>
              ))}
            </select>
          </div>
        );
      case 'checkboxes':
        return (
          <div key={field.id} className="mb-4">
            <label className="block text-white font-medium mb-1">{field.attributes?.label}</label>
            <p className="text-gray-400 text-sm mb-1">{field.attributes?.description}</p>
            {field.attributes?.options?.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input type="checkbox" id={`${field.id}-${index}`} className="mr-2" />
                <label htmlFor={`${field.id}-${index}`} className="text-white">{option}</label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 text-gray-200 p-8 rounded-lg max-w-3xl mx-auto">
      <div className="relative mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">YAML Input</h2>
        <textarea
          ref={textareaRef}
          className="w-full h-64 p-4 my-4 bg-gray-900 border border-gray-700 rounded resize-none text-white font-mono"
          value={yamlInput}
          onChange={handleInputChange}
          placeholder="Paste your GitHub issue template YAML here..."
        />
        <div className="absolute top-2 right-2 flex space-x-2 mb-4">
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded ${copySuccess ? 'bg-green-500' : 'bg-gray-600'} text-white text-sm transition-colors`}
          >
            {copySuccess ? 'Copied!' : 'Copy YAML'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded transition-colors"
          >
            Quick Start
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
        {error && (
          <div className="bg-red-600 text-white p-4 rounded mb-4">
            {error}
          </div>
        )}
        {parsedTemplate && (
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h1 className="text-2xl font-semibold text-white mb-4">{parsedTemplate.name}</h1>
            <p className="text-gray-400 mb-6">{parsedTemplate.description}</p>
            {parsedTemplate.body && parsedTemplate.body.map(renderFormField)}
          </div>
        )}
      </div>
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-gray-800 p-6 rounded-lg max-w-3xl w-full flex flex-col space-y-4">
                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <Dialog.Title className="text-lg font-medium text-white mb-4">Add Example Fields</Dialog.Title>
                      {step === 1 && (
                        <div className="space-y-4">
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Template Name"
                            name="name"
                            value={templateInfo.name}
                            onChange={handleTemplateInfoChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Template Description"
                            name="description"
                            value={templateInfo.description}
                            onChange={handleTemplateInfoChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Template Title"
                            name="title"
                            value={templateInfo.title}
                            onChange={handleTemplateInfoChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Labels (comma-separated)"
                            name="labels"
                            value={templateInfo.labels}
                            onChange={handleTemplateInfoChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Projects (comma-separated)"
                            name="projects"
                            value={templateInfo.projects}
                            onChange={handleTemplateInfoChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Assignees (comma-separated)"
                            name="assignees"
                            value={templateInfo.assignees}
                            onChange={handleTemplateInfoChange}
                          />
                          <button
                            type="button"
                            className="w-full py-2 bg-blue-500 text-white rounded mt-4"
                            onClick={() => setStep(2)}
                          >
                            Next
                          </button>
                        </div>
                      )}
                      {step === 2 && (
                        <form className="space-y-4">
                          <select
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            name="type"
                            value={newField.type}
                            onChange={handleFieldChange}
                          >
                            <option value="">Select Field Type</option>
                            <option value="input">Input</option>
                            <option value="textarea">Textarea</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="checkboxes">Checkboxes</option>
                          </select>
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="ID"
                            name="id"
                            value={newField.id}
                            onChange={handleFieldChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Label"
                            name="label"
                            value={newField.label}
                            onChange={handleFieldChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Description"
                            name="description"
                            value={newField.description}
                            onChange={handleFieldChange}
                          />
                          <input
                            type="text"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            placeholder="Placeholder"
                            name="placeholder"
                            value={newField.placeholder}
                            onChange={handleFieldChange}
                          />
                          {(newField.type === 'dropdown' || newField.type === 'checkboxes') && (
                            <div className="space-y-2">
                              {newField.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                                    placeholder={`Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionsChange(index, e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="px-2 py-1 bg-red-600 text-white rounded"
                                    onClick={() => removeOption(index)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="w-full py-2 bg-yellow-600 text-white rounded"
                                onClick={addOption}
                              >
                                Add Option
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            className="w-full py-2 bg-blue-600 text-white rounded mt-4"
                            onClick={addNewField}
                          >
                            Add Field
                          </button>
                          <button
                            type="button"
                            className="w-full py-2 bg-gray-600 text-white rounded mt-4"
                            onClick={() => setStep(1)}
                          >
                            Back
                          </button>
                        </form>
                      )}
                    </div>
                    <div className="w-1/2 overflow-y-auto max-h-96 border border-gray-600 rounded p-4">
                      <h3 className="text-lg font-medium text-white mb-2">Preview</h3>
                      {formFields.map((field, index) => (
                        <div key={index} className="bg-gray-700 p-4 mb-2 rounded relative">
                          <p className="text-white"><strong>Type:</strong> {field.type}</p>
                          <p className="text-white"><strong>ID:</strong> {field.id}</p>
                          <p className="text-white"><strong>Label:</strong> {field.label}</p>
                          <p className="text-white"><strong>Description:</strong> {field.description}</p>
                          <p className="text-white"><strong>Placeholder:</strong> {field.placeholder}</p>
                          {(field.type === 'dropdown' || field.type === 'checkboxes') && (
                            <div>
                              <p className="text-white"><strong>Options:</strong></p>
                              <ul className="list-disc list-inside text-white">
                                {field.options.map((option, i) => (
                                  <li key={i}>{option}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            type="button"
                            className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white rounded text-xs"
                            onClick={() => deleteField(index)}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 bg-green-600 text-white rounded mb-4"
                    onClick={addFieldToYaml}
                  >
                    Add Fields to YAML
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default GithubIssueTemplatePreview;
