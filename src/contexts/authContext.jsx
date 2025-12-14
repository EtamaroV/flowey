// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import LoginRegister from '@/views/auth/LoginRegister';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

// 📍 กำหนดเวลาหน่วง (Delay) ก่อนการลองใหม่
const RETRY_DELAY_MS = 3000; // 3 วินาที

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [plants, setPlants] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // =======================================================
    // ✅ 1. ฟังก์ชันสำหรับโหลด User Data โดยเฉพาะ
    // =======================================================
    const fetchUser = async () => {
        const userData = await authService.getUser();
        if (userData) {
            setUser(userData);
            return userData; // คืนค่าเพื่อให้ฟังก์ชันเรียกใช้รู้ว่าสำเร็จ
        }
        
        throw new Error("Failed to fetch user data."); // โยน Error ถ้าดึงไม่ได้
    };

    // =======================================================
    // ✅ 2. ฟังก์ชันสำหรับโหลด Plant Data โดยเฉพาะ (ใช้ชื่อ getData ตามที่ตกลง)
    // =======================================================
    const fetchPlants = async () => {
        // ใช้ authService.getData() เพื่อดึงข้อมูลพืช
        const plantsData = await authService.getPlants();
        if (plantsData) {
            setPlants(plantsData);
            return plantsData; // คืนค่าเพื่อให้ฟังก์ชันเรียกใช้รู้ว่าสำเร็จ
        }
        else {
            setPlants([]);
            return [];
        }
    };
    
    // =======================================================
    // 3. ฟังก์ชันหลักสำหรับเรียกใช้ตอนเริ่มต้นพร้อม Retry Mechanism
    // =======================================================
    const attemptToFetchData = async (isMounted) => {
        // 🔁 วนซ้ำจนกว่าจะสำเร็จ หรือ Component ถูก unmount
        while (isMounted()) {
            try {
                console.log("Attempting to fetch all required data...");
                
                // ดึงข้อมูลทั้ง User และ Plants พร้อมกัน (หรือตามลำดับที่คุณต้องการ)
                await Promise.all([
                    fetchUser(),
                    fetchPlants()
                ]);
                
                // ✅ SUCCESS: ออกจากการวนซ้ำ
                console.log("Data fetched successfully.");
                return true; 

            } catch (error) {
                // ❌ ERROR: แสดงข้อผิดพลาดและหน่วงเวลาก่อนลองใหม่
                console.error(`Error fetching data, retrying in ${RETRY_DELAY_MS / 1000} seconds...`, error);
                
                // หน่วงเวลาด้วย Promise
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
        return false; // หาก Component ถูก unmount ก่อนสำเร็จ
    };

    useEffect(() => {
        let mounted = true; 
        const isMounted = () => mounted; // ใช้ฟังก์ชันเพื่อดึงค่าล่าสุดของ mounted

        const initializeAuth = async () => {
            const isAuth = await authService.isAuthenticated();

            if (!isAuth) {
                setIsAuthenticated(false);
            } else {
                setIsAuthenticated(true);
                // เริ่มกลไกการดึงข้อมูลพร้อม Retry
                await attemptToFetchData(isMounted);
            }
            
            // จบกระบวนการโหลด
            if (isMounted()) {
                setLoading(false);
            }
        };

        initializeAuth();
        
        // 🧹 Cleanup function
        return () => {
            mounted = false; // หยุดการทำงานของ Loop
        };
    }, []);

    // ... ส่วนของ loginAction และ logoutAction ...

    const loginAction = async (token) => {
        // ... set token (ถ้าจำเป็น) ...
        
        try {
            // ไม่ต้องมี retry ใน Login แต่เรียกดึงข้อมูลแต่ละส่วน
            await Promise.all([
                fetchUser(),
                fetchPlants()
            ]);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Login data fetch failed:", error);
            // ถ้าดึงข้อมูลไม่ได้ ควรถือว่า Login ไม่สมบูรณ์
            authService.logout();
            setIsAuthenticated(false);
        }
    };

    const logoutAction = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        setPlants(null);
    };

    const value = {
        user,
        plants,
        isAuthenticated,
        loading,
        login: loginAction,
        logout: logoutAction,
        // ✅ ส่งออกฟังก์ชันเพื่อให้หน้าอื่นเรียกใช้ได้
        refetchUser: fetchUser,
        refetchPlants: fetchPlants,
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading Authentication...</div>;
    }

    if (isAuthenticated) {
        return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    } else {
        return <AuthContext.Provider value={value}><LoginRegister /></AuthContext.Provider>;
    }
};