import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDroplet, faLightbulb, faSeedling, faTemperatureHalf,

    faSun, faCloud, faSmog, faCloudRain, faCloudShowersHeavy,
    faCloudShowersWater, faSnowflake, faCloudBolt,
    faArrowUp,
    faBrain
} from '@fortawesome/free-solid-svg-icons';

import {
    usePlantContext,
    SoilMoistureThreshold,
    TemperatureThreshold,
    HumidityThreshold,
    LightIntensityThreshold,
    ThresholdDisplay,
    WMO_WEATHER_MAP
} from '@/contexts/plantContext'; // Adjust path as necessary

import { useAuth } from '@/contexts/authContext';

function PlantChat() {
    const { uuid } = useParams();
    let navigate = useNavigate();

    // ⭐️ CONSUME CONTEXT ⭐️
    const {
        plantNickname, plantSpecies, plantAge,
        soilMoisture, temperature, weather, humidity, lightIntensity,
        isAppReady, refreshSensor
    } = usePlantContext();

    const { user } = useAuth()

    const [AIThinking, setAIThinking] = useState(false);

    const [textbox, setTextbox] = useState('');
    const textboxRef = useRef(null);

    const [groupedMessages, setGroupedMessages] = useState([]);

    const [messages, setMessages] = useState([]);

    const inputAreaRef = useRef(null);

    const addMessage = (sender, text) => {
        setMessages(prev => [
            ...prev,
            {
                id: prev.length + 1,
                sender,
                text,
                timestamp: new Date().toISOString()
            }
        ]);
    }

    const handleInput = () => {
        if (textboxRef.current) {
            const rawHTML = textboxRef.current.innerHTML;
            const rawText = textboxRef.current.innerText;

            // Check if it's empty visually (no real characters, only <br> or <p><br></p>)
            const visuallyEmpty = rawHTML
                .replace(/<br\s*\/?>/gi, '')
                .replace(/<\/?p>/gi, '')
                .replace(/&nbsp;/gi, '')
                .replace(/<\/div>/gi, '')
                .replace(/<div>/gi, '') === '';

            if (visuallyEmpty) {

                setTextbox('')

            } else {

                setTextbox(rawText.replace(/<\/div>/gi, '').replace(/<div>/gi, '').trim().replace(/\n/g, '<br>').replace(/(<br>){11,}/g, "<br><br><br><br><br><br><br><br><br><br>"))

            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent line break

            sendMessage()
        }
    };

    const sendMessage = () => {
        if (textbox.length > 0 && !AIThinking) {
            //console.log('Sending message:', textbox);

            //alert(textbox);
            sendToAI(textbox);

            addMessage('%USER%', textbox);
            setTextbox('');

            textboxRef.current.innerText = ''; // Clear the content
        }
    }

    const MAX_DIFF_MINUTES = 2;

    function isSameGroup(msg1, msg2) {
        if (!msg1 || !msg2) return false;
        const time1 = new Date(msg1.timestamp);
        const time2 = new Date(msg2.timestamp);
        const diff = Math.abs(time2 - time1) / 1000 / 60; // in minutes
        return msg1.sender === msg2.sender && diff < MAX_DIFF_MINUTES;
    }

    useEffect(() => {
        const grouped = messages.map((msg, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];

            const isFirst = !isSameGroup(prev, msg);
            const isLast = !isSameGroup(msg, next);

            return {
                ...msg,
                classNamesTEXT: [
                    msg.sender === '%USER%' ? 'bg-hunter-green-100' : '',
                    (msg.sender === '%USER%' && isFirst && !isLast) ? 'rounded-br-xl' : '',
                    (msg.sender === '%USER%' && isLast && !isFirst) ? 'rounded-tr-xl' : '',
                    (msg.sender === '%USER%' && !isFirst && !isLast) ? 'rounded-br-xl rounded-tr-xl' : '',

                    msg.sender !== '%USER%' ? 'bg-hunter-green-50' : '',
                    (msg.sender !== '%USER%' && isFirst && !isLast) ? 'rounded-bl-xl' : '',
                    (msg.sender !== '%USER%' && isLast && !isFirst) ? 'rounded-tl-xl' : '',
                    (msg.sender !== '%USER%' && !isFirst && !isLast) ? 'rounded-bl-xl rounded-tl-xl' : '',
                ].join(' '),
                classNamesHOLDER: [
                    msg.sender === '%USER%' ? 'justify-end' : '',
                ].join(' '),
            };
        });

        //console.log(grouped)
        setGroupedMessages(grouped);
    }, [messages]);

    function getWeatherDetails(code) {
            const details = WMO_WEATHER_MAP[code];
            return details || WMO_WEATHER_MAP[0];
        }

    const sendToAI = async (msg) => {
        try {
            setAIThinking(true);
            await refreshSensor();
            console.log({
                    sessionId: user.id.toString()+"-"+uuid,
                    userNickname: user.nickname,
                    msg: msg,
                    plantNickname: plantNickname,
                    plantSpecies: plantSpecies,
                    plantAge: plantAge,
                    soilMoisture: `${ThresholdDisplay(SoilMoistureThreshold, soilMoisture).text}`,
                    temperature: `${temperature}C, ${ThresholdDisplay(TemperatureThreshold, temperature).text}`,
                    weather: `WMO Code ${weather}, ${getWeatherDetails(weather).description}`,
                    humidity: `${humidity}%, ${ThresholdDisplay(HumidityThreshold, humidity).text}`,
                    lightIntensity: `${lightIntensity} lux, ${ThresholdDisplay(LightIntensityThreshold, lightIntensity).text}`
                })
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_SERVER_URL}plant-chat`, {
                params: {
                    sessionId: user.id.toString()+"-"+uuid,
                    userNickname: user.nickname,
                    msg: msg,
                    plantNickname: plantNickname,
                    plantSpecies: plantSpecies,
                    plantAge: plantAge,
                    soilMoisture: `${ThresholdDisplay(SoilMoistureThreshold, soilMoisture).text}`,
                    temperature: `${temperature}C, ${ThresholdDisplay(TemperatureThreshold, temperature).text}`,
                    weather: `WMO Code ${weather}, ${getWeatherDetails(weather).description}`,
                    humidity: `${humidity}%, ${ThresholdDisplay(HumidityThreshold, humidity).text}`,
                    lightIntensity: `${lightIntensity} lux, ${ThresholdDisplay(LightIntensityThreshold, lightIntensity).text}`
                }
            });

            addMessage("%PLANT%", response.data.message);
            console.log(response)
            setAIThinking(false);
        } catch (err) {
            console.log(err)
            setAIThinking(false);
        }
    }

    return (
        <>

            <header className='fixed w-full left-0 safeTop h-17 z-50'>
                <div className='max-w-5xl m-auto flex justify-between topbarGradient'>
                    <div onClick={() => navigate(`/plant/${uuid}`, { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" /></svg>
                    </div>
                    <div className='max-w-5xl w-full absolute top-0 mt-3 p-3 text-xl text-center font-medium z-40'>
                        <div>{plantNickname}</div>
                    </div>


                </div>
            </header>


            <div className='w-full max-w-5xl fixed flex flex-col min-h-[100vh] justify-end bottom-0'>

                <div className='chatBox flex flex-col gap-y-1.5 justify-end'>

                    <div className="px-4 flex flex-row ">
                        <div className="rounded-4xl pt-3 pl-4 pr-4 pb-2 max-w-[70%] wrap-break-word bg-hunter-green-50">
                            สวัสดี เราชื่อ {plantNickname} น้า
                        </div>
                    </div>

                    {groupedMessages.map(msg => (

                        <div className={`px-4 flex flex-row ${msg.classNamesHOLDER}`} key={msg.id}>
                            <div className={`rounded-4xl pt-3 pl-4 pr-4 pb-2 max-w-[70%] wrap-break-word ${msg.classNamesTEXT}`} dangerouslySetInnerHTML={{ __html: msg.text }}></div>
                        </div>

                    ))}

                </div>



                <div className='z-10 flex flex-row mb-[env(safe-area-inset-bottom)]' ref={inputAreaRef}>
                    <div className='p-3 flex-1'>
                        <div className={`${textbox.length > 0 ? 'textBoxChat' : ''} frosted-element-just-shadow px-4 py-2 outline-0 border-2 border-hunter-green-200 rounded-4xl wrap-break-word`} ref={textboxRef} onInput={handleInput} onKeyDown={handleKeyDown} contentEditable="plaintext-only" role="textbox" spellCheck="false" inputMode="text" lang="th">
                        </div>
                    </div>


                    {(textbox.length > 0 || AIThinking) ? (
                        <div className='flex flex-col justify-end'>
                            <div onClick={sendMessage} className='box-shadow flex flex-row justify-center m-3 ml-0 w-11 h-11 bg-hunter-green-200 rounded-full text-center'>
                                {AIThinking == true ?
                                    (
                                        <FontAwesomeIcon icon={faBrain} className='self-center' />
                                    )
                                    :
                                    (
                                        <FontAwesomeIcon icon={faArrowUp} className='self-center' />
                                    )
                                }

                            </div>
                        </div>

                    ) : null}


                </div>

            </div>




        </>
    )
}
export default PlantChat;