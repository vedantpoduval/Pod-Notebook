import React, {  useState } from 'react'
import axios from 'axios'

function Cell() {
  const [execute,onExecute] = useState('')    //useState(0)
  const [output,setOutput] = useState('')
  const handleChange = (e) => {
    const txtarea = e.target
    onExecute(txtarea.value)
  } 
 
  const executehandle = async () => {
    console.log("Executing code ... ",execute)
    try {
        const response = await axios.post("http://localhost:5000/jupyter",{code : execute})
        console.log("Server response ",response.data.output)
        setOutput(response.data.output)
    } catch (error) {
        console.error("Error sending code to server ",error)
        setOutput(error)
    }
  }
  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'row' }}>
        <button style={{
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
          }} onClick = {executehandle}> ▶ </button>
        <textarea style={{ width: '700px', 
                           minHeight: '100px', 
                           border: '1px solid #ccc',
                           borderRadius: '5px',
                           fontFamily: 'monospace',
                           padding: '10px',
                           resize: 'both' }} value={execute} onChange={handleChange} placeholder='Enter python code'></textarea>
        </div>
        {output && (
        <div> 
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
          marginLeft: '50px'}}>
          {output}
        </pre>
    </div>)}
    </>

  )
}

export default Cell

