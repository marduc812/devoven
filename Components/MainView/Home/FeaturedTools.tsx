import React from 'react';
import Link from 'next/link';
import { IoArrowForward } from 'react-icons/io5';

const featured = [
    { name: 'String to Bytes32',         link: '/converting/string-to-bytes32',    category: 'Web3',     color: 'bg-indigo-400' },
    { name: 'Bytes32 to String',         link: '/converting/bytes32-to-string',    category: 'Web3',     color: 'bg-indigo-400' },
    { name: 'Number to Bytes32',         link: '/converting/number-to-bytes32',    category: 'Web3',     color: 'bg-indigo-400' },
    { name: 'Bytes32 to Number',         link: '/converting/bytes32-to-number',    category: 'Web3',     color: 'bg-indigo-400' },
    { name: 'Google Maps API Scanner',   link: '/tools/gmaps-api-scanner',         category: 'Security', color: 'bg-emerald-400' },
    { name: 'ETH Public Key to Address', link: '/converting/eth-public-to-address',category: 'Web3',     color: 'bg-indigo-400' },
    { name: 'HMAC-SHA1',                 link: '/hashing/hmac-sha1',               category: 'Hashing',  color: 'bg-teal-400' },
    { name: 'Password Strength',         link: '/tools/password-strength',         category: 'Security', color: 'bg-emerald-400' },
    { name: 'JWT Editor',               link: '/encoding/jwt-editor',              category: 'Encoding', color: 'bg-amber-400' },
];

const FeaturedTools = () => {
    return (
        <div className="border-b border-gray-200">
            <div className="flex items-center gap-3 px-8 md:px-12 py-4 border-b border-gray-100">
                <span className="w-3 h-3 bg-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Popular</span>
                <span className="text-gray-400 text-xs ml-1">{featured.length} tools</span>
            </div>

            <div className="px-8 md:px-12 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
                    {featured.map((tool) => (
                        <Link key={tool.link} href={tool.link} prefetch={false} className="group">
                            <div className="bg-white hover:bg-gray-50 transition-colors duration-100 p-5 h-full flex items-center gap-4">
                                <span className={`w-2 h-8 flex-shrink-0 ${tool.color}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm leading-tight">{tool.name}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{tool.category}</p>
                                </div>
                                <IoArrowForward size={14} className="text-gray-300 group-hover:text-gray-900 flex-shrink-0 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturedTools;
