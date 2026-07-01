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

      // Fetch role and instructor profile
      const meRes = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const role = meRes.data.role;
      localStorage.setItem("user_role", role);

      if (role === "instructor") {
        const profRes = await axios.get(`${API_URL}/instructor-messages/profile`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        localStorage.setItem("instructor_profile", JSON.stringify(profRes.data));
      }

      // Block users with student role
      if (role === "student") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return Promise.reject(new Error("Access denied. Students cannot log in here."));
      }

      return Promise.resolve();
    } catch (err) {
      return Promise.reject(new Error(err.message || "Invalid email or password"));
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("instructor_profile");
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem("access_token")
      ? Promise.resolve()
      : Promise.reject();
  },

  checkError: (error) => {
    const status = error.status || error.response?.status;
    if (status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("instructor_profile");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: () => {
    const role = localStorage.getItem("user_role") || "admin";
    return Promise.resolve(role);
  },

  getIdentity: async () => {
    const role = localStorage.getItem("user_role") || "admin";
    if (role === "instructor") {
      const profile = JSON.parse(localStorage.getItem("instructor_profile") || "{}");
      return Promise.resolve({
        id: profile.id ?? 0,
        fullName: `${profile.title ? profile.title + " " : ""}${profile.name ?? "Instructor"}`,
        avatar: profile.photo_url ?? undefined,
        role: "instructor",
      });
    }
    return Promise.resolve({ id: 1, fullName: "Admin", role: "admin" });
  },
};

export default authProvider;
