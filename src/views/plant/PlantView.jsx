// src/views/PlantView.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

// Import the context and utilities
import { 
    usePlantContext, 
    SoilMoistureThreshold, 
    TemperatureThreshold, 
    HumidityThreshold, 
    LightIntensityThreshold, 
    ThresholdDisplay,
    WMO_WEATHER_MAP
} from '@/contexts/plantContext'; // Adjust path as necessary

// Import only external dependencies needed for rendering
import axios from 'axios'; 

import { motion, useScroll, useMotionValue, useTransform, useMotionValueEvent, animate } from "framer-motion";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSeedling, faTemperatureHalf, faDroplet, faLightbulb, 
    faCloud, faSpinner 
} from '@fortawesome/free-solid-svg-icons';

// Import PullToRefresh (assuming its implementation is self-contained)
const PullToRefresh = ({ children, onRefresh, isReady = true }) => {
    const { scrollY } = useScroll();
    const y = useMotionValue(0); // ค่าระยะทางที่ดึงลงมา (px)
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ใช้ Ref เพื่อเก็บค่า scrollY ล่าสุด ไว้เช็คใน onTouchMove โดยไม่ Re-render
    const scrollYRef = useRef(0);
    const startY = useRef(0);

    // อัปเดตค่า scrollY ลง ref ตลอดเวลา
    useMotionValueEvent(scrollY, "change", (latest) => {
        scrollYRef.current = latest;
    });

    const hasMountedRef = useRef(false);

    useEffect(() => {
        // If not ready yet, do nothing (wait)
        if (!isReady) return; 

        if (hasMountedRef.current) return;
        hasMountedRef.current = true;

        // Start the animation and load
        const initialLoad = async () => {
            setIsRefreshing(true);
            animate(y, 60, { type: "spring", stiffness: 300, damping: 20 });
            try {
                if (onRefresh) await onRefresh();
            } finally {
                setIsRefreshing(false);
                animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
            }
        };

        initialLoad();
    }, [isReady]);

    // แปลงค่า y เป็น opacity และ rotation สำหรับ icon
    const pullOpacity = useTransform(y, [0, 40], [0, 1]);
    const pullRotate = useTransform(y, [0, 80], [0, 180]);

    const THRESHOLD = 100; // ระยะที่ต้องดึงถึงจะ Refresh

    const handleTouchStart = (e) => {
        if (scrollYRef.current <= 0 && !isRefreshing) {
            startY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        // ถ้าไม่ได้เริ่มจิ้ม หรือกำลังโหลด หรือไม่ได้อยู่บนสุด -> ไม่ทำอะไร
        if (startY.current === 0 || isRefreshing || scrollYRef.current > 0) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        // ถ้าลากลง (diff > 0)
        if (diff > 0) {
            // คำนวณแรงต้าน (Resistance) ยิ่งดึงลึกยิ่งหนืด
            // สูตร: ระยะจริง * 0.4 (หรือใช้ log function ก็ได้)
            y.set(diff * 0.45);

            // ป้องกัน Native Scroll ของ Browser เวลาดึงลง (Optional)
            // if (e.cancelable) e.preventDefault(); 
        }
    };

    const handleTouchEnd = async () => {
        if (startY.current === 0 || isRefreshing) return;

        const currentPull = y.get();

        if (currentPull > THRESHOLD) {
            // 1. ดึงเกินกำหนด -> เข้าสู่โหมด Refresh
            setIsRefreshing(true);

            // Animate ให้ค้างไว้ที่ตำแหน่ง Loading (เช่น 60px)
            animate(y, 60, { type: "spring", stiffness: 300, damping: 20 });

            try {
                await onRefresh(); // เรียกฟังก์ชันโหลดข้อมูล
            } finally {
                // 2. โหลดเสร็จ -> ดีดกลับขึ้นไป
                setIsRefreshing(false);
                animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
            }
        } else {
            // 3. ดึงไม่ถึง -> ดีดกลับเลย
            animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
        }

        // Reset
        startY.current = 0;
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative min-h-screen"
        >
            {/* Loading Indicator Icon */}
            <motion.div
                style={{
                    y, // ขยับตามนิ้ว
                    opacity: isRefreshing ? 1 : pullOpacity // ถ้าโหลดอยู่ให้โชว์ตลอด ถ้าไม่โหลดให้จางๆ
                }}
                className="fixed top-0 left-0 w-full flex justify-center items-start w-14 h-14 pt-14 pointer-events-none z-20"
            >
                <motion.div
                    style={{ rotate: isRefreshing ? 0 : pullRotate }}
                    animate={isRefreshing ? { rotate: 360 } : {}}
                    transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
                    className="flex flex-col justify-center align-middle rounded-full text-3xl text-center text-gray-600"
                >
                    <FontAwesomeIcon icon={faSpinner} />
                </motion.div>
            </motion.div>

            {/* เนื้อหาหลัก - จะถูกดันลงตามค่า y */}
            <motion.div style={{ y }}>
                {children}
            </motion.div>
        </div>
    );
};

function PlantView() {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // ⭐️ CONSUME CONTEXT ⭐️
    const {
        plantNickname, plantSpecies, plantAge, 
        soilMoisture, temperature, weather, humidity, lightIntensity,
        isAppReady, refreshSensor
    } = usePlantContext();

    const [helperTip, setHelperTip] = useState('');
    const enableHelperTip = false; // Still controlled here

    // --- UTILITY FUNCTIONS ---
    function getWeatherDetails(code) {
        const details = WMO_WEATHER_MAP[code];
        return details || WMO_WEATHER_MAP[0];
    }
    
    // Function to map FontAwesome icon names to actual components
    // You must map the string name (e.g., 'faSun') back to the imported faSun variable.
    // For simplicity, I'm using faCloud as a fallback, but you should create a map:

    
    const weatherIcon = getWeatherDetails(weather).icon;


    // --- EFFECT: Fetch Helper Tip (Still in the view, as it's a presentation concern) ---
    // Note: The dependency array for this must be updated to use context values.
    useEffect(() => {
        if (!isAppReady || !enableHelperTip || helperTip !== '') return;

        (async () => {
            try {
                // Access context values for API call
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER_URL}plant-tips`, {
                    params: {
                        plantSpecies,
                        plantAge,
                        soilMoisture,
                        temperature,
                        weather,
                        humidity,
                        lightIntensity
                    }
                });
                setHelperTip(response.data.text);
            } catch (err) {
                console.error("Failed to fetch helper tip:", err);
            }
        })();
    }, [isAppReady, plantSpecies, plantAge, soilMoisture, temperature, weather, humidity, lightIntensity]);

    useEffect(() => {
        const interval = setInterval(() => {
            refreshSensor()
            console.log('Refreshing...');
        }, 60000);

        return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, [])


    // --- RENDER ---
    return (
        <>
            {/* ... HEADER (remains largely the same, using plantNickname) ... */}
            <header className='fixed w-full left-0 h-17 safeTop z-50'>
                <div className='max-w-5xl m-auto flex justify-between'>
                    <div onClick={() => navigate('/', { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" /></svg>
                    </div>
                    <div className='max-w-5xl w-full absolute top-0 mt-3 p-3 text-xl text-center font-medium z-40'>
                        <div>{plantNickname}</div> {/* Context value */}
                    </div>
                    {/* Settings and Chat icons */}
                    <div>
                        {/* Settings Icon - Placeholder path for now */}
                        <div onClick={() => navigate('/', { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z" /></svg>
                        </div>
                        {/* Chat Icon - Navigation remains the same */}
                        <div onClick={() => navigate(`${location.pathname}/chat`, { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M576 304C576 436.5 461.4 544 320 544C282.9 544 247.7 536.6 215.9 523.3L97.5 574.1C88.1 578.1 77.3 575.8 70.4 568.3C63.5 560.8 62 549.8 66.8 540.8L115.6 448.6C83.2 408.3 64 358.3 64 304C64 171.5 178.6 64 320 64C461.4 64 576 171.5 576 304z" /></svg>
                        </div>
                    </div>
                </div>
            </header>


            <PullToRefresh onRefresh={refreshSensor} isReady={isAppReady}>
                {/* ... Main Content ... */}
                <div className={`justify-center transition-all duration-200`}>
                    <div>
                        <img src='https://i.postimg.cc/W1dJ7GDb/Chilli.png' className='w-[50%] max-w-2xs m-auto pt-20' />
                        <div className='ellipseBackground bg-[#F3F3F3] z-0'></div>
                    </div>

                    <div className='PlantBackground bg-[#F3F3F3]'>
                        <div className='text-center mt-2'>Species: {plantSpecies}</div> {/* Context value */}
                        <div className='text-center -mt-1'>Age: {plantAge} days</div> {/* Context value */}

                        <div className='max-w-2xl m-auto p-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)] grid grid-cols-2 gap-4'>

                            {/* Helper Tip */}
                            <div className={`${helperTip === '' ? 'hidden' : ''} col-span-2 text-center bg-white rounded-lg p-3 text-base`}>
                                แนะนำ: {helperTip}
                            </div>

                            {/* Soil Moisture Card */}
                            <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                                <div className={`text-base ${ThresholdDisplay(SoilMoistureThreshold, soilMoisture).textColor}`}><FontAwesomeIcon icon={faSeedling} /> Soil Moisture</div>
                                <div>
                                    <div className='text-xl'>{ThresholdDisplay(SoilMoistureThreshold, soilMoisture).text}</div>
                                    <div className='text-3xl'>{soilMoisture}%</div>
                                </div>
                            </div>

                            {/* Temperature Card */}
                            <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                                <div className={`text-base ${ThresholdDisplay(TemperatureThreshold, temperature).textColor}`}><FontAwesomeIcon icon={faTemperatureHalf} />Temperature</div>
                                <div>
                                    <div className='text-xl'>{ThresholdDisplay(TemperatureThreshold, temperature).text}</div>
                                    <div className='text-3xl'>{temperature}°C</div>
                                </div>
                            </div>

                            {/* Weather Card */}
                            <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                                <div className={`text-base`}><FontAwesomeIcon icon={faCloud} /> Weather</div>
                                <div className='text-center text-5xl'><FontAwesomeIcon icon={weatherIcon} /></div>
                                <div>
                                    <div className='text-xl'>{getWeatherDetails(weather).description}</div>
                                </div>
                            </div>

                            {/* Humidity Card */}
                            <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                                <div className={`text-base ${ThresholdDisplay(HumidityThreshold, humidity).textColor}`}><FontAwesomeIcon icon={faDroplet} /> Humidity</div>
                                <div>
                                    <div className='text-xl'>{ThresholdDisplay(HumidityThreshold, humidity).text}</div>
                                    <div className='text-3xl'>{humidity}%</div>
                                </div>
                            </div>

                            {/* Light Intensity Card */}
                            <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                                <div className={`text-base ${ThresholdDisplay(LightIntensityThreshold, lightIntensity).textColor}`}><FontAwesomeIcon icon={faLightbulb} /> Light Intensity</div>
                                <div>
                                    <div className='text-xl'>{ThresholdDisplay(LightIntensityThreshold, lightIntensity).text}</div>
                                    <div className='text-2xl'>{lightIntensity.toLocaleString('en-US')} Lux</div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </PullToRefresh>
        </>
    )
}
export default PlantView;