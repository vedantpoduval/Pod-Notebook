
import React, { useState } from 'react';
import axios from 'axios';
import MonacoEditor from 'react-monaco-editor';

function Cell() {
  const [execute, onExecute] = useState('# Type your python code here\n');
  const [output, setOutput] = useState('');

  const handleChange = (newValue) => {
    onExecute(newValue);
    console.log('onChange', newValue);
  };

  const editorDidMount = (editor) => {
    console.log('editorDidMount', editor);
    editor.focus();
  };

  const executehandle = async () => {
    console.log("Executing code ... ", execute);
    try {
      const response = await axios.post("http://localhost:5000/jupyter", { code: execute });
      console.log("Server response ", response.data.output);
      setOutput(response.data.output);
    } catch (error) {
      console.error("Error sending code to server ", error);
      setOutput(`Error: ${error.message}`);
    }
  };

  const options = {
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true,
    theme: 'vs-dark',
    language: 'python'
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '10px' }}>
        <button aria-label="Execute Python Code" style={{
          backgroundColor: 'white',
          color: 'black',
          border: '2px solid black',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          marginRight: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold'
        }} onClick={executehandle}>▶</button>

        <div style={{ width: '600px', height: '250px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <MonacoEditor
            width="600" 
            height="250" 
            language="python"
            theme="vs-dark"
            value={execute}
            options={options}
            onChange={handleChange}
            editorDidMount={editorDidMount}
          />
        </div>
      </div>

      {output && (
        <div style={{ marginTop: '10px' }}> 
          <h3 style={{
            marginBottom: '5px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>Output:</h3>
          <pre style={{
            backgroundColor: '#f4f4f4',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            color: '#333',
            overflowX: 'auto' // Ensures the output is scrollable if too wide
          }}>
            {output}
          </pre>
        </div>
      )}
    </>
  );
}

export default Cell;