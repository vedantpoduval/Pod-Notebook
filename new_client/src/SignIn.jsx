// SignIn.js
import React, { useState } from 'react';
import './SignIn.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
function SignIn() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => { 
        event.preventDefault();
        try {
         const response = await axios.post("http://localhost:5000/login",{name,password})
         const {success,token,message} = response.data
         if(success){
            alert(`Welcome, ${name}! Your token: ${token}`);
            navigate('/jupyter')
         }else{
            alert(message || 'Authentication failed!');   
         }
        } catch (error) {
            console.error('SignIn error:', error);
            alert('An error occurred during sign in. Please try again.');
        }
    };

    return (
        <div className="sign-in-container">
            <h1 className="heading">Welcome to Topgrep</h1>
            <form className="sign-in-form" onSubmit={handleSubmit}>
                <h2>Sign In</h2>
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Sign In</button>
            </form>
        </div>
    );
}

export default SignIn;