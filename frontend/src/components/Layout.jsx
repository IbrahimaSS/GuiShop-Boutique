import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 font-inter overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0 transition-all duration-300">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
