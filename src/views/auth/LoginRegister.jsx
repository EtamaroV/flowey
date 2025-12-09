import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import axios from 'axios';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/authContext';

function OnBoarding({ setPage }) {

    return (
        <>
            <div className=''>

            </div>
            <div className='flex flex-col p-5 pb-20 justify-between h-[40dvh]'>
                <div className='flex flex-col gap-5'>
                    <div className='text-4xl font-extrabold text-center px-5 text-hunter-green-600'>
                        Ready to Grow?
                    </div>

                    <div className='text-base font-medium text-center px-5'>
                        Join the Flowey and start your green journey today.
                    </div>
                </div>
                <div className='flex flex-row justify-between gap-4'>
                    <div onClick={() => setPage(1)} className='flex-1 px-5 py-3 bg-hunter-green-500 text-white font-bold text-lg text-center rounded-lg box-shadow'>
                        Login
                    </div>
                    <div onClick={() => setPage(2)} className='flex-1 px-5 py-3 bg-gray-100 text-black font-bold text-lg text-center rounded-lg box-shadow'>
                        Register
                    </div>
                </div>
            </div>
        </>
    )
}

function LoginPage({ setPage }) {

    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [errorStatus, setErrorStatus] = useState('')

    const handleLogin = async () => {
            try {
                // Axios จะแปลง Object { email, nickname, password } เป็น JSON
                // และตั้งค่า Content-Type: application/json ให้โดยอัตโนมัติ
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_SERVER_URL}auth/login`, {
                    email: email,
                    password: password
                }
                );

                // Axios จะโยน error อัตโนมัติสำหรับสถานะ 4xx และ 5xx
                // ดังนั้นโค้ดส่วนนี้จะทำงานต่อเมื่อ response เป็น 2xx เท่านั้น

                const data = response.data;

                if (data.pass) {
                    setErrorStatus('')
                    authService.setAuthToken(data.token);

                    login();
                } else {
                    setErrorStatus("Your login info didn't match.")
                }

            } catch (error) {
                setErrorStatus('Something went wrong, please try again later.')
            };
        }

    const handleForgot = () => {
        console.log('Forgot');
    }

    return (
        <>
            <div className='flex flex-col p-5 pt-20 h-full gap-20'>
                <div className='flex flex-col gap-5'>
                    <div className='text-4xl font-extrabold text-center px-5 text-hunter-green-600'>
                        Login here
                    </div>

                    <div className='text-lg font-bold text-center px-8'>
                        Welcome back, Flowey always miss you!
                    </div>
                </div>
                <div className='flex flex-col justify-between gap-5'>
                    <input
                        type='email'
                        placeholder='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                    />

                    {/* Password Input */}
                    <input
                        type='password'
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                    />

                    {errorStatus ? (
                        <p className='text-red-500 text-sm -mt-2'>{errorStatus}</p>
                    ) : (
                        <p className='text-transparent text-sm -mt-2'>No No</p>
                    )}

                    <div onClick={handleForgot} className='flex-1 py-2 text-hunter-green-600 font-bold text-sm text-right '>
                        Forgot your password?
                    </div>
                    
                    <div onClick={handleLogin} className='flex-1 px-5 py-3 bg-hunter-green-500 text-white font-bold text-lg text-center rounded-lg box-shadow'>
                        Login
                    </div>
                    <div onClick={() => setPage(2)} className='flex-1 px-5 py-3 text-gray-700 font-bold text-sm text-center '>
                        Create new account
                    </div>
                </div>
            </div>
        </>
    )
}

// Assuming setPage is the function passed from LoginRegister to change the main view (0, 1, 2)
function RegisterFlow({ setPage }) {

    const { login } = useAuth();

    // Local state to manage which step of the registration the user is on (1, 2, or 3)
    const [step, setStep] = useState(1);

    // State to hold all registration data across steps
    const [formData, setFormData] = useState({
        nickname: '',
        email: '',
        password: '',
        confirmPassword: '',
        confirmCode: ''
    });

    // Helper function to update the form data
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [sessionId, setSessionId] = useState(null)

    const sendEmailConfirmation = async () => {
        try {
            // Axios จะแปลง Object { email, nickname, password } เป็น JSON
            // และตั้งค่า Content-Type: application/json ให้โดยอัตโนมัติ
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_SERVER_URL}auth/send-email-comfirmation`, {
                nickname: formData.nickname,
                email: formData.email,
                session: sessionId
            }
            );

            // Axios จะโยน error อัตโนมัติสำหรับสถานะ 4xx และ 5xx
            // ดังนั้นโค้ดส่วนนี้จะทำงานต่อเมื่อ response เป็น 2xx เท่านั้น

            const data = response.data;

            if (data.session) {
                setSessionId(data.session);
            }

        } catch (error) {
            if (error.response) {
                const errorData = error.response.data;

                throw new Error(errorData.message || 'Email confirmation failed.');

            } else if (error.request) {
                console.error('No response received:', error.request);
                throw new Error('No response from server. Check network connection.');

            } else {
                console.error('Error setting up request:', error.message);
                throw new Error('An unexpected error occurred.');
            }
        }
    };

    // --- 1. First Step: Nickname ---
    const renderStepOne = () => (
        <>
            <div className='flex flex-col gap-5'>
                <div className='text-4xl font-extrabold text-center px-5 text-hunter-green-600'>
                    Register
                </div>
                <div className='text-lg font-bold text-center px-8'>
                    Let's start your journey!
                </div>
            </div>

            <div className='flex flex-col justify-between'>
                <div className='text-lg font-bold text-left px-3 py-2'>
                    What should I call you?
                </div>
                <input
                    type='text'
                    name='nickname'
                    placeholder='Nickname'
                    value={formData.nickname}
                    onChange={handleChange}
                    className='w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                />
            </div>

            <div className='flex flex-col gap-3'>
                <div
                    onClick={() => setStep(2)}
                    // Disable button if nickname is empty
                    className={`flex-1 px-5 py-3 text-white font-bold text-lg text-center rounded-lg box-shadow cursor-pointer ${formData.nickname ? 'bg-hunter-green-500' : 'bg-gray-400'
                        }`}
                    style={{ pointerEvents: formData.nickname ? 'auto' : 'none' }}
                >
                    Next
                </div>
                <div onClick={() => setPage(1)} className='flex-1 px-5 py-3 text-gray-700 font-bold text-sm text-center cursor-pointer'>
                    Already have an account? Login
                </div>
            </div>
        </>
    );

    // --- 2. Second Step: Email, Password, & Confirmation ---
    const [status, setStatus] = useState({ 
        error: '', 
        isChecking: false 
    });

    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i;

    useEffect(() => {
        const email = formData.email;

        // 1. Reset state if empty
        if (!email) {
            setStatus({ error: '', isChecking: false });
            return;
        }

        // 2. Client-side Regex Check (Instant)
        if (!emailRegex.test(email)) {
            setStatus({ error: 'Invalid email format', isChecking: false });
            return; // Stop here, don't hit the API
        }

        setStatus({ error: '', isChecking: true });

        const delayDebounceFn = setTimeout(async () => {

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_SERVER_URL}auth/check-email`, {
                        email: formData.email
                    }
                );
                
                if (response.data.exists) {
                    setStatus({ error: 'Email is already taken', isChecking: false });
                } else {
                    setStatus({ error: '', isChecking: false });
                }
                
            } catch (error) {
                setStatus({ error: '', isChecking: false });
            }
        }, 800);

        // Cleanup function: If user types again before 800ms, 
        // this runs and kills the previous timer.
        return () => clearTimeout(delayDebounceFn);

    }, [formData.email]);
    const renderStepTwo = () => {
        const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
        const emailPass = !status.error && !status.isChecking
        const fieldsComplete = emailPass && passwordsMatch;

        return (
            <>
                <div className='flex flex-col gap-5'>
                    <div className='text-4xl font-extrabold text-center px-5 text-hunter-green-600'>
                        Setup Account
                    </div>
                    <div className='text-lg font-bold text-center px-8'>
                        Enter your email and a strong password.
                    </div>
                </div>

                <div className='flex flex-col justify-between'>
                    <div className='text-lg font-bold text-left px-3 py-2'>
                        Email
                    </div>
                    <input
                        type='email'
                        name='email'
                        placeholder='Email'
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-base focus:outline-none focus:ring-2 ${status.error ? 'ring-red-500' : 'ring-hunter-green-500'}`}
                    />
                    {status.error ? (
                        <p className='text-red-500 text-sm mt-2'>{status.error}</p>
                    ) : (
                        <p className={`text-sm mt-2 ${status.isChecking ? 'text-gray-500' : 'text-transparent'}`}>Checking availability...</p>
                    )}

                    <div className='text-lg font-bold text-left px-3 pt-8 pb-2'>
                        Password
                    </div>

                    <input
                        type='password'
                        name='password'
                        placeholder='Password'
                        value={formData.password}
                        onChange={handleChange}
                        className='w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                    />

                    {/* Password Confirmation Input */}
                    <input
                        type='password'
                        name='confirmPassword'
                        placeholder='Confirm Password'
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-5 py-4 mt-2 bg-hunter-green-50 rounded-lg text-base focus:outline-none focus:ring-2 ${formData.confirmPassword.length > 0 && !passwordsMatch ? 'ring-red-500' : 'ring-hunter-green-500'
                            }`}
                    />
                    {!passwordsMatch && formData.confirmPassword.length > 0 ? (
                        <p className='text-red-500 text-sm mt-2'>Passwords do not match.</p>
                    ) : (
                        <p className='text-transparent text-sm mt-2'>Passwords do not match.</p>
                    )}
                </div>

                <div className='flex flex-col gap-3'>
                    <div
                        onClick={() => {
                            setStep(3);
                            sendEmailConfirmation();
                        }}
                        // Disable button if fields are not complete and passwords don't match
                        className={`flex-1 px-5 py-3 text-white font-bold text-lg text-center rounded-lg box-shadow cursor-pointer ${fieldsComplete ? 'bg-hunter-green-500' : 'bg-gray-400'
                            }`}
                        style={{ pointerEvents: fieldsComplete ? 'auto' : 'none' }}
                    >
                        Next
                    </div>
                    <div onClick={() => setStep(1)} className='flex-1 px-5 py-3 text-gray-700 font-bold text-sm text-center cursor-pointer'>
                        Go back
                    </div>
                </div>
            </>
        );
    };


    const [confirmError, setConfirmError] = useState('')
    // --- 3. Third Step: Confirm Code from Email ---
    const renderStepThree = () => {
        const handleFinalRegister = async () => {
            try {
                // Axios จะแปลง Object { email, nickname, password } เป็น JSON
                // และตั้งค่า Content-Type: application/json ให้โดยอัตโนมัติ
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_SERVER_URL}auth/register`, {
                    formData,
                    sessionId: sessionId
                }
                );

                // Axios จะโยน error อัตโนมัติสำหรับสถานะ 4xx และ 5xx
                // ดังนั้นโค้ดส่วนนี้จะทำงานต่อเมื่อ response เป็น 2xx เท่านั้น

                const data = response.data;

                if (data.pass) {
                    setConfirmError('')
                    authService.setAuthToken(data.token);

                    login()
                } else {
                    if (data.reason == 1) {
                        setConfirmError('Wrong confirmation code.')
                    } else if (data.reason == 2) {
                        setConfirmError('This email is already taken.')
                        setStep(2)
                    }
                }

            } catch (error) {
                setConfirmError('Something went wrong, please try again later.')
            };
        }

        return (
            <>
                <div className='flex flex-col gap-5'>
                    <div className='text-4xl font-extrabold text-center px-5 text-hunter-green-600'>
                        Verify Email
                    </div>
                    <div className='text-lg font-bold text-center px-8'>
                        We sent a code to <span className='text-hunter-green-600'>{formData.email}</span><br />Enter it below!
                    </div>
                </div>

                <div className='flex flex-col justify-between gap-5'>
                    {/* Confirmation Code Input */}
                    <input
                        type='text'
                        name='confirmCode'
                        placeholder='Confirmation Code'
                        value={formData.confirmCode}
                        onChange={handleChange}
                        className='w-full px-5 py-4 bg-hunter-green-50 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-hunter-green-500'
                    />
                    {confirmError !== '' && formData.confirmCode > 0 ? (
                        <p className='text-red-500 text-sm mt-2'>Wrong confirmation code.</p>
                    ) : (
                        <p className='text-transparent text-sm mt-2'>Wrong confirmation code.</p>
                    )}
                    <div onClick={() => { sendEmailConfirmation(); setConfirmError(''); }} className='text-sm text-gray-500 text-center cursor-pointer'>
                        Resend Code
                    </div>
                </div>

                <div className='flex flex-col gap-3'>
                    <div className='text-sm text-gray-500 opacity-40 text-center'>
                        {sessionId}
                    </div>
                    <div
                        onClick={handleFinalRegister}
                        // Disable button if confirmation code is empty
                        className={`flex-1 px-5 py-3 text-white font-bold text-lg text-center rounded-lg box-shadow cursor-pointer ${formData.confirmCode.length > 0 ? 'bg-hunter-green-500' : 'bg-gray-400'
                            }`}
                        style={{ pointerEvents: formData.confirmCode.length > 0 ? 'auto' : 'none' }}
                    >
                        Confirm and Finish
                    </div>
                    <div onClick={() => setStep(2)} className='flex-1 px-5 py-3 text-gray-700 font-bold text-sm text-center cursor-pointer'>
                        Go back
                    </div>
                </div>
            </>
        );
    };

    // Main render function based on the current step
    const renderStep = () => {
        switch (step) {
            case 1:
                return renderStepOne();
            case 2:
                return renderStepTwo();
            case 3:
                return renderStepThree();
            default:
                return renderStepOne();
        }
    };

    return (
        <div className='flex flex-col p-5 pt-20 h-full justify-between gap-10'>
            {renderStep()}
        </div>
    );
}

function LoginRegister() {

    const [nowPage, setPage] = useState(1);

    return (
        <>
            <div className='fixed w-[100dvw] flex flex-wrap flex-col justify-between h-[calc(100dvh-env(safe-area-inset-bottom))] '>
                {(() => {
                    switch (nowPage) {
                        case 1:
                            return <LoginPage setPage={setPage} />
                        case 2:
                            return <RegisterFlow setPage={setPage} />
                        default:
                            return <OnBoarding setPage={setPage} />
                    }
                })()}

            </div>
        </>
    )
}

export default LoginRegister