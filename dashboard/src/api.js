import axios from "axios";

const api = axios.create({
  // Set REACT_APP_API_URL to the deployed API origin. Defaults to the local API.
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3002",
  timeout: 10000,
});

export default api;
