'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Logo from '@/asset/logo.png';

const navItems = [
  { href: '/jobs', label: 'Jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/interviews', label: 'Interviews' },
  { href: '/import', label: 'Import' },
];

const Header = () => {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="app-header">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={user ? '/jobs' : '/'} className="brand">
          <img 
            src={Logo.src} 
            alt="JobTrackr" 
            width={180} 
            height={90} 
            className="h-14 w-auto object-contain"
          />
        </Link>

        {!loading && user && (
          <button
            className="sm:hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            Menu
          </button>
        )}

        <nav className="hidden items-center gap-2 sm:flex">
          {loading ? (
            <span className="text-sm text-slate-500">Loading...</span>
          ) : user ? (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? 'nav-link nav-link-active' : 'nav-link'}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/add-job" className="btn-primary ml-2">
                Add Job
              </Link>
              <Link href="/profile" className={isActive('/profile') ? 'nav-link nav-link-active ml-2' : 'nav-link ml-2'}>
                Profile
              </Link>
              <button onClick={handleLogout} className="btn-secondary ml-2">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/" className={pathname === '/' ? 'nav-link nav-link-active' : 'nav-link'} >
                Login
              </Link>
              <Link href="/register" className={pathname === '/register' ? 'nav-link nav-link-active' : 'nav-link'}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>

      {!loading && user && menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            <>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive(item.href) ? 'nav-link nav-link-active' : 'nav-link'}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/add-job" className="btn-primary text-center" onClick={() => setMenuOpen(false)}>
                Add Job
              </Link>
              <Link href="/profile" className={isActive('/profile') ? 'nav-link nav-link-active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </>
          </div>
        </div>
      )}

      {!loading && !user && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex items-center gap-2">
            <Link href="/" className={pathname === '/' ? 'nav-link nav-link-active flex-1 text-center' : 'nav-link flex-1 text-center'}>
              Login
            </Link>
            <Link
              href="/register"
              className={pathname === '/register' ? 'nav-link nav-link-active flex-1 text-center' : 'nav-link flex-1 text-center'}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
