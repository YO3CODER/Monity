"use client";

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers } from 'lucide-react';
import React, { useEffect } from 'react';
import { getOrCreateUser } from '../actions'; // Changé ici !

const Navbar = () => {
    const pathname = usePathname();
    const { user } = useUser();

    const navLinks = [
        {
            href: "/",
            label: "Factures"
        }
    ];

    useEffect(() => {
        const syncUser = async () => {
            if (user?.id) {
                try {
                    // getOrCreateUser n'a pas besoin de paramètres
                    // car il utilise Clerk automatiquement
                    await getOrCreateUser();
                    console.log('Utilisateur synchronisé avec la base de données');
                } catch (error) {
                    console.error('Erreur synchronisation utilisateur:', error);
                }
            }
        };

        syncUser();
    }, [user]);

    const isActiveLink = (href: string) =>
        pathname.replace(/\/$/, "") === href.replace(/\/$/, "");

    const renderLinks = (classNames: string) =>
        navLinks.map(({ href, label }) => (
            <Link 
                href={href} 
                key={href}
                className={`btn-sm ${classNames} ${isActiveLink(href) ? 'btn-accent' : ''}`}
            >
                {label}
            </Link>
        ));

    return (
        <div className='border-b border-base-300 px-5 md:px-[10%] py-4'>
            <div className='flex justify-between items-center'>
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

                <div className='flex space-x-4 items-center'>
                    {renderLinks("btn")}
                    <UserButton />
                </div>
            </div>
        </div>
    );
};

export default Navbar;