import React, { useState, useEffect, useRef } from 'react';
import { fetchSnapshotData, readSnapshotData } from './services/xmlDataService';
import VmaChart from './components/VmaChart';

const VmaVisualizer = () => {
    const [vmaData, setVmaData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
  
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setIsLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                const data = readSnapshotData(text);
                setVmaData(data); // Update the state with the processed data
                setIsLoading(false);
            };
            reader.readAsText(file);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchSnapshotData('/data/parent_before.xml')
            .then(data => {
            setVmaData(data);
            setIsLoading(false);
        });
    }, []);
  
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
        {isLoading ? (
          <div>Loading dataset...</div>
        ) : (
          vmaData ? <VmaChart vmaData={vmaData} /> : <p>No data loaded.</p>
        )}
      </div>
    );
};

export default VmaVisualizer;
