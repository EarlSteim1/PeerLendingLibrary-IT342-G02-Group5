import React from "react";
import { Navigate } from "react-router-dom";
import StorageService from "../utils/storage";

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = StorageService.isLoggedIn();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

