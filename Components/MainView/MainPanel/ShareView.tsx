import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation';

const ShareView = () => {

    const pathname = usePathname();

    return (
        <div className='w-full py-6 flex items-center gap-4'>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Share</span>

            <Link href={`https://www.facebook.com/sharer/sharer.php?u=https://www.devoven.com${pathname}`} target="_blank" className='p-1.5 hover:bg-gray-100 transition-colors duration-150'>
                <svg className='h-5 w-5 fill-gray-400 hover:fill-gray-900 transition-colors duration-150' viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14,6h3a1,1,0,0,0,1-1V3a1,1,0,0,0-1-1H14A5,5,0,0,0,9,7v3H7a1,1,0,0,0-1,1v2a1,1,0,0,0,1,1H9v7a1,1,0,0,0,1,1h2a1,1,0,0,0,1-1V14h2.22a1,1,0,0,0,1-.76l.5-2a1,1,0,0,0-1-1.24H13V7A1,1,0,0,1,14,6Z"></path>
                </svg>
            </Link>
            <Link href={`https://x.com/share?url=https://www.devoven.com${pathname}`} target="_blank" className='p-1.5 hover:bg-gray-100 transition-colors duration-150'>
                <svg xmlns="http://www.w3.org/2000/svg" className='h-5 w-5 fill-gray-400 hover:fill-gray-900 transition-colors duration-150' viewBox="0 0 24 24">
                    <path d="M 2.8671875 3 L 9.7363281 12.818359 L 2.734375 21 L 5.3808594 21 L 10.919922 14.509766 L 15.460938 21 L 21.371094 21 L 14.173828 10.697266 L 20.744141 3 L 18.138672 3 L 12.996094 9.0097656 L 8.7988281 3 L 2.8671875 3 z" />
                </svg>
            </Link>
            <Link href={`https://telegram.me/share/url?url=https://www.devoven.com${pathname}`} target="_blank" className='p-1.5 hover:bg-gray-100 transition-colors duration-150'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className='h-5 w-5 fill-gray-400 hover:fill-gray-900 transition-colors duration-150'>
                    <path d="M19.2,4.4L2.9,10.7c-1.1,0.4-1.1,1.1-0.2,1.3l4.1,1.3l1.6,4.8c0.2,0.5,0.1,0.7,0.6,0.7c0.4,0,0.6-0.2,0.8-0.4c0.1-0.1,1-1,2-2l4.2,3.1c0.8,0.4,1.3,0.2,1.5-0.7l2.8-13.1C20.6,4.6,19.9,4,19.2,4.4z M17.1,7.4l-7.8,7.1L9,17.8L7.4,13l9.2-5.8C17,6.9,17.4,7.1,17.1,7.4z" />
                </svg>
            </Link>
        </div>
    )
}

export default ShareView
