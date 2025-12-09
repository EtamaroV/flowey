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

import { v4 as uuidv4 } from 'uuid';

import ThaiBasil from '@/assets/plants/ThaiBasil.png';

function PlantChat() {
    const [sessionId, setSessionId] = useState(uuidv4());

    const location = useLocation();
    const { id } = useParams();
    let navigate = useNavigate();

    const [plantNickname, setPlantNickname] = useState("เพาเพา")
    const [plantSpecies, setPlantSpecies] = useState("Thai basil")
    const [plantAge, setPlantAge] = useState(1)

    const [soilMoisture, setSoilMoisture] = useState(60)
    const [temperature, setTemperature] = useState(35)
    const [weather, setWeather] = useState(0)
    const [humidity, setHumidity] = useState(65)
    const [lightIntensity, setLightIntensity] = useState(3000)

    const SoilMoistureThreshold = [
        { min: 81, text: 'Flooded', dangerousLevel: 3 }, // High risk of root rot
        { min: 71, text: 'Very Humid', dangerousLevel: 2 }, // Soil is saturated, caution needed
        { min: 51, text: 'Humid', dangerousLevel: 1 }, // Good moisture, slight risk of fungus
        { min: 31, text: 'Comfortable', dangerousLevel: 0 }, // Optimal growing range
        { min: 11, text: 'Very Dry', dangerousLevel: 2 }, // Approaching wilting point
        { min: 0, text: 'Extremely Arid', dangerousLevel: 3 }, // Severe drought stress
    ];

    const TemperatureThreshold = [
        { min: 41, text: 'Dangerously Hot', dangerousLevel: 3 }, // Protein denaturation, cell death
        { min: 31, text: 'Very Hot', dangerousLevel: 2 }, // High heat stress, photosynthesis halts
        { min: 25, text: 'Warm', dangerousLevel: 1 }, // Optimal for warm-season plants
        { min: 18, text: 'Cool / Mild', dangerousLevel: 0 }, // Optimal for most plants
        { min: 10, text: 'Cold', dangerousLevel: 1 }, // Growth slows, chilling injury for tropicals
        { min: 0, text: 'Very Cold', dangerousLevel: 2 }, // Frost risk, dormancy induced
        { min: -10, text: 'Severe Cold', dangerousLevel: 3 }, // Freezing damage and death
        { min: -Infinity, text: 'Extreme Cold', dangerousLevel: 3 },
    ];

    const HumidityThreshold = [
        { min: 71, text: 'Very Humid', dangerousLevel: 2 }, // High risk of fungal diseases (e.g., powdery mildew)
        { min: 51, text: 'Humid', dangerousLevel: 1 }, // Good for many tropicals, monitor air circulation
        { min: 31, text: 'Comfortable', dangerousLevel: 0 }, // Ideal range for human and most plant health
        { min: 11, text: 'Very Dry', dangerousLevel: 2 }, // High water loss, risk of spider mites
        { min: 0, text: 'Extremely Arid', dangerousLevel: 3 }, // Rapid desiccation and severe stress
    ];

    const LightIntensityThreshold = [
        { min: 10001, text: 'Full Sun', dangerousLevel: 2 }, // High risk of light burn for many indoor plants; optimal for succulents/veg.
        { min: 5001, text: 'High Light', dangerousLevel: 1 }, // High growth, but still a risk for sensitive plants.
        { min: 2001, text: 'Medium Light', dangerousLevel: 0 }, // Optimal growing range for most common houseplants.
        { min: 501, text: 'Low Light', dangerousLevel: 1 }, // Growth is slow; insufficient for flowering/fruiting plants.
        { min: -Infinity, text: 'Very Low', dangerousLevel: 3 }, // Chronic insufficient light (starvation); plant will decline.
    ];

    const TextColorThreshold = [
        { min: 3, color: 'text-red-600' },
        { min: 2, color: 'text-orange-600' },
        { min: 1, color: 'text-yellow-500' },
        { min: 0, color: '' },
        { min: -Infinity, color: '' },
    ];

    // weatherUtils.js (or similar utility file)

    const WMO_WEATHER_MAP = {
        // Clear and Clouds
        0: { description: 'Clear sky', icon: faSun },
        1: { description: 'Mainly clear', icon: faSun },
        2: { description: 'Partly cloudy', icon: faCloud },
        3: { description: 'Overcast', icon: faCloud },

        // Fog and Deposition
        45: { description: 'Fog', icon: faSmog },
        48: { description: 'Depositing rime fog', icon: faSmog },

        // Drizzle
        51: { description: 'Light Drizzle', icon: faCloudRain },
        53: { description: 'Moderate Drizzle', icon: faCloudRain },
        55: { description: 'Dense Drizzle', icon: faCloudRain },
        56: { description: 'Light Freezing Drizzle', icon: faSnowflake },
        57: { description: 'Dense Freezing Drizzle', icon: faSnowflake },

        // Rain
        61: { description: 'Slight Rain', icon: faCloudRain },
        63: { description: 'Moderate Rain', icon: faCloudShowersHeavy },
        65: { description: 'Heavy Rain', icon: faCloudShowersHeavy },
        66: { description: 'Light Freezing Rain', icon: faSnowflake },
        67: { description: 'Heavy Freezing Rain', icon: faSnowflake },

        // Snow
        71: { description: 'Slight Snow fall', icon: faSnowflake },
        73: { description: 'Moderate Snow fall', icon: faSnowflake },
        75: { description: 'Heavy Snow fall', icon: faSnowflake },
        77: { description: 'Snow grains', icon: faSnowflake },

        // Showers
        80: { description: 'Slight Rain Showers', icon: faCloudShowersWater },
        81: { description: 'Moderate Rain Showers', icon: faCloudShowersWater },
        82: { description: 'Violent Rain Showers', icon: faCloudShowersHeavy },
        85: { description: 'Slight Snow Showers', icon: faSnowflake },
        86: { description: 'Heavy Snow Showers', icon: faSnowflake },

        // Thunderstorms (using the CloudBolt icon for general storms)
        95: { description: 'Thunderstorm', icon: faCloudBolt },
        96: { description: 'Thunderstorm with slight hail', icon: faCloudBolt },
        99: { description: 'Thunderstorm with heavy hail', icon: faCloudBolt },
    };


    function ThresholdDisplay(TextThreshold, value) {
        // Find the first range object where the input 'value' is greater than or equal to the 'min'
        const matchedRange = TextThreshold.find(
            (range) => value >= range.min
        );

        // Determine the final text and class
        const statusText = matchedRange ? matchedRange.text : 'ERROR';
        const statusDangerousLevel = matchedRange ? matchedRange.dangerousLevel : -1;

        const matchColor = TextColorThreshold.find(
            (range) => statusDangerousLevel >= range.min
        )

        return { text: statusText, dangerousLevel: statusDangerousLevel, textColor: matchColor.color };
    }

    function getWeatherDetails(code) {
        const details = WMO_WEATHER_MAP[code];

        if (details) {
            return details;
        } else {
            return WMO_WEATHER_MAP[0]
        }
    }

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

    let welcomeText = true;
    useEffect(() => {
        if (welcomeText) {
            welcomeText = false
            addMessage('%PLANT%', `สวัสดี เราชื่อ ${plantNickname} น้า`);
        }
    }, [])


    const sendToAI = async (msg) => {
        try {
            setAIThinking(true);
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_SERVER_URL}plant-chat`, {
                // Auth configuration for Basic Authentication
                auth: {
                    username: 'BaddestInTheWorld',
                    password: 'FuckTeeOnlyMonday987654321$',
                },
                // Params configuration handles query string construction
                params: {
                    sessionId: sessionId,
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
            setAIThinking(false);
        } catch (err) {
            setAIThinking(false);
        }
    }

    return (
        <>

            <header className='fixed w-full left-0 top-0 h-17 z-50'>
                <div className='max-w-5xl m-auto flex justify-between topbarGradient'>
                    <div onClick={() => navigate(`/plant/${id}`, { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" /></svg>
                    </div>
                    <div className='max-w-5xl w-full absolute top-0 mt-3 p-3 text-xl text-center font-medium z-40'>
                        <div>{plantNickname}</div>
                    </div>


                </div>
            </header>


            <div className='w-full max-w-5xl fixed flex flex-col min-h-[100vh] justify-end bottom-0'>

                <div className='chatBox flex flex-col gap-y-1.5 justify-end'>
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
                                { AIThinking == true ?
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