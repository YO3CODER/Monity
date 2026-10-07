"use client";

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ChevronDown, LogIn, Package, Coins, FileText } from 'lucide-react';
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { getOrCreateUser } from '../actions';

const Navbar = () => {
    const pathname = usePathname();
    const { user, isLoaded } = useUser();
    const [isAppsOpen, setIsAppsOpen] = useState(false);
    const appsRef = useRef<HTMLDivElement>(null);

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

    // Ferme le menu Apps quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (appsRef.current && !appsRef.current.contains(e.target as Node)) {
                setIsAppsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Ferme le menu quand on change de page
    useEffect(() => {
        setIsAppsOpen(false);
    }, [pathname]);

    const isInvoicesActive = pathname.replace(/\/$/, "") === "/dashboard";

    const itemClass =
        'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium hover:bg-base-200 transition-colors w-full text-left';

    return (
        <nav className='border-b border-base-300 px-4 sm:px-5 md:px-[10%] py-3 sm:py-4'>
            <div className='flex justify-between items-center gap-4'>
                {/* Logo */}
                <Link href="/" aria-label="Accueil Monity" className='flex-shrink-0'>
                    <Image
                        src="/logo.svg"
                        alt="Monity"
                        width={140}
                        height={40}
                        priority
                        className='h-8 sm:h-10 w-auto'
                    />
                </Link>

                <div className='flex items-center gap-2 sm:gap-3'>
                    {/* Bouton Factures (écrans moyens et grands) */}
                    <Link
                        href="/dashboard"
                        className={`hidden md:inline-flex btn btn-sm btn-primary ${isInvoicesActive ? '' : 'btn-outline'}`}
                    >
                        Factures
                    </Link>

                    {/* Menu Apps */}
                    <div className='relative' ref={appsRef}>
                        <button
                            type="button"
                            onClick={() => setIsAppsOpen((open) => !open)}
                            aria-haspopup="menu"
                            aria-expanded={isAppsOpen}
                            className='btn btn-accent btn-outline rounded-full btn-sm sm:btn-md flex items-center gap-2'
                        >
                            <LayoutGrid className='h-4 w-4 sm:h-5 sm:w-5' />
                            <span className='font-bold'>Apps</span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${isAppsOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {isAppsOpen && (
                            <div
                                role="menu"
                                className='absolute right-0 mt-2 w-64 z-50 bg-base-100 border border-base-300 rounded-2xl shadow-xl p-2'
                            >
                                {/* Factures : visible dans le menu sur mobile uniquement */}
                                <Link
                                    href="/dashboard"
                                    role="menuitem"
                                    className={`${itemClass} md:hidden`}
                                    onClick={() => setIsAppsOpen(false)}
                                >
                                    <FileText className='h-5 w-5' />
                                    Factures
                                </Link>

                                <Link
                                    href="https://budget.yosite.fun/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    role="menuitem"
                                    className={itemClass}
                                    onClick={() => setIsAppsOpen(false)}
                                >
                                    <Coins className='h-5 w-5' />
                                    Gérer vos budgets
                                </Link>

                                <Link
                                    href="https://stock.yosite.fun/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    role="menuitem"
                                    className={itemClass}
                                    onClick={() => setIsAppsOpen(false)}
                                >
                                    <Package className='h-5 w-5' />
                                    Gérer le stock
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Utilisateur (conservé) ou lien de connexion */}
                    {isLoaded && !user ? (
                        <Link
                            href="/sign-in"
                            className='btn btn-accent btn-sm flex items-center gap-2'
                        >
                            <LogIn className='h-4 w-4' />
                            Se connecter
                        </Link>
                    ) : (
                        user && <UserButton afterSignOutUrl="/" />
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;