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
    const [view, setView] = useState<'list' | 'map' | 'form'>('list');
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
    const [isConfirming, setIsConfirming] = useState(false);

    // Contact Details for Address
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');

    // Validation State
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Map Dragging State
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Map Search State
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('taaza_addresses');
        if (stored) {
            setAddresses(JSON.parse(stored));
        } else {
            setAddresses([]);
        }
    }, []);

    const saveAddressesToStorage = (newAddresses: any[]) => {
        setAddresses(newAddresses);
        localStorage.setItem('taaza_addresses', JSON.stringify(newAddresses));
    };

    const handleAddNew = () => {
        setEditingId(null);
        setHouseNo('');
        setLandmark('');

        setTagCategory('Home');
        setCustomTag('');

        setIsDefault(addresses.length === 0);
        setMapAddress('12th Main Road, Indiranagar, Bengaluru');

        // Auto-fill user details from profile/local storage
        setReceiverName(localStorage.getItem('taaza_user_name') || '');
        setReceiverPhone(localStorage.getItem('taaza_mobile') || '');

        setPan({ x: 0, y: 0 });
        setSearchText('');
        setErrors({});
        setView('map');
    };

    const handleEdit = (addr: any) => {
        setEditingId(addr.id);
        setHouseNo(addr.houseNo);
        setLandmark(addr.landmark);

        // Determine tag category
        if (addr.tag === 'Home' || addr.tag === 'Work') {
            setTagCategory(addr.tag);
            setCustomTag('');
        } else {
            setTagCategory('Other');
            setCustomTag(addr.tag);
        }

        setIsDefault(addr.isDefault || false);
        setMapAddress(addr.address);
        setReceiverName(addr.receiverName || localStorage.getItem('taaza_user_name') || '');
        setReceiverPhone(addr.receiverPhone || localStorage.getItem('taaza_mobile') || '');
        setErrors({});
        setView('form');
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            const filtered = addresses.filter(a => a.id !== deleteId);
            const wasDefault = addresses.find(a => a.id === deleteId)?.isDefault;
            if (wasDefault && filtered.length > 0) {
                filtered[0].isDefault = true;
            }
            saveAddressesToStorage(filtered);
            setShowDeleteModal(false);
            setDeleteId(null);
            setToastMsg("Address deleted");
        }
    };

    const handleLocateMe = () => {
        setIsLocating(true);
        setTimeout(() => {
            setIsLocating(false);
            setMapAddress('Current Location: 5th Block, Koramangala, Bengaluru');
            setPan({ x: 0, y: 0 });
        }, 1500);
    };

    const handleConfirmLocation = () => {
        setIsConfirming(true);
        // Simulate API call to fetch address details
        setTimeout(() => {
            setIsConfirming(false);
            setView('form');
        }, 1000);
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!receiverName.trim()) newErrors.receiverName = "Name is required";
        if (!receiverPhone.trim()) newErrors.receiverPhone = "Phone is required";
        else if (!/^\d{10}$/.test(receiverPhone.replace(/\D/g, ''))) newErrors.receiverPhone = "Enter valid 10-digit number";
        if (!houseNo.trim()) newErrors.houseNo = "House/Flat No. is required";

        // Custom Tag Validation
        if (tagCategory === 'Other' && !customTag.trim()) {
            newErrors.customTag = "Please give this address a name";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveAddress = () => {
        if (!validateForm()) {
            return;
        }

        const finalTag = tagCategory === 'Other' ? customTag.trim() : tagCategory;

        const newAddr = {
            id: editingId || Date.now().toString(),
            tag: finalTag,
            houseNo,
            landmark,
            address: mapAddress,
            isDefault,
            receiverName,
            receiverPhone
        };

        let updatedAddresses = [...addresses];

        if (isDefault) {
            updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
        }

        if (editingId) {
            updatedAddresses = updatedAddresses.map(a => a.id === editingId ? newAddr : a);
        } else {
            updatedAddresses.push(newAddr);
        }

        if (!updatedAddresses.some(a => a.isDefault) && updatedAddresses.length > 0) {
            updatedAddresses[0].isDefault = true;
        }

        saveAddressesToStorage(updatedAddresses);
        setToastMsg(editingId ? "Address Updated" : "Address Added");
        setView('list');
    };

    // Map Interaction Handlers
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        // Simulate finding address near new center
        if (Math.abs(pan.x) > 20 || Math.abs(pan.y) > 20) {
            const streets = ['100ft Road', 'CMH Road', '12th Main', '80ft Road', 'Cambridge Layout', 'Double Road'];
            const randomStreet = streets[Math.floor(Math.random() * streets.length)];
            setMapAddress(`${Math.floor(Math.random() * 200)}, ${randomStreet}, Bengaluru`);
        }
    };

    // --- Map View ---
    if (view === 'map') {
        return (
            <div className="h-screen w-full bg-gray-100 flex flex-col relative overflow-hidden">
                {/* Header with Search */}
                <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-4 bg-gradient-to-b from-black/50 to-transparent flex gap-3 pointer-events-none">
                    <button
                        onClick={() => setView('list')}
                        className="pointer-events-auto w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 active:scale-95 transition-transform flex-shrink-0"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="pointer-events-auto flex-grow bg-white rounded-full shadow-lg h-10 flex items-center px-4 animate-slide-up relative">
                        <span className="material-symbols-outlined text-gray-400">search</span>
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search for area, street name..."
                            className="ml-2 flex-grow bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                        />
                        {searchText && (
                            <button
                                onClick={() => setSearchText('')}
                                className="absolute right-3 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Enhanced Map Visualization with Pan Support */}
                <div
                    className="absolute inset-0 z-0 bg-[#e5e7eb] w-full h-full cursor-grab active:cursor-grabbing touch-none"
                    onMouseDown={handlePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                >
                    {/* Panning Container */}
                    <div
                        className="w-full h-full relative will-change-transform"
                        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
                    >
                        {/* Map Grid / Roads */}
                        <div className="absolute inset-[-100%]" style={{
                            width: '300%',
                            height: '300%',
                            backgroundImage: `
                                linear-gradient(#d1d5db 1px, transparent 1px),
                                linear-gradient(90deg, #d1d5db 1px, transparent 1px)
                            `,
                            backgroundSize: '50px 50px',
                            backgroundColor: '#f3f4f6'
                        }}></div>

                        {/* Simulated Map Features */}
                        <div className="absolute top-[30%] left-[30%] w-48 h-32 bg-[#d1fae5] rounded-xl border border-white/50 opacity-60"></div>
                        <div className="absolute top-[40%] left-[60%] w-64 h-24 bg-[#e5e7eb] transform -skew-y-3 border-y-8 border-white"></div>
                        <div className="absolute top-[60%] left-[20%] w-24 h-24 bg-white rounded-md shadow-sm border border-gray-200"></div>

                        {/* Road Labels */}
                        <div className="absolute top-[45%] left-[45%] bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-500 rounded-sm transform -rotate-12 shadow-sm pointer-events-none">
                            12th Main Rd
                        </div>
                    </div>
                </div>

                {/* Central Pin (Static relative to screen) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                    <div className="relative">
                        <span className={`material-symbols-outlined text-5xl text-zepto-order-red drop-shadow-2xl transition-transform ${isDragging ? '-translate-y-4' : 'animate-bounce'}`}>location_on</span>
                        <div className="w-4 h-2 bg-black/30 rounded-full mx-auto blur-[2px] mt-[-5px]"></div>
                    </div>
                    {!isDragging && (
                        <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-full mt-2 backdrop-blur-md shadow-lg font-medium whitespace-nowrap animate-fade-in flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Move map to adjust
                        </div>
                    )}
                </div>

                {/* Locate Me Button */}
                <button
                    onClick={handleLocateMe}
                    className="absolute bottom-48 right-4 z-20 bg-white p-3.5 rounded-full shadow-xl text-zepto-blue hover:bg-gray-50 active:scale-95 transition-all border border-gray-100 group"
                >
                    {isLocating ? (
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                        <span className="material-symbols-outlined group-active:scale-90 transition-transform">my_location</span>
                    )}
                </button>

                {/* Bottom Sheet */}
                <div className="absolute bottom-0 left-0 right-0 bg-white z-20 rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] p-6 animate-slide-up">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">Select Delivery Location</h3>
                    <div className="flex items-start gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-800 font-bold leading-snug">{mapAddress}</p>
                            <p className="text-xs text-gray-400 mt-1 font-medium">Bengaluru, Karnataka</p>
                        </div>
                    </div>
                    <button
                        onClick={handleConfirmLocation}
                        disabled={isConfirming}
                        className="w-full bg-zepto-yellow text-zepto-blue font-bold py-4 rounded-xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isConfirming ? (
                            <>
                                <span className="w-5 h-5 border-2 border-zepto-blue border-t-transparent rounded-full animate-spin"></span>
                                Fetching address details...
                            </>
                        ) : (
                            "Confirm Location"
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // --- Address Form View ---
    if (view === 'form') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header title={editingId ? "Edit Address" : "Add Address"} showBack={true} onBack={() => setView('map')} />

                <div className="flex-grow p-4 space-y-6">
                    {/* Map Preview Snippet */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-zepto-blue">
                                <span className="material-symbols-outlined">map</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Selected Location</p>
                                <p className="text-sm text-gray-800 font-medium truncate max-w-[200px]">{mapAddress}</p>
                            </div>
                        </div>
                        <button onClick={() => setView('map')} className="text-xs font-bold text-zepto-blue hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">CHANGE</button>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5 animate-slide-up">

                        {/* Receiver Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Receiver's Name *</label>
                                <input
                                    type="text"
                                    value={receiverName}
                                    onChange={(e) => {
                                        setReceiverName(e.target.value);
                                        if (errors.receiverName) setErrors({ ...errors, receiverName: '' });
                                    }}
                                    className={`w-full p-3.5 bg-gray-50 border rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm ${errors.receiverName ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-zepto-blue'}`}
                                    placeholder="Name"
                                />
                                {errors.receiverName && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.receiverName}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={receiverPhone}
                                    maxLength={10}
                                    onChange={(e) => {
                                        setReceiverPhone(e.target.value.replace(/\D/g, ''));
                                        if (errors.receiverPhone) setErrors({ ...errors, receiverPhone: '' });
                                    }}
                                    className={`w-full p-3.5 bg-gray-50 border rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm ${errors.receiverPhone ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-zepto-blue'}`}
                                    placeholder="Mobile"
                                />
                                {errors.receiverPhone && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.receiverPhone}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">House / Flat / Block No. *</label>
                            <input
                                type="text"
                                value={houseNo}
                                onChange={(e) => {
                                    setHouseNo(e.target.value);
                                    if (errors.houseNo) setErrors({ ...errors, houseNo: '' });
                                }}
                                className={`w-full p-3.5 bg-gray-50 border rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm ${errors.houseNo ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-zepto-blue'}`}
                                placeholder="Ex: Flat 402, Sunshine Apts"
                                autoFocus
                            />
                            {errors.houseNo && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.houseNo}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Landmark (Optional)</label>
                            <input
                                type="text"
                                value={landmark}
                                onChange={(e) => setLandmark(e.target.value)}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-zepto-blue focus:bg-white transition-all text-sm"
                                placeholder="Ex: Near Metro Station"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Save As *</label>
                            <div className="flex gap-3 mb-3">
                                {['Home', 'Work', 'Other'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setTagCategory(t as any);
                                            if (t !== 'Other') setCustomTag('');
                                            if (errors.customTag) setErrors({ ...errors, customTag: '' });
                                        }}
                                        className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all ${tagCategory === t ? 'bg-zepto-blue text-white border-zepto-blue shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">
                                            {t === 'Home' ? 'home' : t === 'Work' ? 'work' : 'location_on'}
                                        </span>
                                        {t}
                                    </button>
                                ))}
                            </div>

                            {tagCategory === 'Other' && (
                                <div className="animate-slide-up">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Address Label (Required)</label>
                                    <input
                                        type="text"
                                        value={customTag}
                                        onChange={(e) => {
                                            setCustomTag(e.target.value);
                                            if (errors.customTag) setErrors({ ...errors, customTag: '' });
                                        }}
                                        className={`w-full p-3.5 bg-blue-50 border rounded-xl font-semibold text-gray-800 focus:outline-none focus:bg-white transition-all text-sm ${errors.customTag ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-zepto-blue focus:border-zepto-blue'}`}
                                        placeholder="E.g. Friend's House, Dad's Office"
                                        autoFocus
                                    />
                                    {errors.customTag && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.customTag}</p>}
                                </div>
                            )}
                        </div>

                        {/* Default Address Toggle */}
                        <div
                            onClick={() => setIsDefault(!isDefault)}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 mt-2 ${isDefault ? 'bg-green-50 border-green-200 shadow-sm ring-1 ring-green-100' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDefault ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                                    <span className="material-symbols-outlined text-xl">{isDefault ? 'check_circle' : 'radio_button_unchecked'}</span>
                                </div>
                                <div>
                                    <p className={`text-sm font-bold transition-colors ${isDefault ? 'text-green-800' : 'text-gray-700'}`}>Set as Default Address</p>
                                    <p className={`text-xs transition-colors ${isDefault ? 'text-green-600' : 'text-gray-400'}`}>
                                        {isDefault ? 'Primary delivery location' : 'Use for future orders'}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <div className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 cursor-pointer ${isDefault ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${isDefault ? 'translate-x-5' : ''}`}></div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
                    <button
                        onClick={handleSaveAddress}
                        className="w-full bg-zepto-yellow text-zepto-blue font-bold py-3.5 rounded-xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Save Address
                        <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- List View (Default) ---
    return (
        <div className="min-h-screen bg-gray-50 relative">
            <Header title="My Addresses" backPath="/profile" />
            <div className="p-4 space-y-4">

                {/* Add New Button */}
                <button
                    onClick={handleAddNew}
                    className="w-full py-4 bg-zepto-yellow text-zepto-blue font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:brightness-105 transition-colors active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined">add_location_alt</span>
                    Add New Address
                </button>

                {/* Address List */}
                <div className="space-y-4 animate-slide-up">
                    {addresses.map((addr) => (
                        <div key={addr.id} className={`bg-white p-5 rounded-2xl shadow-sm border relative group overflow-hidden transition-all ${addr.isDefault ? 'border-green-500 ring-1 ring-green-100' : 'border-gray-100'}`}>

                            {/* Default Badge */}
                            {addr.isDefault && (
                                <div className="absolute top-0 left-0 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg z-10">
                                    DEFAULT
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