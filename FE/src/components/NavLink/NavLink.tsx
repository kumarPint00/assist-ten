'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
  to: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
}

const NavLink = ({ to, className, activeClassName, children }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === to;
  
  const linkClass = isActive && activeClassName 
    ? `${className} ${activeClassName}` 
    : className;

  return (
    <Link href={to} className={linkClass}>
      {children}
    </Link>
  );
};

export default NavLink;