import React from 'react';
import { menu } from '@/menu';
import Link from 'next/link';
import { IoTrendingUp } from 'react-icons/io5';

const categoryAccent: Record<string, string> = {
    yellow: 'bg-amber-400',
    teal:   'bg-teal-400',
    cyan:   'bg-indigo-400',
    lime:   'bg-emerald-400',
    rose:   'bg-rose-400',
    sky:    'bg-sky-400',
    violet: 'bg-violet-400',
    red: 'bg-red-400',
    fuchsia:'bg-fuchsia-400',
};

const HomeLinksListView = () => {
    return (
        <div className="pb-20">
            {/* Section header */}
            <div className="px-8 md:px-12 py-8 border-b border-gray-200">
                <h2 id="tools-collection" className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tools Collection</h2>
                <p className="text-gray-400 text-sm mt-1">Nearly all computation runs in your browser</p>
            </div>

            {/* Category groups */}
            {menu.filter((menuGroup) => menuGroup.links.length > 0).map((menuGroup, index) => {
                const accent = categoryAccent[menuGroup.color] ?? categoryAccent.yellow;
                return (
                    <div key={index} id={menuGroup.name} className="border-b border-gray-200">
                        {/* Category label row */}
                        <div className="flex items-center gap-3 px-8 md:px-12 py-4 border-b border-gray-100">
                            <span className={`w-3 h-3 rounded-none ${accent}`} />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-900">{menuGroup.name}</span>
                            <span className="text-gray-400 text-xs ml-1">{menuGroup.links.length} tools</span>
                        </div>

                        {/* Tools grid */}
                        <div className="px-8 md:px-12 py-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-gray-200">
                                {menuGroup.links.map(link => (
                                    <Link key={link.link} href={link.link} prefetch={false}>
                                        <div className="relative p-4 flex flex-col bg-white hover:bg-gray-50 transition-colors duration-100 h-full">
                                            {link.tag && (
                                                <span className="absolute top-2 right-2 bg-amber-400 text-gray-900 text-[9px] uppercase py-0.5 px-1.5 font-bold tracking-wider flex items-center gap-0.5">
                                                    <IoTrendingUp size={8} />{link.tag}
                                                </span>
                                            )}
                                            <p className="font-semibold text-gray-900 text-sm leading-tight">{link.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{link.type}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HomeLinksListView;
