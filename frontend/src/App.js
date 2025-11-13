import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import "./css/global.css"; 

// Imports from the pages folder
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyBooks from "./pages/MyBooks"; // <-- 1. Import MyBooks.js

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mybooks" element={<MyBooks />} /> {/* <-- 2. Add the new Route */}
        {/* Fallback Route */}
        <Route path="*" element={<div className="card-container"><h2>404</h2><p>Page Not Found</p><Link to="/">Go Home</Link></div>} />
      </Routes>
    </Router>
  );
}

export default App;