// Servicio API para comunicarse con el backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiService {
    constructor() {
        this.baseUrl = API_URL;
    }

    getToken() {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la solicitud');
            }

            return data;
        } catch (error) {
            console.error(`API Error: ${endpoint}`, error);
            throw error;
        }
    }

    // Auth
    async register(name, email, password) {
        const data = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async login(email, password) {
        const data = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async logout() {
        this.removeToken();
        return { message: 'Logout exitoso' };
    }

    async getMe() {
        return this.request('/api/auth/me');
    }

    // Dashboard
    async getDashboard() {
        return this.request('/api/dashboard');
    }

    // Products
    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/products${query ? `?${query}` : ''}`);
    }

    async getProduct(id) {
        return this.request(`/api/products/${id}`);
    }

    async createProduct(data) {
        return this.request('/api/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProduct(id, data) {
        return this.request(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(id) {
        return this.request(`/api/products/${id}`, {
            method: 'DELETE',
        });
    }

    // Categories
    async getCategories() {
        return this.request('/api/categories');
    }

    async createCategory(data) {
        return this.request('/api/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Clients
    async getClients(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/clients${query ? `?${query}` : ''}`);
    }

    async createClient(data) {
        return this.request('/api/clients', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Inventory
    async getInventory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/inventory${query ? `?${query}` : ''}`);
    }

    async adjustInventory(data) {
        return this.request('/api/inventory', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Invoices
    async getInvoices(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/invoices${query ? `?${query}` : ''}`);
    }

    async getInvoice(id) {
        return this.request(`/api/invoices/${id}`);
    }

    async createInvoice(data) {
        return this.request('/api/invoices', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateInvoiceStatus(id, status) {
        return this.request(`/api/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }
}

export const api = new ApiService();
export default api;
