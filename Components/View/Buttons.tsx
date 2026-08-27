import React from 'react'
import { SwapButtonType } from '@/types'
import { IoSwapVerticalOutline } from "react-icons/io5";
import { event } from "@/Components/Functions/gtag";
import { useRouter } from 'next/navigation'

export const SwapButton = (props: SwapButtonType) => {

    const router = useRouter();

    const navigateTo = () => {
        if (window.location.hostname !== 'localhost') {
            event({
                action: "swapped",
                category: "User Interaction",
                label: window.location.pathname,
                value: 1,
            });
        }
        router.push(props.link, { scroll: false })
    }

    return (
        <div onClick={navigateTo} className='flex items-center'>
            <button className="border border-gray-900 flex items-center gap-1.5 px-3 py-1.5 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-150 text-sm font-semibold">
                <IoSwapVerticalOutline className="text-base" />
                <span className='uppercase tracking-wide text-xs'>Swap</span>
            </button>
        </div>
    )
}
