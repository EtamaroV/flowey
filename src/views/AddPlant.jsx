import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import mqtt from 'mqtt';

import { LocationPicker } from "@/components/location-picker"
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/authContext';


function AddPlant(onPlantAdded) {
    let navigate = useNavigate(); 
    const { refetchPlants } = useAuth();

    const onClose = () => {
        refetchPlants();
        navigate('/', { replace: true })
    }
    // onClose: Function to close the modal/page
    // onPlantAdded: Function to refresh the plant list in the parent component

    // State to manage the mode: 'CHOICE', 'SHARE', 'NEW'
    const [mode, setMode] = useState('CHOICE');

    // State for 'Create New' flow steps (1 to 5)
    const [step, setStep] = useState(1);

    // Form Data
    const [formData, setFormData] = useState({
        nickname: '',
        birthDate: '',
        location: '',
        species: '',
        sharingCode: ''
    });

    // State for the generated token (Step 4)
    const [isMQTTConnecting, setMQTTConnecting] = useState(false);

    const [deviceToken, setDeviceToken] = useState(null);
    const [deviceUuid, setDeviceUuid] = useState(null); // 2. เพิ่ม State สำหรับเก็บ UUID
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // ทำงานเฉพาะตอนอยู่ Step 4 และมี UUID แล้ว
        if (step === 4 && deviceUuid && !isMQTTConnecting) {

            setMQTTConnecting(true)
            const clientId = `mqtt_flowey_${Math.random().toString(16).slice(3)}`
            const client = mqtt.connect(import.meta.env.VITE_MQTT_BROKER_URL, {
                clientId,
                clean: true,
                connectTimeout: 4000,
                username: 'sad',
                password: 'sad',
                reconnectPeriod: 5000,
            });

            const topic = `/flowey/${deviceUuid}/status`;

            client.on('connect', () => {
                console.log('Connected to MQTT, Waiting for device...');
                client.subscribe(topic, (err) => {
                    if (!err) {
                        console.log(`Subscribed to ${topic}`);
                    }
                });
            });

            client.on('message', (topic, message) => {
                // เมื่อมีข้อความเข้ามา (เช่น "online" หรืออะไรก็ได้)
                console.log('Device signal received:', message.toString());
                
                // ย้ายไปหน้าเสร็จสิ้นอัตโนมัติ
                client.end(); // ตัดการเชื่อมต่อ
                setStep(5);
            });

            // Cleanup function เมื่อออกจากหน้านี้
            return () => {
                if (client.connected) {
                    client.end();
                }
            };
        }
    }, [step, deviceUuid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(''); // Clear error on typing
    };

    const handleChangeLocation = (value) => {
        console.log(value)
        if (formData.location == value) return;
        setFormData(prev => ({ ...prev, 'location': value }));
        setError(''); // Clear error on typing
    };

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    function calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    // --- API Handlers ---

    // Handler for Joining via Sharing Code
    const handleJoinByCode = async () => {
        setLoading(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_BACKEND_SERVER_URL}plants/join`, {
                    code: formData.sharingCode
                }
            );
            // If successful, move to success view (reusing Step 5 logic or a custom one)
            setMode('SHARE_SUCCESS');
            if (onPlantAdded) onPlantAdded();
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid sharing code.');
        } finally {
            setLoading(false);
        }
    };

    // Handler for Creating New Plant (Transition from Step 3 to 4)
    const handleCreatePlant = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_SERVER_URL}plant/create`, {
                    nickname: formData.nickname,
                    birthDate: formData.birthDate,
                    location: formData.location,
                    species: formData.species
                },
                {
                  headers: {
                    Authorization: `Bearer ${authService.getAuthToken()}`,
                  },
                },
            );
            
            // Assuming the backend returns { token: "..." }
            setDeviceToken(response.data.token);
            setDeviceUuid(response.data.uuid);
            setStep(4); // Move to Token display step
            if (onPlantAdded) onPlantAdded();
        } catch (err) {
            setError('Failed to create plant. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERERS ---

    // 0. CHOICE: New vs Share
    const renderChoice = () => (
        <>
            {/* Empty top div to push content down (spacer) */}
            <div className='flex-grow'></div>
            
            <div className='flex flex-col p-5 pb-10 justify-end h-auto gap-8'>
                <div className='flex flex-col gap-5'>
                    <div className='text-4xl font-extrabold text-center px-5 text-hunter-green-600'>
                        Add Plant
                    </div>

                    <div className='text-base font-medium text-center px-5 text-gray-600'>
                        Start a new journey or join an existing garden using a code.
                    </div>
                </div>
                
                <div className='flex flex-col gap-4'>
                    <div className='flex flex-row justify-between gap-4'>
                        {/* Primary Action: Create New */}
                        <div 
                            onClick={() => setMode('NEW')} 
                            className='flex-1 px-4 py-4 bg-hunter-green-500 text-white font-bold text-lg text-center rounded-lg shadow-md cursor-pointer flex items-center justify-center'
                        >
                            Create New
                        </div>
                        {/* Secondary Action: Add Code */}
                        <div 
                            onClick={() => setMode('SHARE')} 
                            className='flex-1 px-4 py-4 bg-gray-100 text-hunter-green-600 font-bold text-lg text-center rounded-lg shadow-sm cursor-pointer flex items-center justify-center'
                        >
                            Add Code
                        </div>
                    </div>
                    
                    <div onClick={onClose} className='text-gray-400 font-bold text-sm text-center cursor-pointer mt-2'>
                        Cancel
                    </div>
                </div>
            </div>
        </>
    );

    // A. SHARE FLOW
    const renderShareFlow = () => {
        if (mode === 'SHARE_SUCCESS') {
            return (
                <div className='flex flex-col h-full justify-center items-center gap-6'>
                    <div className='text-6xl'>🎉</div>
                    <div className='text-2xl font-bold text-hunter-green-600 text-center'>
                        Plant Added Successfully!
                    </div>
                    <div 
                        onClick={onClose} 
                        className='px-8 py-3 bg-hunter-green-500 text-white font-bold rounded-lg cursor-pointer'
                    >
                        Go to Dashboard
                    </div>
                </div>
            )
        }

        return (
            <>
                <div className='flex flex-col gap-5'>
                    <div className='text-3xl font-extrabold text-center px-5 text-hunter-green-600'>
                        Enter Code
                    </div>
                    <div className='text-md font-bold text-center px-8 text-gray-600'>
                        Paste the sharing code provided by the plant owner.
                    </div>
                </div>

                <div className='flex flex-col gap-2'>
                    <input
                        type='text'
                        name='sharingCode'
                        placeholder='Ex. A1B2-C3D4'
                        value={formData.sharingCode}
                        onChange={handleChange}
                        className='w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                    />
                    {error && <p className='text-red-500 text-center text-sm'>{error}</p>}
                </div>

                <div className='flex flex-col gap-3'>
                    <button
                        onClick={handleJoinByCode}
                        disabled={!formData.sharingCode || loading}
                        className={`w-full px-5 py-3 text-white font-bold text-lg rounded-lg shadow-md ${
                            !formData.sharingCode || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-hunter-green-500 hover:bg-hunter-green-600'
                        }`}
                    >
                        {loading ? 'Verifying...' : 'Confirm'}
                    </button>
                    <div onClick={() => { setMode('CHOICE'); setError(''); }} className='px-5 py-3 text-gray-700 font-bold text-sm text-center cursor-pointer'>
                        Back
                    </div>
                </div>
            </>
        );
    };

    // B. NEW PLANT FLOW - STEPS

    // Step 1: Nickname & Birthday
    const renderNewStepOne = () => (
        <>
            <div className='flex flex-col gap-2'>
                <div className='text-3xl font-extrabold text-center text-hunter-green-600'>
                    New Plant
                </div>
                <div className='text-md text-center text-gray-600'>
                    Tell us about your green friend.
                </div>
            </div>

            <div className='flex flex-col gap-4'>
                <div>
                    <label className='block text-sm font-bold text-gray-700 mb-1 ml-1'>Nickname</label>
                    <input
                        type='text'
                        name='nickname'
                        placeholder='e.g., Mr. Leafy'
                        value={formData.nickname}
                        onChange={handleChange}
                        className='w-full px-4 py-3 bg-hunter-green-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                    />
                </div>
                <div className='flex flex-col'>
                    <label className='block text-sm font-bold text-gray-700 mb-1 ml-1'>Date of Birth / Acquisition</label>
                    <input
                        type='date'
                        name='birthDate'
                        value={formData.birthDate}
                        onChange={handleChange}
                        max={getTodayDate()}
                        className={`px-4 py-3 h-12.5 bg-hunter-green-50 rounded-lg focus:outline-none focus:ring-2 ${calculateAge(formData.birthDate) < 0 ? 'ring-red-500' : 'ring-hunter-green-500'}`}
                    />
                </div>
            </div>

            <div className='flex flex-col gap-3'>
                <div
                    onClick={() => setStep(2)}
                    className={`flex-1 px-5 py-3 text-white font-bold text-lg text-center rounded-lg cursor-pointer ${
                        formData.nickname && formData.birthDate && calculateAge(formData.birthDate) >= 0 ? 'bg-hunter-green-500' : 'bg-gray-400 pointer-events-none'
                    }`}
                >
                    Next
                </div>
                <div onClick={() => setMode('CHOICE')} className='text-gray-700 font-bold text-sm text-center cursor-pointer'>
                    Cancel
                </div>
            </div>
        </>
    );

    // Step 2: Location
    const renderNewStepTwo = () => (
        <>
             <div className='flex flex-col gap-2'>
                <div className='text-3xl font-extrabold text-center text-hunter-green-600'>
                    Location
                </div>
                <div className='text-md text-center text-gray-600'>
                    Where does this plant live?
                </div>
            </div>

            <div className='flex flex-col justify-center'>
                <label className='block text-sm font-bold text-gray-700 mb-1 ml-1'>Location</label>
                <LocationPicker defaultLocation={`${formData.location.display_name || ''}`} variant="inline" onChange={(location) => handleChangeLocation(location)}/>
            </div>

            <div className='flex flex-col gap-3'>
                <div
                    onClick={() => setStep(3)}
                    className={`flex-1 px-5 py-3 text-white font-bold text-lg text-center rounded-lg cursor-pointer ${
                        formData.location ? 'bg-hunter-green-500' : 'bg-gray-400 pointer-events-none'
                    }`}
                >
                    Next
                </div>
                <div onClick={() => setStep(1)} className='text-gray-700 font-bold text-sm text-center cursor-pointer'>
                    Back
                </div>
            </div>
        </>
    );

    // Step 3: Species
    const renderNewStepThree = () => (
        <>
            <div className='flex flex-col gap-2'>
                <div className='text-3xl font-extrabold text-center text-hunter-green-600'>
                    Species
                </div>
                <div className='text-md text-center text-gray-600'>
                    What kind of plant is it?
                </div>
            </div>

            <div className='flex flex-col justify-center'>
                <input
                    type='text'
                    name='species'
                    placeholder='e.g., Monstera, Cactus'
                    value={formData.species}
                    onChange={handleChange}
                    className='w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                />
                {error && <p className='text-red-500 text-center text-sm mt-4'>{error}</p>}
            </div>

            <div className='flex flex-col gap-3'>
                <button
                    onClick={handleCreatePlant}
                    disabled={!formData.species || loading}
                    className={`flex-1 px-5 py-3 text-white font-bold text-lg text-center rounded-lg cursor-pointer ${
                        formData.species && !loading ? 'bg-hunter-green-500' : 'bg-gray-400'
                    }`}
                >
                    {loading ? 'Creating...' : 'Create & Get Token'}
                </button>
                <div onClick={() => setStep(2)} className='text-gray-700 font-bold text-sm text-center cursor-pointer'>
                    Back
                </div>
            </div>
        </>
    );

    // Step 4: Token Display
    const renderNewStepFour = () => (
        <>
            <div className='flex flex-col gap-2 pt-10'>
                <div className='text-3xl font-extrabold text-center text-hunter-green-600'>
                    Connect Device
                </div>
                <div className='text-sm text-center text-gray-600 px-4'>
                    Input this token into your device code.<br/>
                    <span className='text-hunter-green-500 font-bold'>Waiting for connection...</span>
                </div>
            </div>

            <div className='flex flex-col items-center justify-center p-6 bg-hunter-green-50 rounded-xl border-2 border-dashed border-hunter-green-300 relative'>
                <span className='text-sm text-gray-500 uppercase font-bold tracking-wider'>Device Token</span>
                <span className='text-xs text-gray-500 uppercase font-bold tracking-wider mb-2'>We have sent it to your email.</span>
                <div className='text-3xl font-mono font-bold text-hunter-green-700 select-all w-full whitespace-nowrap overflow-hidden text-ellipsis text-center'>
                    {deviceToken || "ERROR"}
                </div>
                
                {/* เพิ่ม Loading Spinner เล็กๆ ให้รู้ว่าระบบกำลังรออยู่ */}
                <div className='absolute -bottom-5 bg-white p-2 rounded-full'>
                    <svg className="animate-spin h-6 w-6 text-hunter-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>

            <div className='flex flex-col gap-3 pb-5'>
                {/* ปุ่ม Manual Fallback เผื่อ MQTT ไม่ทำงาน */}
                <div
                    onClick={() => setStep(5)}
                    className='flex-1 px-5 py-3 border-2 border-hunter-green-100 text-gray-400 font-bold text-sm text-center rounded-lg cursor-pointer hover:bg-hunter-green-50'
                >
                    Device connected but screen didn't update? Click here.
                </div>
            </div>
        </>
    );

    // Step 5: Success
    const renderNewStepFive = () => (
        <div className='flex flex-col h-full justify-center items-center gap-6 pt-10'>
            <div className='text-3xl font-extrabold text-hunter-green-600 text-center'>
                All Set!
            </div>
            <div className='text-lg text-center text-gray-600 px-6'>
                Your plant <b>{formData.nickname}</b> has been added and is waiting for data.
            </div>
            <div 
                onClick={onClose} 
                className='w-full px-8 py-3 bg-hunter-green-500 text-white font-bold text-lg text-center rounded-lg cursor-pointer shadow-md'
            >
                Finish
            </div>
        </div>
    );

    // Main render logic for "NEW" mode
    const renderNewFlow = () => {
        switch (step) {
            case 1: return renderNewStepOne();
            case 2: return renderNewStepTwo();
            case 3: return renderNewStepThree();
            case 4: return renderNewStepFour();
            case 5: return renderNewStepFive();
            default: return renderNewStepOne();
        }
    };

    return (
        <div className='flex flex-col p-5 pt-10 h-full justify-between min-h-[500px]'>
            {mode === 'CHOICE' && renderChoice()}
            {(mode === 'SHARE' || mode === 'SHARE_SUCCESS') && renderShareFlow()}
            {mode === 'NEW' && renderNewFlow()}
        </div>
    );
}

export default AddPlant;