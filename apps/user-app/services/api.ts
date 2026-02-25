
interface SubscriptionSlot {
    slot_type: string;
    milk_type: string;
    quantity: number;
    time_slot: string;
    frequency: string;
    days: string[];
    is_enabled: boolean;
}

interface MilkSubscription {
    id?: number;
    user_id?: number;
    email: string; // Used for creation
    address_id: number;
    auto_pay: boolean;
    slots: SubscriptionSlot[];
    status?: string;
    created_at?: string;
}

const API_BASE = '/api';

async function fetchWithAuth(path: string, opts: RequestInit = {}) {
    const res = await fetch(path, { ...opts, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            // Ask server to clear cookie then clear client-side cached user info
            try {
                await fetch('/api/logout', { method: 'POST', credentials: 'include' });
            } catch (e) {
                // ignore
            }
            localStorage.removeItem('taaza_user_email');
            localStorage.removeItem('taaza_user_name');
            window.location.href = '/auth/login';
            throw new Error('Unauthorized');
        }
        throw new Error(res.statusText || 'Request failed');
    }
    return res.json();
}

export const MilkService = {
    // Get current pricing
    getPricing: async () => {
        return fetchWithAuth(`${API_BASE}/pricing`);
    },

    // Get user's subscription
    getSubscription: async (userId: number) => {
        try {
            return await fetchWithAuth(`${API_BASE}/subscription?user_id=${userId}`);
        } catch (err: any) {
            if (err.message === 'Not Found' || err.message === '404') return null;
            throw err;
        }
    },

    // Create new subscription
    createSubscription: async (data: any) => {
        return fetchWithAuth(`${API_BASE}/subscription`, { method: 'POST', body: JSON.stringify(data) });
    },

    // Update subscription
    updateSubscription: async (data: any) => {
        return fetchWithAuth(`${API_BASE}/subscription`, { method: 'PUT', body: JSON.stringify(data) });
    },

    // Skip/Resume delivery
    skipDelivery: async (subscriptionId: number, date: string, skip: boolean) => {
        return fetchWithAuth(`${API_BASE}/subscription/skip`, { method: 'POST', body: JSON.stringify({ subscription_id: subscriptionId, date, skip }) });
    }
};

export const UserService = {
    getAddresses: async (email: string) => {
        // Since we don't have a dedicated get addresses API for users yet in main.go (only admin), 
        // we might rely on the profile or implement it. 
        // Wait, main.go has http.HandleFunc("/addresses", enableCORS(addressHandler))
        return fetchWithAuth(`${API_BASE}/addresses?email=${email}`);
    },

    saveAddress: async (data: any) => {
        const method = data.id && !data.id.toString().startsWith('temp') ? 'PUT' : 'POST';
        return fetchWithAuth(`${API_BASE}/addresses`, { method, body: JSON.stringify(data) });
    }
};
