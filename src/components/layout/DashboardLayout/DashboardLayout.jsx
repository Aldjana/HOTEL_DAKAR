import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import { PageMetaProvider } from '../../../context/PageMetaContext';

const DashboardLayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <PageMetaProvider><div className="flex h-screen overflow-hidden bg-[#f4f7f9] text-slate-800">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden xl:ml-[248px]">
        <Header onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8">{children || <Outlet />}</main>
      </div>
    </div></PageMetaProvider>
  );
};

export default DashboardLayout;
