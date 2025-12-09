import { useState, useEffect } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import axios from 'axios';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDroplet, faLightbulb, faSeedling, faTemperatureHalf,

    faSun, faCloud, faSmog, faCloudRain, faCloudShowersHeavy,
    faCloudShowersWater, faSnowflake, faCloudBolt
} from '@fortawesome/free-solid-svg-icons';


function PlantView() {
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

    const [helperTip, setHelperTip] = useState('');
    const enableHelperTip = false

    useEffect(() => {

        if (helperTip == '' && enableHelperTip) {

            (async () => {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_BACKEND_SERVER_URL}plant-tips`, {
                        // Params configuration handles query string construction
                        params: {
                            plantSpecies: plantSpecies,
                            plantAge: plantAge,
                            soilMoisture: soilMoisture,
                            temperature: temperature,
                            weather: weather,
                            humidity: humidity,
                            lightIntensity: lightIntensity
                        }
                    });
                    setHelperTip(response.data.text)
                    //setHelperTip(data); // use split if you have to, I dont think you need that.
                } catch (err) {
                    //console.error(err);
                }
            })()
        }
    }, [])

    return (
        <>

            <header className='fixed w-full left-0 h-17 safeTop'>
                <div className='max-w-5xl m-auto flex justify-between'>
                    <div onClick={() => navigate('/', { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" /></svg>
                    </div>
                    <div className='max-w-5xl w-full absolute top-0 mt-3 p-3 text-xl text-center font-medium z-40'>
                        <div>{plantNickname}</div>
                    </div>
                    <div>
                    <div onClick={() => navigate('/', { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/></svg>
                    </div>
                    <div onClick={() => navigate(`${location.pathname}/chat`, { replace: true })} className='w-11 h-11 rounded-xl m-3 p-1.5 z-50 frosted-element-shadow'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M576 304C576 436.5 461.4 544 320 544C282.9 544 247.7 536.6 215.9 523.3L97.5 574.1C88.1 578.1 77.3 575.8 70.4 568.3C63.5 560.8 62 549.8 66.8 540.8L115.6 448.6C83.2 408.3 64 358.3 64 304C64 171.5 178.6 64 320 64C461.4 64 576 171.5 576 304z"/></svg>
                    </div>
                    </div>

                </div>
            </header>

            

            <div className='justify-center'>
                <div>
                    <img src='https://media.discordapp.net/attachments/1226216016678359131/1447974416116879504/ThaiBasil.png?ex=693992c2&is=69384142&hm=b0b3af550a7586d1753c8579c0bed958dd6ebf231cdb400f8f1629ecff7105b9&=&format=webp&quality=lossless&width=350&height=350' className='w-[50%] max-w-2xs m-auto pt-20'/>
                    <div className='ellipseBackground bg-[#F3F3F3] z-0'></div>
                </div>

                <div className='PlantBackground bg-[#F3F3F3]'>
                    <div className='text-center mt-2'>Species: {plantSpecies}</div>
                    <div className='text-center -mt-1'>Age: {plantAge} days</div>

                    <div className='max-w-2xl m-auto p-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)] grid grid-cols-2 gap-4'>
                        
                        <div className={`${helperTip == '' ? 'hidden' : ''} col-span-2 text-center bg-white rounded-lg p-3 text-base`}>
                            แนะนำ: {helperTip}
                        </div>

                        <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                            <div className={`text-base ${ThresholdDisplay(SoilMoistureThreshold, soilMoisture).textColor}`}><FontAwesomeIcon icon={faSeedling} /> Soil Moisture</div>
                            <div>
                                <div className='text-xl'>{ThresholdDisplay(SoilMoistureThreshold, soilMoisture).text}</div>
                                <div className='text-3xl'>{soilMoisture}%</div>
                            </div>
                        </div>

                        <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                            <div className={`text-base ${ThresholdDisplay(TemperatureThreshold, temperature).textColor}`}><FontAwesomeIcon icon={faTemperatureHalf} />Temperature</div>
                            <div>
                                <div className='text-xl'>{ThresholdDisplay(TemperatureThreshold, temperature).text}</div>
                                <div className='text-3xl'>{temperature}°C</div>
                            </div>
                        </div>

                        <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                            <div className={`text-base`}><FontAwesomeIcon icon={faCloud} /> Weather</div>
                            <div className='text-center text-5xl'><FontAwesomeIcon icon={getWeatherDetails(weather).icon} /></div>
                            <div>
                                <div className='text-xl'>{getWeatherDetails(weather).description}</div>
                            </div>
                        </div>

                        <div className='col-span-1 aspect-square bg-white rounded-lg p-4 pb-2 text-base flex flex-col justify-between'>
                            <div className={`text-base ${ThresholdDisplay(HumidityThreshold, humidity).textColor}`}><FontAwesomeIcon icon={faDroplet} /> Humidity</div>
                            <div>
                                <div className='text-xl'>{ThresholdDisplay(HumidityThreshold, humidity).text}</div>
                                <div className='text-3xl'>{humidity}%</div>
                            </div>
                        </div>

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
        </>
    )
}
export default PlantView;