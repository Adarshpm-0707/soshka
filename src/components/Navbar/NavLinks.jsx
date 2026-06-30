import React from 'react';
import { NavLink } from 'react-router-dom';

const NavLinks = ({ onClick, mobile = false }) => {
  const links = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  if (mobile) {
    return (
      <>
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'text-white bg-white/15'
                  : 'text-rose-100 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </>
    );
  }

  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.name}
          to={link.path}
          onClick={onClick}
          className={({ isActive }) =>
            `relative px-4 py-2 text-sm font-semibold transition-all duration-200 group ${
              isActive ? 'text-white font-bold' : 'text-rose-100 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {link.name}
              {/* Animated white underline */}
              <span
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-4/5 opacity-100'
                    : 'w-0 opacity-0 group-hover:w-3/5 group-hover:opacity-60'
                }`}
                style={{ background: '#fff' }}
              />
            </>
          )}
        </NavLink>
      ))}
    </>
  );
};

export default NavLinks;
