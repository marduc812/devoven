'use client'

import React from 'react'
import Link from 'next/link'
import { IoLayersOutline } from 'react-icons/io5'
import { menu } from '@/menu'

const toolCount = menu.reduce((total, group) => total + group.links.length, 0)

const MainView = () => {

    const scrollToTarget = () => {
        const element = document.getElementById('tools-collection');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col md:flex-row border-b border-gray-900" style={{ minHeight: '300px' }}>

            {/* Left — solid amber block, stays identical in dark mode via inline styles */}
            <div className="flex-1 p-10 md:p-16 flex flex-col justify-center md:border-r border-gray-900" style={{ backgroundColor: '#fbbf24' }}>
                <p className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-4" style={{ color: '#92400e' }}>
                    Developer Toolkit
                </p>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-5" style={{ color: '#111827' }}>
                    DevOven.
                </h1>
                <p className="text-base leading-relaxed max-w-sm" style={{ color: '#1f2937' }}>
                    Tools for developers. Nearly all of them run entirely in your browser, so nothing you paste leaves the tab.
                </p>
                <div className="mt-8 flex items-center gap-3">
                    <Link href="/blocks" prefetch={false} className="hero-btn-solid inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">
                        <IoLayersOutline />
                        Try Blocks
                    </Link>
                    <button onClick={scrollToTarget} className="hero-btn-outline inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">
                        Explore Tools →
                    </button>
                </div>
            </div>

            {/* Right — stat blocks, fully dark-mode aware */}
            <div className="md:w-80 lg:w-96 bg-white flex flex-col divide-y divide-gray-200">
                <div className="flex-1 p-8 flex flex-col justify-center">
                    <p className="text-4xl font-black text-gray-900 leading-none">{toolCount}</p>
                    <p className="text-gray-500 text-sm mt-1 uppercase tracking-wide font-medium">Developer Tools</p>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-center">
                    <p className="text-4xl font-black text-gray-900 leading-none">Open</p>
                    <p className="text-gray-500 text-sm mt-1 uppercase tracking-wide font-medium">Source on GitHub</p>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-center">
                    <p className="text-4xl font-black text-gray-900 leading-none">Free</p>
                    <p className="text-gray-500 text-sm mt-1 uppercase tracking-wide font-medium">No account needed</p>
                </div>
            </div>
        </div>
    )
}

export default MainView
