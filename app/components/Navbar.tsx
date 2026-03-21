"use client";

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers } from 'lucide-react';
import React, { useEffect, useCallback } from 'react';
import { getOrCreateUser } from '../actions';

const Navbar = () => {
    const pathname = usePathname();
    const { user, isLoaded } = useUser();

    const navLinks = [
        {
            href: "/",
            label: "Factures"
        }
    ];

    const syncUser = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            await getOrCreateUser();
            console.log('Utilisateur synchronisé avec la base de données');
        } catch (error) {
            console.error('Erreur synchronisation utilisateur:', error);
        }
    }, [user]);

    useEffect(() => {
        if (isLoaded && user) {
            syncUser();
        }
    }, [isLoaded, user, syncUser]);

    const isActiveLink = (href: string) => {
        const normalizedPathname = pathname.replace(/\/$/, "");
        const normalizedHref = href.replace(/\/$/, "");
        return normalizedPathname === normalizedHref;
    };

    const renderLinks = (classNames: string) => (
        <>
            {navLinks.map(({ href, label }) => (
                <Link
                    href={href}
                    key={href}
                    className={`btn-sm ${classNames} ${isActiveLink(href) ? 'btn-accent' : ''}`}
                >
                    {label}
                </Link>
            ))}
        </>
    );

    return (
        <nav className='border-b border-base-300 px-5 md:px-[10%] py-4'>
            <div className='flex justify-between items-center'>
                {/* Logo */}
                <div className='flex items-center'>
                    <div className='bg-accent-content text-accent rounded-full p-2'>
                        <Layers className='h-6 w-6' />
                    </div>
                    <Link href="/">
                        <span className='ml-3 font-bold text-2xl italic'>
                            Mon<span className='text-accent'>ity</span>
                        </span>
                    </Link>
                </div>

                {/* Bouton Budget */}
                <div>
                    <Link 
                        href="https://budget-psi-five.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <button 
                            type="button"
                            className="btn btn-accent btn-outline btn-sm"
                            aria-label="Gérer vos budgets"
                        >
                            Gérer vos budgets
                        </button>
                    </Link>
                </div>

                {/* Navigation et User */}
                <div className='flex space-x-4 items-center'>
                    {renderLinks("btn")}
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;