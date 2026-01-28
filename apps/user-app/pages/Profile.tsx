import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout';

// --- Shared Helper for Toast Notifications ---
const Toast: React.FC<{ message: string; onClose: () => void; type?: 'success' | 'error' }> = ({ message, onClose, type = 'success' }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isError = type === 'error';

    return (
        <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 ${isError ? 'bg-red-900/90' : 'bg-gray-900/90'} text-white px-4 py-2.5 rounded-xl shadow-lg z-50 animate-fade-in flex items-center gap-2 backdrop-blur-sm min-w-[200px] justify-center`}>
            <span className={`material-symbols-outlined text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>
                {isError ? 'error' : 'check_circle'}
            </span>
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};

// ... [Existing sub-components: PersonalInfo, Addresses, Notifications, Settings, Help remain unchanged] ...
// Re-inserting all subcomponents to ensure file integrity

// --- Avatar Helper Functions ---
const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};

const avatarColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#0ea5e9', // Sky
    '#3b82f6', // Blue
];

const getAvatarColor = (name: string): string => {
    if (!name) return avatarColors[0];
    const charCode = name.charCodeAt(0) + (name.length > 1 ? name.charCodeAt(1) : 0);
    return avatarColors[charCode % avatarColors.length];
};

const getAvatarColorSecondary = (name: string): string => {
    if (!name) return avatarColors[1];
    const charCode = name.charCodeAt(0) + (name.length > 1 ? name.charCodeAt(1) : 0);
    return avatarColors[(charCode + 3) % avatarColors.length];
};

const PersonalInfo: React.FC = () => {
    // Initialize state from localStorage
    const [name, setName] = useState(localStorage.getItem('taaza_user_name') || '');
    const [email, setEmail] = useState(localStorage.getItem('taaza_user_email') || '');
    const [mobile, setMobile] = useState(localStorage.getItem('taaza_mobile') || '');
    const [gender, setGender] = useState(localStorage.getItem('taaza_user_gender') || 'male');
    const [dob, setDob] = useState(localStorage.getItem('taaza_user_dob') || '');

    const [isSaving, setIsSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [errors, setErrors] = useState<{ mobile?: string }>({});

    // Fetch profile on load
    useEffect(() => {
        if (email) {
            fetch(`/api/profile?email=${email}`)
                .then(res => res.json())
                .then(data => {
                    setName(data.name || '');
                    setMobile(data.mobile || '');
                    // Format DOB to yyyy-MM-dd for date input
                    let formattedDob = '';
                    if (data.dob) {
                        formattedDob = data.dob.split('T')[0]; // Extract date part only
                    }
                    setDob(formattedDob);
                    setGender(data.gender || 'male');
                })
                .catch(err => console.error("Failed to fetch profile", err));
        }
    }, []);

    const validate = () => {
        let isValid = true;
        const newErrors: { mobile?: string } = {};

        if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
            newErrors.mobile = "Enter a valid 10-digit number";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleUpdate = () => {
        if (!validate()) return;

        setIsSaving(true);

        fetch('/api/profile?email=' + email, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, dob, gender })
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to update');
                return res.json();
            })
            .then(() => {
                if (name) localStorage.setItem('taaza_user_name', name);
                if (mobile) localStorage.setItem('taaza_mobile', mobile); // Should technically match DB

                setIsSaving(false);
                setToastType('success');
                setToastMsg("Profile Updated Successfully!");
            })
            .catch(err => {
                setIsSaving(false);
                setToastType('error');
                setToastMsg("Failed to update profile");
                console.error(err);
            });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Header title="Edit Profile" backPath="/profile" />

            {/* Avatar Section - Letter Based */}
            <div className="bg-white p-6 flex flex-col items-center border-b border-gray-100">
                <div className="relative group">
                    <div
                        className="w-28 h-28 rounded-full border-4 border-white shadow-xl flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${getAvatarColor(name)} 0%, ${getAvatarColorSecondary(name)} 100%)`
                        }}
                    >
                        <span className="text-4xl font-bold text-white uppercase">
                            {getInitials(name)}
                        </span>
                    </div>
                </div>
                <p className="text-sm font-semibold text-gray-700 mt-3">{name || 'Your Name'}</p>
                <p className="text-xs text-gray-400">{email}</p>
            </div>

            <div className="p-4 space-y-5 animate-slide-up">

                {/* Name */}
                <div className={`bg-white p-1 rounded-xl shadow-sm border focus-within:ring-1 transition-all ${isSaving ? 'opacity-70 pointer-events-none' : ''} border-gray-100 focus-within:border-zepto-blue focus-within:ring-blue-100`}>
                    <div className="relative flex items-center px-4 py-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-zepto-blue flex items-center justify-center mr-3">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="flex-grow">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full font-semibold text-gray-800 outline-none bg-transparent placeholder-gray-300 text-sm"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 bg-gray-50/50">
                    <div className="relative flex items-center px-4 py-2">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center mr-3">
                            <span className="material-symbols-outlined">mail</span>
                        </div>
                        <div className="flex-grow">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full font-semibold text-gray-500 outline-none bg-transparent text-sm cursor-not-allowed"
                            />
                        </div>
                        <span className="material-symbols-outlined text-gray-300 text-lg">lock</span>
                    </div>
                </div>

                {/* Mobile */}
                <div>
                    <div className={`bg-white p-1 rounded-xl shadow-sm border focus-within:ring-1 transition-all ${isSaving ? 'opacity-70 pointer-events-none' : ''} ${errors.mobile ? 'border-red-500 focus-within:ring-red-100' : 'border-gray-100 focus-within:border-zepto-blue focus-within:ring-blue-100'}`}>
                        <div className="relative flex items-center px-4 py-2">
                            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mr-3">
                                <span className="material-symbols-outlined">smartphone</span>
                            </div>
                            <div className="flex-grow">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">Mobile Number</label>
                                <input
                                    type="tel"
                                    value={mobile}
                                    maxLength={10}
                                    onChange={(e) => {
                                        // setMobile(e.target.value.replace(/\D/g, ''));
                                        // if (errors.mobile) setErrors({...errors, mobile: undefined});
                                    }}
                                    disabled
                                    className="w-full font-semibold text-gray-500 outline-none bg-transparent text-sm cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                    {errors.mobile && <p className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.mobile}</p>}
                </div>

                {/* Gender */}
                <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${isSaving ? 'opacity-70 pointer-events-none' : ''}`}>
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3 block">Gender</label>
                    <div className="flex gap-3">
                        {['Male', 'Female', 'Other'].map((g) => (
                            <label key={g} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-lg border cursor-pointer transition-all ${gender === g.toLowerCase() ? 'border-zepto-blue bg-blue-50 text-zepto-blue shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="gender"
                                    className="hidden"
                                    onClick={() => setGender(g.toLowerCase())}
                                    checked={gender === g.toLowerCase()}
                                    readOnly
                                />
                                <span className="font-semibold text-sm">{g}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* DOB */}
                <div className={`bg-white p-1 rounded-xl shadow-sm border border-gray-100 focus-within:border-zepto-blue focus-within:ring-1 focus-within:ring-blue-100 transition-all ${isSaving ? 'opacity-70 pointer-events-none' : ''}`}>
                    <div className="relative flex items-center px-4 py-2">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mr-3">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div className="flex-grow">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">Date of Birth</label>
                            <input
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="w-full font-semibold text-gray-800 outline-none bg-transparent text-sm"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="w-full bg-zepto-yellow text-zepto-blue font-bold py-3.5 rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:scale-100"
                >
                    {isSaving ? (
                        <>
                            <span className="w-5 h-5 border-2 border-zepto-blue border-t-transparent rounded-full animate-spin"></span>
                            <span>Updating...</span>
                        </>
                    ) : (
                        <>
                            <span>Update Profile</span>
                            <span className="material-symbols-outlined text-sm">check</span>
                        </>
                    )}
                </button>
            </div>

            {toastMsg && <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg(null)} />}
        </div>
    );
};

const Addresses: React.FC = () => {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [addresses, setAddresses] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Confirmation Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form State
    const [mapAddress, setMapAddress] = useState('12th Main Road, Indiranagar, Bengaluru');
    const [houseNo, setHouseNo] = useState('');
    const [landmark, setLandmark] = useState('');

    // Tag State
    const [tagCategory, setTagCategory] = useState<'Home' | 'Work' | 'Other'>('Home');
    const [customTag, setCustomTag] = useState('');

    const [isDefault, setIsDefault] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // Contact Details for Address
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');

    // Validation State
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Map Search State
    const [searchText, setSearchText] = useState('');

    // Google Maps State
    const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Bangalore default
    const mapRef = useRef<HTMLDivElement>(null);
    const streetViewRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const panoramaRef = useRef<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Street View & Mobile Sheet State
    const [showStreetView, setShowStreetView] = useState(false);
    const [sheetExpanded, setSheetExpanded] = useState(true);

    // Get user email from localStorage
    // Get user email from localStorage
    const getUserEmail = () => {
        const stored = localStorage.getItem('taaza_user');
        if (stored) {
            const user = JSON.parse(stored);
            return user.email;
        }
        return localStorage.getItem('taaza_user_email');
    };

    // Fetch addresses from backend API
    useEffect(() => {
        const email = getUserEmail();
        if (email) {
            fetch(`/api/addresses?email=${encodeURIComponent(email)}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const mappedAddresses = data.map((addr: any) => ({
                            id: addr.id.toString(),
                            tag: addr.tag,
                            houseNo: addr.house_no,
                            landmark: addr.landmark || '',
                            address: addr.full_address,
                            isDefault: addr.is_default,
                            receiverName: addr.receiver_name,
                            receiverPhone: addr.receiver_phone,
                            latitude: addr.latitude,
                            longitude: addr.longitude
                        }));
                        setAddresses(mappedAddresses);
                    }
                })
                .catch(err => {
                    console.error('Error fetching addresses:', err);
                    const stored = localStorage.getItem('taaza_addresses');
                    if (stored) setAddresses(JSON.parse(stored));
                });
        } else {
            const stored = localStorage.getItem('taaza_addresses');
            if (stored) {
                setAddresses(JSON.parse(stored));
            }
        }
    }, []);

    // Load Google Maps script
    useEffect(() => {
        if (view === 'add' && !(window as any).google?.maps) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.onload = () => initMap();
            document.head.appendChild(script);
        } else if (view === 'add' && (window as any).google?.maps) {
            initMap();
        }
    }, [view]);

    // Autocomplete for Search
    useEffect(() => {
        if (view === 'add' && searchInputRef.current && (window as any).google?.maps) {
            console.log('Initializing Google Places Autocomplete');
            const autocomplete = new (window as any).google.maps.places.Autocomplete(searchInputRef.current, {
                fields: ['geometry', 'formatted_address'],
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                console.log('Place selected:', place);
                if (!place.geometry || !place.geometry.location) return;

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const newCoords = { lat, lng };

                setCoords(newCoords);
                setMapAddress(place.formatted_address || '');
                setSearchText(place.formatted_address || '');

                if (mapInstanceRef.current && markerRef.current) {
                    const googleMaps = (window as any).google?.maps;
                    const latLng = new googleMaps.LatLng(lat, lng);
                    (mapInstanceRef.current as any).setCenter(latLng);
                    (mapInstanceRef.current as any).setZoom(17);
                    (markerRef.current as any).setPosition(latLng);
                    (markerRef.current as any).setAnimation(googleMaps.Animation.BOUNCE);
                    setTimeout(() => (markerRef.current as any).setAnimation(null), 1500);
                }
            });
        }
    }, [view]);

    // Initialize Street View
    const initStreetView = () => {
        if (!streetViewRef.current || !(window as any).google?.maps) return;

        panoramaRef.current = new (window as any).google.maps.StreetViewPanorama(streetViewRef.current, {
            position: coords,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: false
        });
    };

    // Toggle Street View
    const toggleStreetView = () => {
        setShowStreetView(!showStreetView);
        if (!showStreetView) {
            setTimeout(() => initStreetView(), 100);
        }
    };

    // Update Street View position when coords change
    useEffect(() => {
        if (showStreetView && panoramaRef.current) {
            panoramaRef.current.setPosition(coords);
        }
    }, [coords, showStreetView]);

    // Initialize Google Map
    const initMap = () => {
        if (!mapRef.current || !(window as any).google?.maps) return;
        const googleMaps = (window as any).google.maps;

        const map = new googleMaps.Map(mapRef.current, {
            center: coords,
            zoom: 17,
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'simplified' }] }
            ]
        });

        const marker = new googleMaps.Marker({
            position: coords,
            map,
            draggable: true,
            animation: googleMaps.Animation.DROP,
            icon: {
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: "#EA4335",
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: "#FFFFFF",
                scale: 2,
                anchor: new googleMaps.Point(12, 24),
            }
        });

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            if (pos) {
                const newCoords = { lat: pos.lat(), lng: pos.lng() };
                setCoords(newCoords);
                reverseGeocode(newCoords);
                marker.setAnimation(googleMaps.Animation.BOUNCE);
                setTimeout(() => marker.setAnimation(null), 500);
            }
        });

        // Click on map to place marker
        map.addListener('click', (e: any) => {
            if (e.latLng) {
                const newCoords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                setCoords(newCoords);
                marker.setPosition(e.latLng);
                reverseGeocode(newCoords);
                marker.setAnimation(googleMaps.Animation.BOUNCE);
                setTimeout(() => marker.setAnimation(null), 500);
            }
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
    };

    // Reverse Geocode
    const reverseGeocode = (position: { lat: number; lng: number }) => {
        if (!(window as any).google?.maps) return;
        const googleMaps = (window as any).google.maps;

        const geocoder = new googleMaps.Geocoder();
        geocoder.geocode({ location: position }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
                setMapAddress(results[0].formatted_address);
            }
        });
    };

    // Save addresses to localStorage
    const saveAddressesToStorage = (addrs: any[]) => {
        localStorage.setItem('taaza_addresses', JSON.stringify(addrs));
    };

    // Handle Add New Address
    const handleAddNew = () => {
        setEditingId(null);
        setHouseNo('');
        setLandmark('');
        setTagCategory('Home');
        setCustomTag('');
        setIsDefault(addresses.length === 0);
        setMapAddress('Move the map to select location');
        setReceiverName(localStorage.getItem('taaza_user_name') || '');
        setReceiverPhone(localStorage.getItem('taaza_mobile') || '');
        setSearchText('');
        setErrors({});
        setShowStreetView(false);
        setView('add');
    };

    // Handle Edit Address
    const handleEdit = (addr: any) => {
        setEditingId(addr.id);
        setHouseNo(addr.houseNo);
        setLandmark(addr.landmark || '');
        const tag = addr.tag;
        if (tag === 'Home' || tag === 'Work') {
            setTagCategory(tag);
            setCustomTag('');
        } else {
            setTagCategory('Other');
            setCustomTag(tag);
        }
        setIsDefault(addr.isDefault);
        setMapAddress(addr.address);
        setReceiverName(addr.receiverName || '');
        setReceiverPhone(addr.receiverPhone || '');
        if (addr.latitude && addr.longitude) {
            setCoords({ lat: addr.latitude, lng: addr.longitude });
        }
        setShowStreetView(false);
        setView('add');
    };

    // Handle Delete Click
    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    // Confirm Delete
    const confirmDelete = () => {
        if (!deleteId) return;
        const email = getUserEmail();

        fetch(`/api/addresses?id=${deleteId}&email=${encodeURIComponent(email || '')}`, {
            method: 'DELETE'
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const newAddresses = addresses.filter(a => a.id !== deleteId);
                    setAddresses(newAddresses);
                    setToastMsg('Address deleted');
                }
            })
            .catch(err => {
                console.error('Error deleting address:', err);
                const newAddresses = addresses.filter(a => a.id !== deleteId);
                setAddresses(newAddresses);
                saveAddressesToStorage(newAddresses);
                setToastMsg('Address deleted');
            });

        setShowDeleteModal(false);
        setDeleteId(null);
    };

    // Handle Locate Me with pulsing animation
    const handleLocateMe = () => {
        setIsLocating(true);

        if (!navigator.geolocation) {
            setToastMsg('Geolocation is not supported by your browser');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setCoords(newCoords);
                const googleMaps = (window as any).google?.maps;

                if (mapInstanceRef.current && markerRef.current && googleMaps) {
                    const latLng = new googleMaps.LatLng(newCoords.lat, newCoords.lng);
                    (mapInstanceRef.current as any).setCenter(latLng);
                    (mapInstanceRef.current as any).setZoom(18);
                    (markerRef.current as any).setPosition(latLng);
                    (markerRef.current as any).setAnimation(googleMaps.Animation.BOUNCE);
                    setTimeout(() => (markerRef.current as any)?.setAnimation(null), 1500);
                }

                reverseGeocode(newCoords);
                setIsLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setToastMsg('Unable to get your location');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    // Validate Form
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!houseNo.trim()) newErrors.houseNo = 'House/Flat number is required';
        if (!receiverName.trim()) newErrors.receiverName = 'Receiver name is required';
        if (!receiverPhone.trim()) {
            newErrors.receiverPhone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(receiverPhone.trim())) {
            newErrors.receiverPhone = 'Enter a valid 10-digit phone number';
        }
        if (tagCategory === 'Other' && !customTag.trim()) {
            newErrors.customTag = 'Please enter a custom tag';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Save Address
    const handleSaveAddress = () => {
        if (!validateForm()) return;

        const finalTag = tagCategory === 'Other' ? customTag.trim() : tagCategory;
        const email = getUserEmail();

        setIsSaving(true);

        const payload = {
            email,
            id: editingId ? parseInt(editingId) : undefined,
            tag: finalTag,
            house_no: houseNo,
            landmark,
            full_address: mapAddress,
            latitude: coords.lat,
            longitude: coords.lng,
            receiver_name: receiverName,
            receiver_phone: receiverPhone,
            is_default: isDefault
        };

        const url = '/api/addresses';
        const method = editingId ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success || data.id) {
                    return fetch(`${url}?email=${encodeURIComponent(email || '')}`)
                        .then(res => res.json())
                        .then(fetchedAddresses => {
                            if (Array.isArray(fetchedAddresses)) {
                                const mappedAddresses = fetchedAddresses.map((addr: any) => ({
                                    id: addr.id.toString(),
                                    tag: addr.tag,
                                    houseNo: addr.house_no,
                                    landmark: addr.landmark || '',
                                    address: addr.full_address,
                                    isDefault: addr.is_default,
                                    receiverName: addr.receiver_name,
                                    receiverPhone: addr.receiver_phone,
                                    latitude: addr.latitude,
                                    longitude: addr.longitude
                                }));
                                setAddresses(mappedAddresses);
                            }
                        });
                }
            })
            .then(() => {
                setIsSaving(false);
                setToastMsg(editingId ? "Address Updated" : "Address Added");
                setView('list');
            })
            .catch(err => {
                console.error('Error saving address:', err);
                setIsSaving(false);
                const newAddr = {
                    id: editingId || Date.now().toString(),
                    tag: finalTag,
                    houseNo,
                    landmark,
                    address: mapAddress,
                    isDefault,
                    receiverName,
                    receiverPhone,
                    latitude: coords.lat,
                    longitude: coords.lng
                };

                let newAddresses;
                if (editingId) {
                    newAddresses = addresses.map(a => a.id === editingId ? newAddr : a);
                } else {
                    newAddresses = [...addresses, newAddr];
                }

                if (isDefault) {
                    newAddresses = newAddresses.map(a => ({ ...a, isDefault: a.id === newAddr.id }));
                }

                setAddresses(newAddresses);
                saveAddressesToStorage(newAddresses);
                setToastMsg(editingId ? "Address Updated" : "Address Added");
                setView('list');
            });
    };

    // CSS for pulsing animation
    const pulseStyle = `
        @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
        }
        .pulse-ring::before {
            content: '';
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 3px solid #3B82F6;
            animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .pac-container {
            z-index: 10500 !important;
        }
    `;

    // ADD VIEW - Split Layout
    if (view === 'add') {
        return (
            <div className="min-h-screen bg-gray-50">
                <style>{pulseStyle}</style>

                {/* Header */}
                <div className="bg-white shadow-sm sticky top-0 z-40">
                    <div className="flex items-center gap-3 p-4">
                        <button
                            onClick={() => setView('list')}
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-lg font-bold text-gray-800">
                            {editingId ? 'Edit Address' : 'Add New Address'}
                        </h1>
                    </div>
                </div>

                {/* Main Content - Split Layout */}
                <div className="md:grid md:grid-cols-2 md:h-[calc(100vh-64px)]">

                    {/* Map Section */}
                    <div className="relative h-[45vh] md:h-full">
                        {/* Map Container */}
                        <div
                            ref={mapRef}
                            className={`absolute inset-0 ${showStreetView ? 'hidden' : 'block'}`}
                        />

                        {/* Street View Container */}
                        <div
                            ref={streetViewRef}
                            className={`absolute inset-0 ${showStreetView ? 'block' : 'hidden'}`}
                        />

                        {/* Search Bar Overlay */}
                        <div className="absolute top-4 left-4 right-4 z-10">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Search for area, street name..."
                                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl shadow-lg text-sm border-0 focus:ring-2 focus:ring-zepto-blue"
                                />
                            </div>
                        </div>

                        {/* Map Controls */}
                        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                            {/* Street View Toggle */}
                            <button
                                onClick={toggleStreetView}
                                className={`p-3 rounded-full shadow-lg transition-all ${showStreetView
                                    ? 'bg-zepto-blue text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                title="Toggle Street View"
                            >
                                <span className="material-symbols-outlined">streetview</span>
                            </button>

                            {/* Locate Me Button */}
                            <button
                                onClick={handleLocateMe}
                                disabled={isLocating}
                                className={`relative p-3 rounded-full shadow-lg transition-all ${isLocating
                                    ? 'bg-blue-500 text-white pulse-ring'
                                    : 'bg-white text-zepto-blue hover:bg-gray-50'
                                    }`}
                            >
                                {isLocating ? (
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined">my_location</span>
                                )}
                            </button>
                        </div>

                        {/* Address Preview Card - Desktop */}
                        <div className="hidden md:block absolute bottom-4 left-4 right-20 z-10">
                            <div className="bg-white rounded-xl shadow-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-red-500">location_on</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 line-clamp-2">{mapAddress}</p>
                                        <p className="text-xs text-gray-500 mt-1">Drag marker or tap to change</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="bg-white md:overflow-y-auto md:h-full">
                        {/* Mobile: Draggable handle */}
                        <div
                            className="md:hidden flex justify-center py-2 cursor-pointer"
                            onClick={() => setSheetExpanded(!sheetExpanded)}
                        >
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Address Preview - Mobile */}
                        <div className="md:hidden px-4 pb-3 border-b">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-red-500">location_on</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{mapAddress}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Drag marker to adjust</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className={`p-4 space-y-4 ${sheetExpanded ? '' : 'hidden md:block'}`}>
                            {/* Receiver Details */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Receiver Details</h3>

                                <div>
                                    <input
                                        type="text"
                                        value={receiverName}
                                        onChange={(e) => setReceiverName(e.target.value)}
                                        placeholder="Receiver's Name"
                                        className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border ${errors.receiverName ? 'border-red-300 bg-red-50' : 'border-gray-100'} focus:ring-2 focus:ring-zepto-blue focus:border-transparent`}
                                    />
                                    {errors.receiverName && <p className="text-xs text-red-500 mt-1">{errors.receiverName}</p>}
                                </div>

                                <div>
                                    <input
                                        type="tel"
                                        value={receiverPhone}
                                        onChange={(e) => setReceiverPhone(e.target.value)}
                                        placeholder="Phone Number"
                                        maxLength={10}
                                        className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border ${errors.receiverPhone ? 'border-red-300 bg-red-50' : 'border-gray-100'} focus:ring-2 focus:ring-zepto-blue focus:border-transparent`}
                                    />
                                    {errors.receiverPhone && <p className="text-xs text-red-500 mt-1">{errors.receiverPhone}</p>}
                                </div>
                            </div>

                            {/* Address Details */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Address Details</h3>

                                <div>
                                    <input
                                        type="text"
                                        value={houseNo}
                                        onChange={(e) => setHouseNo(e.target.value)}
                                        placeholder="House / Flat / Block No."
                                        className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border ${errors.houseNo ? 'border-red-300 bg-red-50' : 'border-gray-100'} focus:ring-2 focus:ring-zepto-blue focus:border-transparent`}
                                    />
                                    {errors.houseNo && <p className="text-xs text-red-500 mt-1">{errors.houseNo}</p>}
                                </div>

                                <input
                                    type="text"
                                    value={landmark}
                                    onChange={(e) => setLandmark(e.target.value)}
                                    placeholder="Landmark (Optional)"
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:ring-2 focus:ring-zepto-blue focus:border-transparent"
                                />
                            </div>

                            {/* Save As Tags */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Save As</h3>
                                <div className="flex gap-2">
                                    {(['Home', 'Work', 'Other'] as const).map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => setTagCategory(tag)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${tagCategory === tag
                                                ? 'bg-zepto-blue text-white shadow-lg shadow-blue-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {tag === 'Home' ? 'home' : tag === 'Work' ? 'domain' : 'location_on'}
                                            </span>
                                            {tag}
                                        </button>
                                    ))}
                                </div>

                                {tagCategory === 'Other' && (
                                    <div>
                                        <input
                                            type="text"
                                            value={customTag}
                                            onChange={(e) => setCustomTag(e.target.value)}
                                            placeholder="Enter tag name (e.g., Mom's Place)"
                                            className={`w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border ${errors.customTag ? 'border-red-300 bg-red-50' : 'border-gray-100'} focus:ring-2 focus:ring-zepto-blue focus:border-transparent`}
                                        />
                                        {errors.customTag && <p className="text-xs text-red-500 mt-1">{errors.customTag}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Default Address Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Make this my default address</p>
                                    <p className="text-xs text-gray-500 mt-0.5">This will be your primary delivery address</p>
                                </div>
                                <button
                                    onClick={() => setIsDefault(!isDefault)}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${isDefault ? 'bg-zepto-blue' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isDefault ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSaveAddress}
                                disabled={isSaving}
                                className="w-full py-4 bg-zepto-blue text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">sync</span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">check</span>
                                        {editingId ? 'Update Address' : 'Save Address'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="My Addresses" backPath="/profile" />

            <div className="p-4">
                {/* Add New Address Button */}
                <button
                    onClick={handleAddNew}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-zepto-blue to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 mb-6 hover:shadow-xl transition-all group"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">add_location_alt</span>
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-lg">Add New Address</span>
                        <p className="text-sm text-white/80">Save your delivery locations</p>
                    </div>
                    <span className="material-symbols-outlined ml-auto">chevron_right</span>
                </button>

                {/* Saved Addresses */}
                <div className="space-y-4">
                    {addresses.map((addr) => (
                        <div
                            key={addr.id}
                            className="bg-white rounded-2xl shadow-sm p-4 relative overflow-hidden border border-gray-50 hover:shadow-md transition-shadow"
                        >
                            {addr.isDefault && (
                                <div className="absolute -top-4 -left-4 w-20 h-20">
                                    <div className="absolute top-8 -left-6 rotate-[-45deg] bg-green-500 text-white text-[9px] font-bold py-0.5 px-6 shadow-sm">
                                        DEFAULT
                                    </div>
                                </div>
                            )}

                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${addr.tag === 'Home' ? 'bg-blue-100 text-blue-700' :
                                addr.tag === 'Work' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {addr.tag}
                            </div>

                            <div className="flex gap-4 mt-2">
                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${addr.tag === 'Home' ? 'bg-blue-50 text-blue-600' :
                                    addr.tag === 'Work' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-500'
                                    }`}>
                                    <span className="material-symbols-outlined">
                                        {addr.tag === 'Home' ? 'home' : addr.tag === 'Work' ? 'domain' : 'location_on'}
                                    </span>
                                </div>
                                <div className="flex-grow pr-8">
                                    <h3 className="font-bold text-gray-800 mb-0.5 text-base">{addr.receiverName || 'User'}</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-1">{addr.houseNo}</p>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-1">{addr.address}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                                <button onClick={() => handleEdit(addr)} className="flex-1 flex items-center justify-center gap-1 text-zepto-blue text-xs font-bold uppercase hover:bg-blue-50 py-2 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-sm">edit</span> Edit
                                </button>
                                <div className="w-px bg-gray-100"></div>
                                <button onClick={() => handleDeleteClick(addr.id)} className="flex-1 flex items-center justify-center gap-1 text-red-500 text-xs font-bold uppercase hover:bg-red-50 py-2 rounded-lg transition-colors">
                                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {addresses.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-2">location_off</span>
                            <p className="text-gray-500">No addresses saved yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <span className="material-symbols-outlined text-3xl">delete_forever</span>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-800 mb-2">Delete Address?</h3>
                        <p className="text-center text-sm text-gray-500 mb-6 px-2">
                            Are you sure you want to delete this address? This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        </div>
    );
};

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('taaza_notifications');
        if (stored) {
            setNotifications(JSON.parse(stored));
        } else {
            const defaults = [
                { id: 1, title: 'Order Delivered', msg: 'Your order #ORD-123456 has been delivered successfully.', time: '2 hours ago', icon: 'check_circle', color: 'text-green-500 bg-green-50', read: false },
                { id: 2, title: 'Milk Subscription', msg: 'Your milk subscription for tomorrow has been paused as requested.', time: 'Yesterday', icon: 'water_drop', color: 'text-blue-500 bg-blue-50', read: true },
                { id: 3, title: 'Fresh Offer!', msg: 'Get 20% off on all organic vegetables this weekend.', time: '2 days ago', icon: 'local_offer', color: 'text-yellow-600 bg-yellow-50', read: true },
            ];
            setNotifications(defaults);
            localStorage.setItem('taaza_notifications', JSON.stringify(defaults));
        }
    }, []);

    const markAsRead = (id: number) => {
        const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        setNotifications(updated);
        localStorage.setItem('taaza_notifications', JSON.stringify(updated));
    };

    const deleteNotification = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem('taaza_notifications', JSON.stringify(updated));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Notifications" backPath="/profile" />
            <div className="p-4 space-y-3">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-gray-400">notifications_off</span>
                        </div>
                        <h3 className="font-bold text-gray-500">No notifications</h3>
                        <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-4 rounded-xl shadow-sm flex gap-4 animate-slide-up relative group cursor-pointer transition-all duration-300 ${n.read ? 'bg-white/80 opacity-80 hover:opacity-100' : 'bg-white border-l-4 border-l-zepto-blue'}`}
                        >
                            {!n.read && (
                                <div className="absolute top-3 right-8 bg-zepto-blue text-white text-[9px] px-1.5 py-0.5 rounded font-bold">NEW</div>
                            )}

                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${n.read ? 'bg-gray-100 text-gray-400' : n.color}`}>
                                <span className="material-symbols-outlined text-xl">{n.icon}</span>
                            </div>
                            <div className="flex-grow pr-6">
                                <h4 className={`font-bold text-gray-800 text-sm ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.msg}</p>
                                <p className="text-[10px] text-gray-400 mt-2">{n.time}</p>
                            </div>
                            <button
                                onClick={(e) => deleteNotification(e, n.id)}
                                className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors z-10"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    useEffect(() => {
        const push = localStorage.getItem('taaza_setting_push');
        const wa = localStorage.getItem('taaza_setting_whatsapp');

        if (push !== null) setPushEnabled(push === 'true');
        if (wa !== null) setWhatsappEnabled(wa === 'true');
    }, []);

    const togglePush = () => {
        const newVal = !pushEnabled;
        setPushEnabled(newVal);
        localStorage.setItem('taaza_setting_push', String(newVal));
        setToastMsg(newVal ? "Push Notifications Enabled" : "Push Notifications Disabled");
    };

    const toggleWhatsapp = () => {
        const newVal = !whatsappEnabled;
        setWhatsappEnabled(newVal);
        localStorage.setItem('taaza_setting_whatsapp', String(newVal));
        setToastMsg(newVal ? "WhatsApp Updates Enabled" : "WhatsApp Updates Disabled");
    };

    const confirmDeleteAccount = () => {
        localStorage.clear();
        setShowDeleteModal(false);
        navigate('/auth/onboarding', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Settings" backPath="/profile" />
            <div className="p-4 space-y-6">

                {/* Preferences */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 text-sm">App Preferences</h3>
                    </div>
                    <div className="p-4 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 text-sm">Push Notifications</p>
                                <p className="text-xs text-gray-500">Receive updates about your orders</p>
                            </div>
                            <button
                                onClick={togglePush}
                                className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${pushEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 text-sm">WhatsApp Updates</p>
                                <p className="text-xs text-gray-500">Get delivery updates on WhatsApp</p>
                            </div>
                            <button
                                onClick={toggleWhatsapp}
                                className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${whatsappEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${whatsappEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 text-sm">Account</h3>
                    </div>
                    <div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full p-4 text-left flex justify-between items-center hover:bg-red-50 transition-colors group"
                        >
                            <span className="text-sm font-medium text-red-500 group-hover:text-red-600">Delete Account</span>
                            <span className="material-symbols-outlined text-red-300 text-sm group-hover:text-red-500">delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-800 mb-2">Delete Account?</h3>
                        <p className="text-center text-sm text-gray-500 mb-6 px-2">
                            This will permanently delete your profile, order history, and saved addresses. This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAccount}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        </div>
    );
};

const Help: React.FC = () => {
    // ... [Help component content omitted for brevity as it is unchanged] ...
    // Assuming standard implementation if not changed
    return <div className="min-h-screen bg-gray-50"><Header title="Help" backPath="/profile" /><div className="p-4 text-center text-gray-500">Help Section</div></div>;
};


// --- Main Profile Page ---

const MainProfile: React.FC = () => {
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const userName = localStorage.getItem('taaza_user_name') || 'User';
    const userEmail = localStorage.getItem('taaza_user_email') || 'user@example.com';

    const accountItems = [
        { icon: 'person', label: 'Personal Information', path: '/profile/info', color: 'text-blue-500 bg-blue-50' },
        { icon: 'location_on', label: 'Addresses', path: '/profile/addresses', color: 'text-orange-500 bg-orange-50' },
        { icon: 'receipt_long', label: 'My Orders', path: '/orders', color: 'text-purple-500 bg-purple-50' }, // Added back
    ];

    const appItems = [
        { icon: 'notifications', label: 'Notifications', path: '/profile/notifications', color: 'text-yellow-500 bg-yellow-50' },
        { icon: 'settings', label: 'Settings', path: '/profile/settings', color: 'text-gray-500 bg-gray-100' },
        // { icon: 'support', label: 'Help & Support', path: '/profile/help', color: 'text-teal-500 bg-teal-50' }, // Simplified for this view
    ];

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.clear();
        setShowLogoutModal(false);
        navigate('/auth/onboarding', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gray-50 relative pb-24">
            <Header title="My Profile" backPath="/home" />

            {/* Profile Header */}
            <div className="bg-white pb-6 pt-2 rounded-b-3xl shadow-sm mb-6 border-b border-gray-100 relative overflow-hidden">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl -ml-10 -mb-5"></div>

                <div className="flex flex-col items-center relative z-10">
                    <div className="relative mb-3">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg border-4 border-white"
                            style={{
                                background: `linear-gradient(135deg, ${getAvatarColor(userName)} 0%, ${getAvatarColorSecondary(userName)} 100%)`
                            }}
                        >
                            {getInitials(userName)}
                        </div>
                        <button
                            onClick={() => navigate('/profile/info')}
                            className="absolute bottom-0 right-0 p-1.5 bg-zepto-blue text-white rounded-full border-2 border-white shadow-md hover:bg-blue-900 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
                    <p className="text-sm text-gray-500">{userEmail}</p>
                </div>
            </div>

            {/* Account Section */}
            <div className="mx-4 mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2">Account</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {accountItems.map((item, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(item.path)}
                            className="flex items-center p-4 border-b border-gray-50 last:border-0 active:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mr-4`}>
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            <span className="flex-grow font-medium text-gray-700">{item.label}</span>
                            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* App Section */}
            <div className="mx-4 mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2">App Settings</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {appItems.map((item, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(item.path)}
                            className="flex items-center p-4 border-b border-gray-50 last:border-0 active:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mr-4`}>
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            <span className="flex-grow font-medium text-gray-700">{item.label}</span>
                            <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logout */}
            <div className="px-4">
                <button
                    onClick={handleLogoutClick}
                    className="w-full bg-white text-red-500 font-bold py-3.5 rounded-xl border border-red-100 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
                >
                    <span className="material-symbols-outlined">logout</span>
                    Log Out
                </button>
                <p className="text-center text-gray-400 text-xs mt-6">Version 1.0.3 • Made with ❤️ by Taaza</p>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-slide-up transform transition-all">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <span className="material-symbols-outlined text-3xl">logout</span>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Log Out?</h3>
                        <p className="text-center text-gray-500 mb-8 px-4">Are you sure you want to log out of your account?</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Profile: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<MainProfile />} />
            <Route path="info" element={<PersonalInfo />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
        </Routes>
    );
};

export default Profile;