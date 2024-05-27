import React, { useState, useEffect } from 'react';
import Cell from './Cell';
import axios from 'axios';

function CellManager() {
  const [cells, setCells] = useState([<Cell/>]);
  const [kernel,setKernel] = useState('Kernel running');
  const [count,setCount] = useState(1);
  
  
  const addCellHandler = () => {
    console.log("Add Cell is clicked");
    setCells(cells => [...cells, <Cell key={cells.length} />]);
  };

  const removeCellHandler = () => {
    console.log("Remove Cell is clicked");
    setCells(cells => cells.slice(0, -1));
  };
  const restartkernelHandler = async () => {
    try {
      const response = await axios.get('http://localhost:5000/jupyter')
      console.log(response.data)
      setCount(count + 1)
      setKernel(`Kernel restarted ${count}`)
    } catch (error) {
      console.error('Error in restarting kernel: ',error)
    }

  }
  const createNewSessionHandler = async () => {
    try {
      const response = await axios.post('http://localhost:5000/new-session');
      const { sessionId, kernelId } = response.data;
      console.log('New session created:', sessionId, kernelId);
      setKernel(`New session created: ${sessionId}`);
      const newWindow = window.open(window.location.href, '_blank');
      console.log(newWindow)
      if (newWindow) {
        newWindow.focus();
      } else {
        console.error('Failed to open a new window. Pop-up blocker might be enabled.');
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };
  const killKernelhandler = async () => {
    const response = await axios.get('http://localhost:5000/jupyterkernel')
    console.log(response.data.kernelstat)
    if (response.data.kernelstat === 204){
      setKernel('Kernel Killed')
    }
  };
  

  return (
    <div style ={{position:'absolute',top:'10px',left:'10px'}}>
      <div style={{ display:'flex', gap: '10px', marginBottom: '10px' }}>
      <button style={{
          backgroundColor: 'white',    
          color: 'black',               
          border: '2px solid #000000',
          marginBottom: '10px',  
          marginLeft: '10px',         
          width: '30px',                
          height: '30px',               
          cursor: 'pointer',            
          display: 'flex',              
          alignItems: 'center',         
          justifyContent: 'center',     
          fontSize: '16px',             
          fontWeight: 'bold',           
          outline: 'none',              
          userSelect: 'none',           
        }} onClick={addCellHandler}>+</button>
      <button style={{
          backgroundColor: 'white',    
          color: 'black',               
          border: '2px solid #000000',
          marginBottom: '10px',
          marginLeft: '10px',  
          width: '30px',                
          height: '30px',               
          cursor: 'pointer',            
          display: 'flex',              
          alignItems: 'center',         
          justifyContent: 'center',     
          fontSize: '16px',             
          fontWeight: 'bold',           
          outline: 'none',              
          userSelect: 'none',           
        }} onClick={removeCellHandler}>-</button>
        <button style={{
          backgroundColor: 'white',
          color: 'black',
          border: '2px solid #000000',
          marginBottom: '10px',
          marginLeft: '10px',
          width: 'auto',  
          minWidth: '120px',  
          height: '30px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',  
          fontWeight: 'bold',
          padding: '0 10px',  
          outline: 'none',
          userSelect: 'none',
          }} onClick={restartkernelHandler}>restart kernel</button>
          {kernel}
          <button style={{
            backgroundColor: 'white',
            color: 'black',
            border: '2px solid #000000',
            marginBottom: '10px',
            marginLeft: '10px',
            width: 'auto',
            minWidth: '150px',
            height: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '0 10px',
            outline: 'none',
            userSelect: 'none',
          }} onClick={createNewSessionHandler}>Create New Session</button>
          <button style={{
            backgroundColor: 'white',
            color: 'black',
            border: '2px solid #000000',
            marginBottom: '10px',
            marginLeft: '10px',
            width: 'auto',
            minWidth: '150px',
            height: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '0 10px',
            outline: 'none',
            userSelect: 'none',
          }} onClick={killKernelhandler}>Kill Kernel</button>
        </div>

      <div style={{ marginTop: '10px' }}>
        {cells.map((cell, index) => (
          <div key={index}>
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CellManager;