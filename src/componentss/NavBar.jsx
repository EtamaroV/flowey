import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import PlantSymbol from '@/assets/Icon/PlantSymbol';
import AchievementSymbol from '@/assets/Icon/AchievementSymbol';
import TipsSymbol from '@/assets/Icon/TipsSymbol';
import NotificationsSymbol from '@/assets/Icon/NotificationsSymbol';
import SettingsSymbol from '@/assets/Icon/SettingsSymbol';
function NavBar() {
    const location = useLocation();
    let navigate = useNavigate(); 

    return (
        <>
            <div className={`w-screen flex justify-center ${location.pathname.includes('/plant/') || location.pathname.includes('/add') ? 'hidden' : 'fixed'} bottom-0 pb-[env(safe-area-inset-bottom)] border-t border-gray-100`}>
                <div className="max-w-xl w-full flex flex-row gap-1 h-[58px] p-[12px] pb-0">
                    <div onClick={() => navigate('/', { replace: true })} className={`navBtn ${location.pathname == '/' ? 'navActive' : ''} flex-1 flex flex-col justify-between`}>
                        <PlantSymbol active className="w-[24px]" />
                        <div className='text-center text-[10px]'>Plants</div>
                    </div>
                    <div onClick={() => navigate('/achievements', { replace: true })} className={`hidden navBtn ${location.pathname == '/achievements' ? 'navActive' : ''} flex-1 flex flex-col justify-between`}>
                        <AchievementSymbol active/>
                        <div className='text-center text-[10px]'>Achievements</div>
                    </div>
                    <div onClick={() => navigate('/tips', { replace: true })} className={`hidden navBtn ${location.pathname == '/tips' ? 'navActive' : ''} flex-1 flex flex-col justify-between`}>
                        <TipsSymbol active />
                        <div className='text-center text-[10px]'>Tips</div>
                    </div>
                    <div onClick={() => navigate('/notifications', { replace: true })} className={`hidden navBtn ${location.pathname == '/notifications' ? 'navActive' : ''} flex-1 flex flex-col justify-between`}>
                        <NotificationsSymbol active />
                        <div className='text-center text-[10px]'>Notifications</div>
                    </div>
                    <div onClick={() => navigate('/settings', { replace: true })} className={`hidden navBtn ${location.pathname == '/settings' ? 'navActive' : ''} flex-1 flex flex-col justify-between`}>
                        <SettingsSymbol active/>
                        <div className='text-center text-[10px]'>Settings</div>
                    </div>
                </div>
            </div>
        </>
    )
}
export default NavBar