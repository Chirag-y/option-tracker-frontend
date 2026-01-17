import axios from "axios";

export default axios.create({
  baseURL: "https://YOUR_BACKEND_URL/api"
});