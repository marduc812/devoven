'use client'

import React from 'react'
import { PanelType, colorName } from '@/types'
import AdditionalTools from '@/Components/View/AdditionalTools'
import ShareView from './ShareView'
import FeedbackModal from '@/Components/Feedback/FeedbackModal'
import ShareLinkButton from './ShareLinkButton'

const categoryAccent: Record<string, string> = {
    yellow: 'bg-amber-400',
    teal:   'bg-teal-400',
    cyan:   'bg-indigo-400',
    lime:   'bg-emerald-400',
    fuchsia:'bg-fuchsia-400',
    rose:   'bg-rose-400',
    sky:    'bg-sky-400',
    violet: 'bg-violet-400',
    red: 'bg-red-400',
}

const Panel = (props: PanelType) => {
    return (
        <div>
            {/* Page header */}
            <div className="border-b border-gray-900 px-8 md:px-12 py-8">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 flex-shrink-0 ${categoryAccent[props.backColor] ?? 'bg-amber-400'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{colorName[props.backColor]}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{props.title}</h1>
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <ShareLinkButton />
                        <FeedbackModal variant="report" />
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-2xl">
                    {props.description.split("[1").map((part, index) => {
                        if (index === 0) return <React.Fragment key={index}>{part}</React.Fragment>;
                        const [highlighted, rest] = part.split("2]");
                        return (
                            <React.Fragment key={index}>
                                <span className="font-mono text-xs border border-gray-300 px-1.5 py-0.5 text-gray-700 mx-1 bg-gray-50 example-highlight">{highlighted}</span>
                                {rest}
                            </React.Fragment>
                        );
                    })}
                </p>
            </div>

            {/* Tool content */}
            <div className="px-8 md:px-12 py-8">
                {props.extraElements}
            </div>

            <div className="border-t border-gray-200 px-8 md:px-12">
                <ShareView />
                <AdditionalTools />
            </div>
        </div>
    )
}

export default Panel
