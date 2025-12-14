import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'

import { AuthProvider } from './contexts/authContext';

import Home from './views/Home.jsx'
import PlantView from './views/plant/PlantView';

import RootLayout from './RootLayout';
import ErrorPage from './views/ErrorPage';
import PlantChat from './views/plant/PlantChat';
import AddPlant from './views/AddPlant';
import PlantLayout from './views/plant/PlantLayout';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "add/",
        element: <AddPlant />,
      },
      {
        path: "plant/:uuid",
        element: <PlantLayout />,
        children: [
          {
            index: true, 
            element: <PlantView />,
          },
          {
            path: "chat", 
            element: <PlantChat />,
          },
        ],
      },
      {
        path: "achievements",
        element: <Home />
      }
    ]
  }
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)
