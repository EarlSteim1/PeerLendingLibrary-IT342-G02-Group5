import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import "./css/global.css"; 

// Imports from the pages folder
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyBooks from "./pages/MyBooks";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mybooks" 
          element={
            <ProtectedRoute>
              <MyBooks />
            </ProtectedRoute>
          } 
        />
        {/* Fallback Route */}
        <Route path="*" element={<div className="card-container"><h2>404</h2><p>Page Not Found</p><Link to="/">Go Home</Link></div>} />
      </Routes>
    </Router>
  );
}

export default App;