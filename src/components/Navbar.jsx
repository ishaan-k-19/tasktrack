import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const location = useLocation();

  return (
    <div className="flex justify-between px-2 md:px-10 py-5 bg-neutral-800 text-white text-lg items-center">
      <div className="flex gap-3 items-center">
        <Link className="text-2xl md:text-4xl font-bold" to="/">TaskTrack</Link>
        <img className="hidden md:block w-10 h-10" src="list.png" alt="TaskTrack Logo" />
      </div>
      <div className="flex gap-5 md:gap-10 text-sm items-center md:text-xl">
        <Link
          to="/"
          className={location.pathname === "/" ? "text-blue-500 underline" : "hover:text-neutral-300"}
        >
          Todos
        </Link>
        <Link
          to="/notes"
          className={location.pathname === "/notes" ? "text-blue-500 underline" : " hover:text-neutral-300"}
        >
          My Notes
        </Link>
        <ProfileDropdown />
      </div>
    </div>
  );
};

export default Navbar;
