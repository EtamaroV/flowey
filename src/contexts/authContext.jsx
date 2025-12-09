// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import LoginRegister from '@/views/auth/LoginRegister';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [plants, setPlants] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // แยกฟังก์ชันโหลดข้อมูลออกมา เพื่อเรียกใช้ซ้ำได้ง่าย
    const fetchUserData = async () => {
        try {
            const plantsData = await authService.getPlants();
            if (plantsData) {
                setPlants(plantsData);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            // 1. รอเช็ค Token ให้เสร็จก่อน (await สำคัญมาก)
            const isAuth = await authService.isAuthenticated();

            if (isAuth) {
                setIsAuthenticated(true);
                // 2. ถ้า Token ผ่าน ค่อยไปดึงข้อมูล (แก้ปัญหา Server ตอบไม่ทัน)
                await fetchUserData();
            } else {
                // ถ้า Token ไม่ผ่าน ก็ไม่ต้องดึงข้อมูล
                setIsAuthenticated(false);
            }
            
            // 3. จบกระบวนการโหลด
            setLoading(false);
        };

        initializeAuth();
        // ลบ getUserData() ตรงนี้ออก เพราะเราย้ายไปทำข้างบนแล้ว
    }, []);

    const loginAction = async (token) => {
        // ถ้ามีการรับ Token มาใหม่ ให้ set ลง local storage ก่อน (ถ้า authService ไม่ได้ทำไว้)
        // authService.setAuthToken(token); 

        setIsAuthenticated(true);
        
        // โหลดข้อมูลทันทีเมื่อ Login สำเร็จ
        await fetchUserData();
    };

    const logoutAction = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        setPlants(null); // เคลียร์ข้อมูลเก่าออกด้วย
    };

    const value = {
        user,
        plants,
        isAuthenticated,
        loading,
        login: loginAction,
        logout: logoutAction
    };

    if (loading) {
        // ตกแต่ง Loading ตรงนี้ได้ตามชอบ
        return <div className="flex justify-center items-center h-screen">Loading Authentication...</div>;
    }

    if (isAuthenticated) {
        return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    } else {
        return <AuthContext.Provider value={value}><LoginRegister /></AuthContext.Provider>;
    }
};