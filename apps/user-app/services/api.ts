
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

export const MilkService = {
    // Get current pricing
    getPricing: async () => {
        const res = await fetch(`${API_BASE}/pricing`);
        if (!res.ok) throw new Error('Failed to fetch pricing');
        return res.json();
    },

    // Get user's subscription
    getSubscription: async (userId: number) => {
        const res = await fetch(`${API_BASE}/subscription?user_id=${userId}`);
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch subscription');
        }
        return res.json();
    },

    // Create new subscription
    createSubscription: async (data: any) => {
        const res = await fetch(`${API_BASE}/subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create subscription');
        return res.json();
    },

    // Update subscription
    updateSubscription: async (data: any) => {
        const res = await fetch(`${API_BASE}/subscription`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update subscription');
        return res.json();
    },

    // Skip/Resume delivery
    skipDelivery: async (subscriptionId: number, date: string, skip: boolean) => {
        const res = await fetch(`${API_BASE}/subscription/skip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription_id: subscriptionId, date, skip })
        });
        if (!res.ok) throw new Error('Failed to update delivery status');
        return res.json();
    }
};

export const UserService = {
    getAddresses: async (email: string) => {
        // Since we don't have a dedicated get addresses API for users yet in main.go (only admin), 
        // we might rely on the profile or implement it. 
        // Wait, main.go has http.HandleFunc("/addresses", enableCORS(addressHandler))
        const res = await fetch(`${API_BASE}/addresses?email=${email}`);
        if (!res.ok) throw new Error('Failed to fetch addresses');
        return res.json();
    },

    saveAddress: async (data: any) => {
        const method = data.id && !data.id.toString().startsWith('temp') ? 'PUT' : 'POST';
        const res = await fetch(`${API_BASE}/addresses`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to save address');
        return res.json();
    }
};
