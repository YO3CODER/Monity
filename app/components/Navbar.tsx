"use client";

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Menu, X } from 'lucide-react';
import React, { useEffect, useCallback, useState } from 'react';
import { getOrCreateUser } from '../actions';

const Navbar = () => {
    const pathname = usePathname();
    const { user, isLoaded } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const renderLinks = (classNames: string, onClick?: () => void) => (
        <>
            {navLinks.map(({ href, label }) => (
                <Link
                    href={href}
                    key={href}
                    onClick={onClick}
                    className={`${classNames} ${isActiveLink(href) ? 'btn-accent' : 'btn-ghost'}`}
                >
                    {label}
                </Link>
            ))}
        </>
    );

    return (
        <nav className='border-b border-base-300 px-4 sm:px-5 md:px-[10%] py-3 sm:py-4'>
            <div className='flex justify-between items-center gap-4'>
                {/* Logo - toujours visible */}
                <div className='flex items-center flex-shrink-0'>
                    <div className='bg-accent-content text-accent rounded-full p-1.5 sm:p-2'>
                        <Layers className='h-5 w-5 sm:h-6 sm:w-6' />
                    </div>
                    <Link href="/">
                        <span className='ml-2 sm:ml-3 font-bold text-xl sm:text-2xl italic'>
                            Mon<span className='text-accent'>ity</span>
                        </span>
                    </Link>
                </div>

                {/* Bouton Budget - masqué sur mobile, visible sur desktop */}
                <div className='hidden md:block'>
                    <Link 
                        href="https://budget-psi-five.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <button 
                            type="button"
                            className="btn btn-accent btn-outline btn-sm whitespace-nowrap"
                            aria-label="Gérer vos budgets"
                        >
                            Gérer vos budgets
                        </button>
                    </Link>
                </div>

                {/* Navigation Desktop */}
                <div className='hidden md:flex space-x-4 items-center'>
                    {renderLinks("btn btn-sm")}
                    <UserButton afterSignOutUrl="/" />
                </div>

                {/* Menu Mobile */}
                <div className='flex md:hidden items-center gap-2'>
                    <UserButton afterSignOutUrl="/" />
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className='btn btn-ghost btn-sm'
                        aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    >
                        {isMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
                    </button>
                </div>
            </div>

            {/* Menu Mobile déroulant */}
            {isMenuOpen && (
                <div className='md:hidden mt-4 pt-4 border-t border-base-200'>
                    <div className='flex flex-col space-y-3'>
                        {renderLinks("btn btn-sm w-full justify-start", () => setIsMenuOpen(false))}
                        
                        {/* Bouton Budget dans le menu mobile */}
                        <Link 
                            href="https://budget-psi-five.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className='w-full'
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <button 
                                type="button"
                                className="btn btn-accent btn-outline btn-sm w-full justify-start"
                                aria-label="Gérer vos budgets"
                            >
                                Gérer vos budgets
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;