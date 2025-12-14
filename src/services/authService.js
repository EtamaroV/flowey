import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
// กำหนด Endpoint พื้นฐานของ API ของคุณ
const API_BASE_URL = import.meta.env.VITE_BACKEND_SERVER_URL;
const TOKEN_KEY = "authToken";

// --- ฟังก์ชันช่วยเหลือสำหรับการจัดการ Token (ไม่มีการเปลี่ยนแปลง) ---

/**
 * เก็บ Token ใน Local Storage
 * @param {string} token - JWT ที่ได้รับจากเซิร์ฟเวอร์
 */
const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * ดึง Token จาก Local Storage
 * @returns {string | null} JWT หรือ null ถ้าไม่มี
 */
const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * ลบ Token ออกจาก Local Storage
 */
const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * 🧐 ตรวจสอบสถานะการยืนยันตัวตน
 * @returns {boolean} true ถ้ามี Token และ false ถ้าไม่มี
 */
//const isAuthenticated = () => {
//  const token = getAuthToken();
//  return !!token;
//};

/**
 * 🚪 ออกจากระบบ (Logout)
 */
const logout = () => {
  removeAuthToken();
  console.log("User logged out and token removed.");
};

// authService.js (ปรับปรุง isAuthenticated)
const MAX_AUTH_RETRY = 3;
const RETRY_DELAY_MS = 1000;

const isAuthenticated = async () => {
  const token = getAuthToken();
  if (token == null) return false;

  for (let attempt = 1; attempt <= MAX_AUTH_RETRY; attempt++) {
      try {
          const response = await axios.post(
              `${import.meta.env.VITE_BACKEND_SERVER_URL}auth/check-token`,
              {},
              {
                  headers: { Authorization: `Bearer ${token}` },
                  // 💡 เพิ่ม timeout เพื่อป้องกันการรอนานเกินไป
                  timeout: 5000, 
              },
          );

          if (response.data.pass) {
              return true;
          } else {
              // Server ตอบกลับว่า Token ไม่ถูกต้อง (pass: false)
              logout();
              return false;
          }
      } catch (error) {
          // Network Error, Timeout, หรือ Server 5xx
          if (attempt < MAX_AUTH_RETRY) {
              console.warn(`Auth Check failed, retrying (${attempt}/${MAX_AUTH_RETRY})...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          } else {
              console.error("Auth Check failed after all retries.", error);
              // ไม่จำเป็นต้อง logout เพราะอาจเป็น Network Error ชั่วคราว
              return false;
          }
      }
  }
  return false;
};

const getUser = async () => {
    const token = getAuthToken();

    if (token == null) {
      // 🚩 กรณีไม่มี Token: ไม่ต้องโยน Error แต่ถือว่าไม่ผ่านการยืนยันตัวตน
      throw new Error("No authentication token found."); 
    }

    // ❌ ลบ try...catch ออกเพื่อให้ Axios Error ถูกโยนออกไป
    const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_SERVER_URL}user/get-user`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
    );
    
    // Axios โยน Error สำหรับ 4xx/5xx อัตโนมัติอยู่แล้ว
    const data = response.data;
    
    if (data) {
        return data;
    } else {
        // 🚩 กรณีได้ Response 2xx แต่ Data เป็น null/undefined
        throw new Error("Received empty data from user/get-user endpoint.");
    }
};

// ทำแบบเดียวกันกับ getPlants
const getPlants = async () => {
    const token = getAuthToken();

    if (token == null) {
      throw new Error("No authentication token found.");
    }

    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_SERVER_URL}user/get-plants`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = response.data;

    // 💡 ข้อควรระวัง: ถ้าต้องการให้คืนค่าเป็น [] เมื่อไม่มีข้อมูล (ตามที่คุณเขียนใน AuthContext)
    // ให้ตรวจสอบว่า data เป็น Array หรือไม่
    if (data && Array.isArray(data)) {
      return data;
    } else if (data === null || data === undefined || data === "") {
      return []; // คืนค่า Array เปล่าตามที่ตกลงกันไว้
    } else {
      throw new Error("Invalid data format received from get-plants.");
    }
};

const DEVICE_ID_KEY = 'client_uuid';

const getDeviceId = () => {
    // 1. Try to retrieve from LocalStorage
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    // 2. If not found, generate a new one and save it
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    // 3. Return the ID (whether it was just created or retrieved)
    return deviceId;
};

const clearDeviceId = () => {
    localStorage.removeItem(DEVICE_ID_KEY);
};

// --- ส่งออกฟังก์ชันเพื่อให้ Component อื่นๆ เรียกใช้ ---
export const authService = {
  logout,
  setAuthToken,
  getAuthToken,
  isAuthenticated,
  getPlants,
  getUser,
  getDeviceId,
  clearDeviceId
};
