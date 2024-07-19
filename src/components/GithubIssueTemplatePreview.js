import React, { useState, useRef, Fragment } from 'react';
import { parse } from 'yaml';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faTrash, faTimes, faPlus, faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

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
          <div key={field.id} className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">{field.attributes?.label}</label>
            <p className="text-gray-600 text-sm mb-2">{field.attributes?.description}</p>
            {field.type === 'input' ? (
              <input type="text" className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder={field.attributes?.placeholder} />
            ) : (
              <textarea className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" rows="3" placeholder={field.attributes?.placeholder}></textarea>
            )}
          </div>
        );
      case 'dropdown':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">{field.attributes?.label}</label>
            <p className="text-gray-600 text-sm mb-2">{field.attributes?.description}</p>
            <select className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              {field.attributes?.options?.map((option, index) => (
                <option key={index}>{option}</option>
              ))}
            </select>
          </div>
        );
      case 'checkboxes':
        return (
          <div key={field.id} className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">{field.attributes?.label}</label>
            <p className="text-gray-600 text-sm mb-2">{field.attributes?.description}</p>
            {field.attributes?.options?.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input type="checkbox" id={`${field.id}-${index}`} className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor={`${field.id}-${index}`} className="text-gray-700">{option}</label>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-gray-800 p-8 rounded-lg shadow-lg">
      <div className="relative mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">YAML Input</h2>
        <textarea
          ref={textareaRef}
          className="w-full h-64 p-4 my-4 bg-gray-100 border border-gray-300 rounded-lg resize-none text-gray-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={yamlInput}
          onChange={handleInputChange}
          placeholder="Paste your GitHub issue template YAML here..."
        />
        <div className="absolute top-2 right-2 flex space-x-2 mb-4">
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-full ${copySuccess ? 'bg-green-500' : 'bg-indigo-600'} text-white text-sm transition-colors hover:bg-opacity-90`}
          >
            {copySuccess ? 'Copied!' : 'Copy YAML'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full transition-colors hover:bg-blue-700"
          >
            Quick Start
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Preview</h2>
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}
        {parsedTemplate && (
          <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 shadow-inner">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{parsedTemplate.name}</h1>
            <p className="text-gray-600 mb-6">{parsedTemplate.description}</p>
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
      <div className="fixed inset-0 bg-black bg-opacity-25" />
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
          <Dialog.Panel className="bg-white p-6 rounded-xl max-w-4xl w-full flex flex-col space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-3xl font-bold text-gray-900">Add Example Fields</Dialog.Title>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <div className="flex space-x-8">
              <div className="w-1/2">
                {step === 1 && (
                  <div className="space-y-4">
                    {['name', 'description', 'title', 'labels', 'projects', 'assignees'].map((field) => (
                      <input
                        key={field}
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        placeholder={`Template ${field.charAt(0).toUpperCase() + field.slice(1)}`}
                        name={field}
                        value={templateInfo[field]}
                        onChange={handleTemplateInfoChange}
                      />
                    ))}
                    <button
                      type="button"
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center space-x-2"
                      onClick={() => setStep(2)}
                    >
                      <span>Next</span>
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <form className="space-y-4">
                    <select
                      className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                    {['id', 'label', 'description', 'placeholder'].map((field) => (
                      <input
                        key={field}
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        name={field}
                        value={newField[field]}
                        onChange={handleFieldChange}
                      />
                    ))}
                    {(newField.type === 'dropdown' || newField.type === 'checkboxes') && (
                      <div className="space-y-2">
                        {newField.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              className="flex-grow p-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => handleOptionsChange(index, e.target.value)}
                            />
                            <button
                              type="button"
                              className="p-2 bg-white-500 text-red-400 rounded-lg hover:bg-red-100 transition-colors duration-200 shadow-sm"
                              onClick={() => removeOption(index)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 shadow-md flex items-center justify-center space-x-2"
                          onClick={addOption}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                          <span>Add Option</span>
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center space-x-2"
                      onClick={addNewField}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      <span>Add Field</span>
                    </button>
                    <button
                      type="button"
                      className="w-full py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md flex items-center justify-center space-x-2"
                      onClick={() => setStep(1)}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                      <span>Back</span>
                    </button>
                  </form>
                )}
              </div>
              <div className="w-1/2 overflow-y-auto max-h-[600px] border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-inner">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Preview</h3>
                {formFields.map((field, index) => (
                  <div key={index} className="bg-white p-4 mb-4 rounded-lg shadow-md relative font-mono text-sm">
                    <p className="text-gray-800"><strong>Type:</strong> {field.type}</p>
                    <p className="text-gray-800"><strong>ID:</strong> {field.id}</p>
                    <p className="text-gray-800"><strong>Label:</strong> {field.label}</p>
                    <p className="text-gray-800"><strong>Description:</strong> {field.description}</p>
                    <p className="text-gray-800"><strong>Placeholder:</strong> {field.placeholder}</p>
                    {(field.type === 'dropdown' || field.type === 'checkboxes') && (
                      <div>
                        <p className="text-gray-800"><strong>Options:</strong></p>
                        <ul className="list-disc list-inside text-gray-700">
                          {field.options.map((option, i) => (
                            <li key={i}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-1 right-2 p-2 bg-white-500 text-red-400 rounded-md hover:bg-red-100 transition-colors duration-200 shadow-sm"
                      onClick={() => deleteField(index)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center space-x-2"
              onClick={addFieldToYaml}
            >
              <FontAwesomeIcon icon={faCopy} />
              <span>Add Fields to YAML</span>
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