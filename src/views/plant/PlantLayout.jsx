import React from 'react';
import { Outlet } from 'react-router-dom';
import { PlantProvider } from '@/contexts/plantContext'; 

const PlantLayout = () => (
    <PlantProvider>
        <Outlet /> 
    </PlantProvider>
);

export default PlantLayout;