'use client'

import React, { useRef } from 'react'
import { BasicCoversionType, colorName } from '@/types'
import TextAreaAnalytics from './TextAreaAnalytics'
import { SwapButton } from '@/Components/View/Buttons'
import AdditionalTools from '@/Components/View/AdditionalTools'
import ShareView from './ShareView'
import FeedbackModal from '@/Components/Feedback/FeedbackModal'
import ShareLinkButton from './ShareLinkButton'
import { useShareLink } from '@/Components/Functions/ShareLink'
import { FileDropZone } from '@/Components/View/FileInput'

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

const BasicConverter = (props: BasicCoversionType) => {

    // Every text tool gets a working share link for free: the input textarea is
    // the `from` param, and the tool adds its own options on top with useShareLink.
    useShareLink({ from: props.fromValue }, 'base')

    // A file dropped on the input, or chosen from the row above it, is the same
    // as typing its contents. The textarea is uncontrolled, so it needs telling.
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const loadFromFile = (text: string) => {
        if (inputRef.current) inputRef.current.value = text
        props.setFromValue(text)
    }

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
                <TextAreaAnalytics title={props.fromTitle} userInput={props.fromValue} color={props.backColor} output={false} onLoadFile={props.inputReadOnly ? undefined : loadFromFile} />
                {props.inputReadOnly ? (
                    <textarea
                        className="block bg-white text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
                        value={props.fromValue}
                        rows={5}
                        readOnly
                    />
                ) : (
                    <FileDropZone onText={loadFromFile}>
                        <textarea
                            ref={inputRef}
                            className="block bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none resize-y transition-colors duration-150 font-mono text-sm"
                            placeholder="Type your input here, or drop a text file on it"
                            defaultValue={props.fromValue}
                            rows={5}
                            onChange={(e) => props.setFromValue(e.target.value)}
                        />
                    </FileDropZone>
                )}

                <div className="w-full flex flex-row justify-start items-center py-4 gap-3">
                    {props.swapLink
                        ? <SwapButton link={props.swapLink + '?from=' + encodeURIComponent(props.toValue)} color={props.backColor} />
                        : <div className="flex items-center gap-2">
                            <div className="w-12 h-px bg-gray-300" />
                            <span className="text-gray-400 text-xs uppercase tracking-widest">output</span>
                            <div className="flex-1 h-px bg-gray-300" />
                          </div>
                    }
                </div>

                <TextAreaAnalytics title={props.toTitle} userInput={props.toValue} color={props.backColor} output={true} />
                <textarea
                    className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
                    rows={5}
                    value={props.toValue}
                    readOnly
                />
            </div>

            <div className="border-t border-gray-200 px-8 md:px-12">
                <ShareView />
                <AdditionalTools />
            </div>
        </div>
    )
}

export default BasicConverter
