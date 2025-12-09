import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'

import { AuthProvider } from './contexts/authContext';

import Home from './views/Home.jsx'
import PlantView from './views/PlantView';

import RootLayout from './RootLayout';
import ErrorPage from './views/ErrorPage';
import PlantChat from './views/PlantChat';
import AddPlant from './views/AddPlant';

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
        path: "plant/:id",
        element: <PlantView />,
      },
      {
        path: "plant/:id/chat",
        element: <PlantChat />,
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
