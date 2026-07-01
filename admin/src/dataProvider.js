import axios from "axios";

const API_URL = "";

const getToken = () => localStorage.getItem("access_token");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Resources that need admin-specific API paths
const ADMIN_RESOURCE_MAP = {
  applications: {
    list:   () => `/applications/admin/all`,
    getOne: (id) => `/applications/admin/${id}`,
    create: () => `/applications/admin`,
    update: (id) => `/applications/admin/${id}`,
    delete: (id) => `/applications/admin/${id}`,
  },
  "instructor-messages": {
    list:   () => `/instructor-messages`,
    getOne: (id) => `/instructor-messages/${id}`,
    delete: (id) => `/instructor-messages/${id}`,
  },
};

const resolvePath = (resource, op, id) => {
  const map = ADMIN_RESOURCE_MAP[resource];
  if (map && map[op]) return map[op](id);
  switch (op) {
    case "list":   return `/${resource}`;
    case "getOne": return `/${resource}/${id}`;
    case "create": return `/${resource}`;
    case "update": return `/${resource}/${id}`;
    case "delete": return `/${resource}/${id}`;
    default:       return `/${resource}`;
  }
};

const dataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const skip = (page - 1) * perPage;

    // Build filter query string
    const filters = params.filter || {};
    const queryParams = new URLSearchParams();
    queryParams.set("skip", skip);
    queryParams.set("limit", perPage);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") queryParams.set(key, value);
    });

    const url = resolvePath(resource, "list") + `?${queryParams.toString()}`;
    const response = await api.get(url);

    // Handle both paginated {items, total} and plain array responses
    if (response.data.items !== undefined) {
      return { data: response.data.items, total: response.data.total };
    }
    return { data: response.data, total: response.data.length };
  },

  getOne: async (resource, params) => {
    const response = await api.get(resolvePath(resource, "getOne", params.id));
    return { data: response.data };
  },

  getMany: async (resource, params) => {
    const results = await Promise.all(
      params.ids.map((id) => api.get(resolvePath(resource, "getOne", id)))
    );
    return { data: results.map((r) => r.data) };
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const skip = (page - 1) * perPage;
    const response = await api.get(
      `/${resource}?${params.target}=${params.id}&skip=${skip}&limit=${perPage}`
    );
    if (response.data.items !== undefined) {
      return { data: response.data.items, total: response.data.total };
    }
    return { data: response.data, total: response.data.length };
  },

  create: async (resource, params) => {
    const response = await api.post(resolvePath(resource, "create"), params.data);
    return { data: response.data };
  },

  update: async (resource, params) => {
    const response = await api.patch(resolvePath(resource, "update", params.id), params.data);
    return { data: response.data };
  },

  updateMany: async (resource, params) => {
    await Promise.all(
      params.ids.map((id) => api.patch(resolvePath(resource, "update", id), params.data))
    );
    return { data: params.ids };
  },

  delete: async (resource, params) => {
    await api.delete(resolvePath(resource, "delete", params.id));
    return { data: { id: params.id } };
  },

  deleteMany: async (resource, params) => {
    await Promise.all(params.ids.map((id) => api.delete(resolvePath(resource, "delete", id))));
    return { data: params.ids };
  },
};

export default dataProvider;
