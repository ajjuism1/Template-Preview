import React, { useState, useRef, Fragment, useEffect } from 'react';
import { parse, stringify } from 'yaml';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faTrash, faTimes, faPlus, faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { motion } from 'framer-motion';

const GithubIssueTemplatePreview = () => {
  const [yamlInput, setYamlInput] = useState('');
  const [parsedTemplate, setParsedTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [templateInfo, setTemplateInfo] = useState({ name: '', description: '', title: '', labels: '', projects: '', assignees: '' });
  const [step, setStep] = useState(1);
  const [newField, setNewField] = useState({ type: '', id: '', label: '', description: '', placeholder: '', options: [], multiple: false });  const textareaRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const validateField = (field) => {
    if (!field.id || !/^[a-zA-Z0-9_-]+$/.test(field.id)) {
      throw new Error(`Field ID "${field.id}" can only contain numbers, letters, -, _`);
    }
    if (!field.label || typeof field.label !== 'string' || field.label.trim() === '') {
      throw new Error('Label must be a non-empty string');
    }
    if (['input', 'textarea'].includes(field.type) && /password/i.test(field.label)) {
      throw new Error('Label contains forbidden word (password)');
    }
    if (['dropdown', 'checkboxes'].includes(field.type)) {
      if (!Array.isArray(field.options) || field.options.length === 0) {
        throw new Error('Options must be a non-empty array');
      }
      const optionSet = new Set(field.options.map(o => typeof o === 'string' ? o : o.label));
      if (optionSet.size !== field.options.length) {
        throw new Error('Options must be unique');
      }
      if (field.options.some(o => (typeof o === 'string' ? o : o.label).toLowerCase() === 'none')) {
        throw new Error('Options must not include the reserved word "none"');
      }
      field.options = field.options.map(option => {
        const label = typeof option === 'string' ? option : option.label;
        return {
          label: ['yes', 'no', 'true', 'false'].includes(label.toLowerCase()) ? `"${label}"` : label
        };
      });
    }
  };

  const addFieldToYaml = () => {
    try {
      if (!templateInfo.name || typeof templateInfo.name !== 'string' || templateInfo.name.trim() === '') {
        throw new Error('Name is required and must be a non-empty string');
      }
  
      const uniqueIds = new Set();
      const uniqueLabels = new Set();
  
      formFields.forEach(validateField);
      formFields.forEach(field => {
        if (uniqueIds.has(field.id)) {
          throw new Error(`Duplicate ID: ${field.id}`);
        }
        uniqueIds.add(field.id);
  
        if (uniqueLabels.has(field.label)) {
          throw new Error(`Duplicate label: ${field.label}`);
        }
        uniqueLabels.add(field.label);
      });
  
      if (formFields.length === 0) {
        throw new Error('Body must contain at least one non-markdown field');
      }
  
      const newYamlObject = {
        name: templateInfo.name,
        description: templateInfo.description,
        title: templateInfo.title,
        labels: templateInfo.labels ? templateInfo.labels.split(',').map(l => l.trim()) : [],
        projects: templateInfo.projects ? templateInfo.projects.split(',').map(p => p.trim()) : [],
        assignees: templateInfo.assignees ? templateInfo.assignees.split(',').map(a => a.trim()) : [],
        body: formFields.map(field => {
          const attributes = {
            label: field.label,
            description: field.description,
          };
          
          if (field.type === 'input' || field.type === 'textarea') {
            attributes.placeholder = field.placeholder;
          }
          
          if (field.type === 'dropdown') {
            attributes.multiple = field.multiple;
            attributes.options = field.options.map(option => ({
              label: option.label,
              value: option.label.toLowerCase().replace(/\s+/g, '-')
            }));
          }
  
          if (field.type === 'checkboxes') {
            attributes.options = field.options.map(option => ({
              label: option.label,
              required: false
            }));
          }
  
          return {
            type: field.type,
            id: field.id,
            attributes: attributes,
          };
        }),
      };
  
      const newYamlInput = stringify(newYamlObject);
      setYamlInput(newYamlInput);
      parseYaml(newYamlInput);
      setIsModalOpen(false);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
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
    try {
      const fieldToAdd = { ...newField };
      if (fieldToAdd.type === 'dropdown' || fieldToAdd.type === 'checkboxes') {
        fieldToAdd.options = fieldToAdd.options.map(option => ({ label: option }));
        delete fieldToAdd.placeholder;
      }
      validateField(fieldToAdd);
      setFormFields([...formFields, fieldToAdd]);
      setNewField({ type: '', id: '', label: '', description: '', placeholder: '', options: [], multiple: false });
    } catch (e) {
      setError(e.message);
    }
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
                  <option key={index}>{option.label}</option>
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
                  <label htmlFor={`${field.id}-${index}`} className="text-gray-700">{option.label}</label>
                </div>
              ))}
            </div>
          );
        default:
          return null;
      }
    };

  const Footer = () => (
    <footer className="bg-transparent text-white py-4 mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; 2024 GitHub Issue Template Preview | <a href='https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository'> Read Documentation</a></p> 
        <div className="mt-2">
          <a href="https://x.com/ajjuism" className="text-blue-300 hover:text-blue-100 mr-4">Made with ❤️ and Laziness</a>
        </div>
      </div>
    </footer>
  );

  if (isMobile) {
    return (
      <div className="bg-indigo-900 min-h-screen flex items-center justify-center text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Desktop Only</h1>
          <p>This app is only accessible on desktop browsers. Please open it on a larger screen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-900 min-h-screen flex flex-col">
      <div className="flex-grow bg-white text-gray-800 p-8 rounded-lg shadow-lg m-8">
        {/* <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center">
          <FontAwesomeIcon icon={faGithub} className="mr-2" />
          Issue Template Preview
        </h1> */}
        <div className="relative mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">YAML Input</h2>
          <textarea
            ref={textareaRef}
            className="w-full h-64 p-4 my-6 bg-gray-100 border border-gray-300 rounded-lg resize-none text-gray-800 font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={yamlInput}
            onChange={handleInputChange}
            placeholder="Paste your GitHub issue template YAML here..."
          />
          <div className="absolute top-2 right-2 flex space-x-2 mb-4">
         
          <button
              onClick={copyToClipboard}
              className={`px-4 py-2 rounded-full border ${
                copySuccess ? 'border-green-500 text-green-500' : 'border-transparent-600 text-indigo-600'
              } hover:bg-indigo-50 text-sm transition-colors flex items-center space-x-2`}
            >
              <FontAwesomeIcon icon={faCopy} />
              <span>{copySuccess ? 'Copied!' : 'Copy YAML'}</span>
            </button>
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white text-base rounded-full transition-colors hover:bg-blue-700"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0px 0px 0px rgba(59,130,246,0)',
                  '0px 0px 15px rgba(59,130,246,0.7)',
                  '0px 0px 0px rgba(59,130,246,0)'
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              Quick Start
            </motion.button>
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
                            {newField.type === 'dropdown' && (
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id="multiple"
                                  checked={newField.multiple}
                                  onChange={(e) => setNewField({ ...newField, multiple: e.target.checked })}
                                  className="mr-2"
                                />
                                <label htmlFor="multiple">Allow multiple selections</label>
                              </div>
                            )}
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
                        )}                      </div>
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
                                    <li key={i}>{option.label}</li>
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
      <Footer />
    </div>
  );
};

export default GithubIssueTemplatePreview;