import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService'; // นำเข้า authService ที่เราสร้างไว้
import LoginRegister from '@/views/auth/LoginRegister';

// 1. สร้าง Context Object
const AuthContext = createContext(null);

// 2. Custom Hook เพื่อใช้ Context ได้ง่ายขึ้น
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Auth Provider Component
export const AuthProvider = ({ children }) => {
    // สถานะหลัก: เก็บข้อมูลผู้ใช้ และสถานะการโหลด
    const [user, setUser] = useState(null);
    const [plants, setPlants] = useState(null);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // สำหรับจัดการการโหลดครั้งแรก

    const getUserData = async () => {
        const plantsData = await authService.getPlants();

        if (plantsData) {
            setPlants(plantsData);
        }

    };

    // --- ฟังก์ชันสำหรับโหลดสถานะเมื่อแอปเริ่มต้น ---
    useEffect(() => {
        // ฟังก์ชันนี้จะทำงานเมื่อ Component ถูก Mount (โหลดครั้งแรก)
        const initializeAuth = async () => {
            const isAuth = await authService.isAuthenticated();
            // 1. ตรวจสอบว่ามี Token ใน Local Storage หรือไม่
            if (isAuth && setLoading) {
                setIsAuthenticated(true);
            }
            setLoading(false);
        };

        initializeAuth();
        getUserData();
    }, []);

    const loginAction = (token) => {
        // 1. ถ้า LoginRegister ยังไม่ได้ set token, ให้ set ตรงนี้
        // localStorage.setItem('token', token); 
        
        // 2. สำคัญ: สั่ง State ให้เปลี่ยน เพื่อให้หน้าเว็บเปลี่ยนทันทีไม่ต้อง Refresh
        setIsAuthenticated(true);
        
        // 3. (Optional) โหลดข้อมูล User มาเก็บไว้
        // const userData = await authService.getProfile();
        // setUser(userData);
    };

    const logoutAction = () => {
        authService.logout(); // ลบ token
        setIsAuthenticated(false); // สั่ง Render ใหม่กลับไปหน้า Login
        setUser(null);
    };


    // 4. ค่าที่จะส่งผ่าน Context
    const value = {
        user,
        plants,
        isAuthenticated,
        loading,
        login: loginAction,   // <--- ส่งออกไป
        logout: logoutAction  // <--- ส่งออกไป
    };

    // 5. ส่ง Provider คืน
    if (loading) {
        return <div>Loading Authentication...</div>; // แสดง Loading ขณะตรวจสอบ Token
    }

    if (isAuthenticated) {
        return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    } else {
        return <AuthContext.Provider value={value}><LoginRegister /></AuthContext.Provider>;
    }
};