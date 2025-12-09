import { Outlet } from 'react-router-dom';
import NavBar from '@/Components/NavBar.jsx';

/**
 * RootLayout component serves as the main application structure.
 * It contains elements that should be present on every page, 
 * such as the navigation bar, and uses <Outlet /> to render 
 * the specific content for the current route.
 */
function RootLayout() {
  return (
    <>
      <footer>
        <NavBar />
      </footer>
      <main className='max-w-5xl m-auto pt-[env(safe-area-inset-top)]'>
        <Outlet />
      </main>
    </>
  );
}

export default RootLayout;