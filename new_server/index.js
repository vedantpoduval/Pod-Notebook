const express = require('express')
const cors = require('cors');
const WebSocket = require('ws');
const uuid = require('uuid');
const bodyParser = require('body-parser')
const app = express()
app.use(cors());
app.use(bodyParser.json())

const YOUR_TOKEN = ''; // jupyter server token
const users = {
  'vedant': '123',
};


app.post('/login', (req, res) => {
  const { name, password } = req.body;
  if (users[name] && users[name] === password) {
      const authToken = uuid.v4(); 
      res.json({ success: true, token: authToken });
  } else {
      res.json({ success: false, message: 'Invalid credentials' });
  }
});


const url = 'http://localhost:8888';
const axios = require('axios')
const headers = { 'Authorization': `Token ${YOUR_TOKEN}`, 'Content-Type': 'application/json' };
async function fetchJupyterSessions() {
    try {
      const response = await axios.get(`${url}/api/sessions/`,{headers});
      console.log('The response data is :', response.data);
    //   console.log('The response data is :', response.headers);
    //   return response.data[0].id

    } catch (error) {
      console.error('Error fetching Jupyter sessions:', error.message);
    }
  }
  async function fetchKernelDetails() {
    try {
      const response = await axios.get(`${url}/api/kernels/`,{headers});
      // console.log('The response data is :', response.data[0].id);
      return response.data[0].id
    } catch (error) {
      console.error('Error fetching kernel info:', error.message);
    }
  }

async function CreateCookie(){
    try{
        const response = await axios.get("http://localhost:8888/")
        const cookies = response.headers['set-cookie']
        const xsrfCookie = cookies.find(cookie => cookie.startsWith('_xsrf'))
        // console.log(xsrfCookie.split(';')[0].split('=')[1]);
        return xsrfCookie.split(';')[0].split('=')[1];
    }catch(error){
        console.error("Cookie not found ",error.message)
    }
}
async function restartKernel(kernelId){
  const xsrfToken = await CreateCookie();
  const headers = {
   'Authorization': `Token ${YOUR_TOKEN}`,
    'Content-Type': 'application/json',
    'X-XSRFToken': xsrfToken
  };
  try {
      const response = await axios.post(`${url}/api/kernels/${kernelId}/restart`,{},{headers})
      // console.log(response.data.id)
      return response.data.id
  } catch (error) {
      console.error('Error in restarting kernel ',error)
  }
 
}

function removeAnsiEscapeSequences(text) {
  // This regex matches the ANSI escape sequences
  const ansiEscapeRegex = /\x1B\[[0-?]*[ -/]*[@-~]/g;
  return text.replace(ansiEscapeRegex, '');
}

async function createSession() {
    console.log('Creating session')
    const xsrfToken = await CreateCookie();
  
  const headers = {
      'Authorization': `Token ${YOUR_TOKEN}`,
      'Content-Type': 'application/json',
      'X-XSRFToken': xsrfToken
    };
  const sessionData = {
    kernel: { name: 'python3' },
    name: 'mykernel',
    type: 'notebook',
    path: 'Topgrep.ipynb',
  };
  try {
    const response = await axios.post(`${url}/api/sessions`, sessionData, { headers });
    return {
        sessionId: response.data.id,
        kernelId: response.data.kernel.id
    }
  } catch (error) {
    console.error('Error creating session:', error.response ? error.response.data : error.message);
    throw error;
  }
}
// createSession()
// fetchJupyterSessions();


async function executecodewithws(kernelId,sessionId,user_code){
    // console.log("Insisde ws")
    const wsURL = url.replace('http', 'ws');
    // console.log(wsURL)
    let output = ''
    const kernelWebSocketURL = `${wsURL}/api/kernels/${kernelId}/channels?token=${YOUR_TOKEN}`;
    // console.log(kernelWebSocketURL)
    return new Promise((resolve,reject)=>{
        const ws = new WebSocket(kernelWebSocketURL);
        ws.on('open', function open() {
            // fetchJupyterSessions()
            console.log('WebSocket connection established');
            const executeRequest = {
                header: {
                    msg_id: uuid.v4(),
                    username: 'username',
                    session: sessionId,
                    msg_type: 'execute_request',
                    version: '5.3'
                },
                metadata: {},
                parent_header: {},
                content: {
                    code: user_code,
                    silent: false,
                    store_history: true,
                    user_expressions: {},
                    allow_stdin: false
                },
                channel : 'shell'
                };
                ws.send(JSON.stringify(executeRequest));

        });
        ws.on('message', function incoming(data) {
            // console.log("reading incoming data")
            const msg = JSON.parse(data);
            // console.log(msg)
            if (msg.channel === 'iopub' && msg.header.msg_type === 'execute_input') {
                console.log('Input: \n',msg.content.code)
            }
            else if (msg.channel === 'iopub' && msg.header.msg_type === 'stream') {
                console.log('Output: \n',msg.content.text)
                output += msg.content.text;}
            else if (msg.channel === 'iopub' && msg.header.msg_type === 'execute_result') {
                  console.log('Output: \n',msg.content.data['text/plain'])
                  output += msg.content.data['text/plain'];}
            else if (msg.msg_type === 'execute_reply' && msg.channel === 'shell') {
                    console.log('Execution finished.');
                    ws.close(); 
                    resolve(output);
                    }
            else if(msg.msg_type === 'error'){
                console.log("Error is : ",msg.content.ename)
                console.log("Error is : ",msg.content.evalue)
                console.log("Error is : ",msg.content.traceback)
                const cleanedErrorMessages = msg.content.traceback.map(removeAnsiEscapeSequences);
                console.log(cleanedErrorMessages.join('\n'))
                resolve(cleanedErrorMessages.join('\n'))
            }});
        ws.on('error', function error(err) { 
                    console.error('WebSocket error:', err.message);
                    reject(`WebSocket error: ${err.message}`);
                });
       })};
app.post("/jupyter",async (req,res)=>{
        const userCode = req.body.code
        console.log("received code to execute: ",userCode)
        try {
            const {kernelId,sessionId} = await createSession()
            // console.log("Your ids are ",kernelId,sessionId)
            const output = await executecodewithws(kernelId,sessionId,userCode)
            res.json({output});
        } catch (error) {
            console.error("Error executing code:", error);
            res.status(500).json({ error: "An error occurred while executing the code" });
        }
        })
app.get("/jupyter",async (req,res)=>{
          
          try {
              const kernelId = await fetchKernelDetails()
              // console.log("Kernel: ",kernelId)
              if (kernelId !== ''){
                const response = await restartKernel(kernelId)
                console.log('Kernel restarted',response)
              }
              res.json({kernelId})
          } catch (error) {
              console.error("Error restarting kernel:", error.message);
              // res.status(500).json({ error: "An error occurred while executing the code" });
          }
          })

app.listen(5000,()=>{console.log("Port started at 5000")})