import axios from "axios";

const API_URL = "";

const authProvider = {
  login: async ({ username, password }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: username,
        password,
      });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error("Invalid email or password"));
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem("access_token")
      ? Promise.resolve()
      : Promise.reject();
  },

  checkError: (error) => {
    if (error.status === 401) {
      localStorage.removeItem("access_token");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => Promise.resolve(),

  getIdentity: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return Promise.reject();
    return Promise.resolve({ id: 1, fullName: "Admin" });
  },
};

export default authProvider;
