import axios from "axios";

const api = axios.create({
  // Set REACT_APP_API_URL to the deployed API origin. Defaults to the local API.
  baseURL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:3002"),
  timeout: 30000,
  withCredentials: true,
});

export default api;
