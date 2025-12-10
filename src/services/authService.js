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

const isAuthenticated = async () => {
  const token = getAuthToken();

  if (token == null) return false;

  try {
    // Axios จะแปลง Object { email, nickname, password } เป็น JSON
    // และตั้งค่า Content-Type: application/json ให้โดยอัตโนมัติ
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_SERVER_URL}auth/check-token`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // Axios จะโยน error อัตโนมัติสำหรับสถานะ 4xx และ 5xx
    // ดังนั้นโค้ดส่วนนี้จะทำงานต่อเมื่อ response เป็น 2xx เท่านั้น

    const data = response.data;

    if (data.pass) {
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    return false;
  }
  return false;
};

const getPlants = async () => {
    const token = getAuthToken();

    if (token == null) return false;

    try {
        // Axios จะแปลง Object { email, nickname, password } เป็น JSON
        // และตั้งค่า Content-Type: application/json ให้โดยอัตโนมัติ
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_SERVER_URL}user/get-plants`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Axios จะโยน error อัตโนมัติสำหรับสถานะ 4xx และ 5xx
        // ดังนั้นโค้ดส่วนนี้จะทำงานต่อเมื่อ response เป็น 2xx เท่านั้น

        const data = response.data;

        console.log(data)

        if (data) {
          return data;
        } else {
          return false;
        }
    } catch (error) {
      return false;
    }
};

const getUser = async () => {
    const token = getAuthToken();

    if (token == null) return false;

    try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_SERVER_URL}user/get-user`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = response.data;

        console.log(data)

        if (data) {
          return data;
        } else {
          return false;
        }
    } catch (error) {
      return false;
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
