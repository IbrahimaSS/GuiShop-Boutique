// URL de base du serveur (sans /api)
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
export default API_URL;
