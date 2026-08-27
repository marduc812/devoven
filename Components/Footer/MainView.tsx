import React from 'react'
import Link from 'next/link'
import FeedbackModal from '@/Components/Feedback/FeedbackModal'

const FooterMainView = () => {

    const currentYear = new Date().getFullYear();
    const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION;

    return (
        <div className='w-full border-t border-gray-900 dark:border-white/15'>
            <div className='flex flex-row justify-between items-center px-8 md:px-12 py-5'>
                <p className="text-sm font-bold uppercase tracking-wide text-gray-900">
                    <span className='color-name'>marduc812</span>
                </p>
                <div className='flex flex-row items-center gap-4'>
                    {/* AGPL section 13: everyone using the site over the network gets
                        an offer of the source, so this link belongs on every page. */}
                    <Link
                        href='/open-source'
                        prefetch={false}
                        className='text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm'
                    >
                        Source
                    </Link>
                    <FeedbackModal />
                    <p className='text-gray-400 text-sm'>
                        <span>&copy; {currentYear}</span>
                        {buildVersion && (
                            <span className='ml-2 font-mono text-xs' title='Deployed build'>
                                {buildVersion}
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default FooterMainView
