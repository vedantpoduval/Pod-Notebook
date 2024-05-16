import { useState } from 'react'
// import './App.css'
import Cell from './Cell'
import CellManager from './CellManager'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import SignIn from './SignIn';
import Tp from './tp';
function App() {
  const router = createBrowserRouter([
    {
        path: '/',
        element: <Tp/>,
    },
    {
        path: '/login',
        element: <SignIn/>,
    },
    {
      path: '/jupyter',
      element: <CellManager/>,
  }])
return (
    <> 
    <RouterProvider router={router} />
    
    </>
  )
}

export default App



