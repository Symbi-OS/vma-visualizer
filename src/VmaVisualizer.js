import React, { useState, useEffect, useRef } from 'react';
import { readSnapshotData } from './services/xmlDataService';
import VmaChart from './components/VmaChart';

const PAGE_ATTRIBUTES = ["present", "read_write", "user_supervisor", "page_write_through", "page_cache_disabled", "accessed", "dirty", "page_access_type", "global", "execute_disable"];

const VmaVisualizer = () => {
  const [datasets, setDatasets] = useState([]); // Stores { data, filename } for each dataset
  const [selectedDatasetIndex1, setSelectedDatasetIndex1] = useState('');
  const [selectedDatasetIndex2, setSelectedDatasetIndex2] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState(PAGE_ATTRIBUTES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const data = await readSnapshotData(text); // Ensure this is awaited if asynchronous
            setDatasets(prev => [...prev, { data, filename: file.name }]);
            setIsLoading(false);
        };
        reader.readAsText(file);
    }
  };

  useEffect(() => {

  }, [datasets]);

  return (
    <div>
      <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".xml"
      />
      <button onClick={() => fileInputRef.current.click()} disabled={isLoading}>
          Load New Dataset
      </button>
      <select value={selectedAttribute} onChange={e => setSelectedAttribute(e.target.value)}>
        {PAGE_ATTRIBUTES.map((attr, index) => (
            <option key={index} value={attr}>{attr}</option>
        ))}
      </select>
      <select value={selectedDatasetIndex1} onChange={e => setSelectedDatasetIndex1(e.target.value)}>
        <option value="">Select Dataset 1</option>
        {datasets.map((item, index) => (
          <option key={index} value={index}>{item.filename}</option>
        ))}
      </select>
      {datasets.length > 1 ? (
        <select value={selectedDatasetIndex2} onChange={e => setSelectedDatasetIndex2(e.target.value)}>
          <option value="">Select Dataset 2 (for diff)</option>
          {datasets.map((item, index) => (
            <option key={index} value={index}>{item.filename}</option>
          ))}
      </select>
      ) :
      (<p></p>)}
      {isLoading ? (
        <div>Loading dataset...</div>
      ) : (
        <VmaChart 
          dataset1={selectedDatasetIndex1 !== '' ? datasets[selectedDatasetIndex1].data : null} 
          dataset2={selectedDatasetIndex2 !== '' ? datasets[selectedDatasetIndex2].data : null} 
          pageAttribute={selectedAttribute}
        />
      )}
    </div>
  );
};

export default VmaVisualizer;
