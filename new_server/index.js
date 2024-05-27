const express = require('express')
const cors = require('cors');
const WebSocket = require('ws');
const uuid = require('uuid');
const bodyParser = require('body-parser')
const app = express()
app.use(cors());
app.use(bodyParser.json())
const YOUR_TOKEN = '8e7397f63a44a6487d0f73f3e7d698946d4527efe4e5d3d8'; // jupyter server token
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

async function createSession(path = 'Topgrep.ipynb') {
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
    path: path,
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
async function Createfile(){
  try{
      const xsrfToken = await CreateCookie();
      console.log(typeof(xsrfToken))
      const headers = { 'Authorization': `Token ${YOUR_TOKEN}`, 'Content-Type': 'application/json','X-XSRFToken': xsrfToken };
      const data = {copy_from:'topjupyter.ipynb',ext:'.ipynb',type:'notebook',}
      const response = await axios.post(`${url}/api/contents`,data,{headers})
      console.log("File Created ",response.data);
      return response.data.path
  }catch(error){
      console.error('Error in creating file: ',error.message);
  }
}
async function killkernel(){
  const kernelId = await fetchKernelDetails()
  console.log(kernelId)
  if (!kernelId) {
    console.error('No kernel ID available to kill');
    return;
  }
  try {
    const xsrfToken = await CreateCookie();
    // console.log(typeof(xsrfToken))
    const headers = { 'Authorization': `Token ${YOUR_TOKEN}`, 'Content-Type': 'application/json','X-XSRFToken': xsrfToken };
    const response = await axios.post(`http://localhost:8888/api/kernels/${kernelId}/interrupt`,{},{headers});
    if (activeWebSockets[kernelId]) {
      console.log(`Closing WebSocket connection due to kernel kill: ${kernelId}`);
      activeWebSockets[kernelId].close();
      delete activeWebSockets[kernelId];
  }
    console.log('Kernel killed successfully ',response.status);
    return response.status
  } catch (error) {
    console.error('Error killing kernel:', error);
  }
}
const activeWebSockets = {};
async function executecodewithws(kernelId,sessionId,user_code){
    // console.log("Insisde ws")
    console.log(kernelId)
    const wsURL = url.replace('http', 'ws');
    // console.log(wsURL)
    let output = ''
    const kernelWebSocketURL = `${wsURL}/api/kernels/${kernelId}/channels?token=${YOUR_TOKEN}`;
    // console.log(kernelWebSocketURL)
    // console.log('active websockets ',activeWebSockets)
  //   if (activeWebSockets[kernelId]) {
  //     console.log(`Closing existing WebSocket connection for kernel ${kernelId}`);
  //     activeWebSockets[kernelId].close();
  //     delete activeWebSockets[kernelId];
  // }
    return new Promise((resolve,reject)=>{
        const ws = new WebSocket(kernelWebSocketURL);
        activeWebSockets[kernelId] = ws;
        // console.log('new websocket added to dict ',activeWebSockets)
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
                output = msg.content.text;
                resolve(output);}
            else if (msg.channel === 'iopub' && msg.header.msg_type === 'execute_result') {
                  // console.log('Output: \n',msg.content.data['text/plain'])
                  output += msg.content.data['text/plain'];}
                  // resolve(output);}     
            else if (msg.msg_type === 'execute_reply' && msg.channel === 'shell') {
                    console.log('Execution finished.');
                    ws.close(); 
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
        ws.on('close', () => {
                  console.log(`WebSocket connection to kernel ${kernelId} closed`);
                  delete activeWebSockets[kernelId];
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
app.post('/new-session', async (req, res) => {
          try {
              const session_path = await Createfile()
              const { sessionId, kernelId } = await createSession(session_path);
              // console.log(sessionId,kernelId)
              res.json({ success: true, sessionId, kernelId });
          } catch (error) {
              console.error('Error creating new session:', error.message);
              // res.status(500).json({ error: 'Failed to create a new session', details: error.message });
          }
      });
app.get("/jupyter",async (req,res)=>{
          
          try {
              const kernelId = await fetchKernelDetails()
              // console.log("Kernel: ",kernelId)
              if (kernelId !== ''){
                // Closing existing WebSocket connection if it exists
                if (activeWebSockets[kernelId]) {
                  console.log(`Closing WebSocket connection due to kernel restart: ${kernelId}`);
                  activeWebSockets[kernelId].close();
                  delete activeWebSockets[kernelId];
          }
                const response = await restartKernel(kernelId)
                console.log('Kernel restarted',response)
              }
              res.json({kernelId})
          } catch (error) {
              console.error("Error restarting kernel:", error.message);
              // res.status(500).json({ error: "An error occurred while executing the code" });
          }
          })
app.get("/jupyterkernel",async (req,res)=>{
          
            try {
                const kernelstat = await killkernel()
                res.json({kernelstat})
              }catch{
                console.error("Error getting kernelID for kernel kill:", error.message);
              }
            });
app.listen(5000,()=>{console.log("Port started at 5000")})


