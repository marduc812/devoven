'use client'

import React, { useState } from 'react'
import { MediaConverterType, MediaMedium, MediaResult, MediaSource, colorName } from '@/types'
import TextAreaAnalytics from './TextAreaAnalytics'
import AdditionalTools from '@/Components/View/AdditionalTools'
import ShareView from './ShareView'
import FeedbackModal from '@/Components/Feedback/FeedbackModal'

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

const labelClass = 'text-xs font-bold uppercase tracking-widest text-gray-500'

// Both panes share this so the input and output blocks carry the same weight,
// the way BasicConverter's two textareas do.
const paneClass = 'flex flex-col items-center justify-center gap-3 w-full min-h-[9.5rem] p-4'

const defaultHint: Record<MediaMedium, string> = {
    image: 'Drop an image or click to browse',
    audio: 'Drop an audio file or click to browse',
    video: 'Drop a video or click to browse',
    pdf:   'Drop a PDF or click to browse',
    file:  'Drop a file or click to browse',
}

/** Renders the loaded input in its own medium. */
const SourcePreview = ({ medium, source }: { medium: MediaMedium; source: MediaSource }) => {
    // A tool that can render its own medium better than a file name does —
    // a PDF page, say — supplies the preview itself.
    if (source.preview) return <>{source.preview}</>
    switch (medium) {
        case 'image':
            return <img src={source.url} alt={source.name} className="max-h-40 object-contain" />
        case 'audio':
            return <audio controls src={source.url} className="w-full max-w-md" />
        case 'video':
            return <video controls src={source.url} className="max-h-40" />
        default:
            return (
                <span className="font-mono text-sm text-gray-700 break-all text-center">{source.name}</span>
            )
    }
}

/** Renders the produced output in its own medium. */
const ResultPreview = ({ medium, result }: { medium: MediaMedium; result: MediaResult }) => {
    if (result.preview) return <>{result.preview}</>
    switch (medium) {
        case 'image':
            // Checkerboard so a transparent result is distinguishable from a white one.
            return <img src={result.url} alt="Result" className="max-h-40 object-contain checkerboard" />
        case 'audio':
            return <audio controls src={result.url} className="w-full max-w-md" />
        case 'video':
            return <video controls src={result.url} className="max-h-40" />
        default:
            return (
                <span className="font-mono text-sm text-gray-700 break-all text-center">{result.fileName}</span>
            )
    }
}

const MediaConverter = (props: MediaConverterType) => {
    const [dragging, setDragging] = useState(false)

    const accept = (list: FileList | null) => {
        if (!list || list.length === 0) return
        props.onFiles(Array.from(list))
    }

    const textOutput = props.outputMedium === 'text'

    return (
        <div>
            {/* Page header — identical to Panel/BasicConverter */}
            <div className="border-b border-gray-900 px-8 md:px-12 py-8">
                <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 flex-shrink-0 ${categoryAccent[props.backColor] ?? 'bg-amber-400'}`} />
                    <span className={labelClass}>{colorName[props.backColor]}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{props.title}</h1>
                    <FeedbackModal variant="report" />
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
                {/* ── Input pane ────────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-4 mb-2">
                    <span className={labelClass}>Input</span>
                    {props.source && (
                        <button
                            type="button"
                            onClick={props.onClear}
                            className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <label
                    onDragOver={e => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files) }}
                    className={`${paneClass} bg-white border border-dashed cursor-pointer transition-colors ${
                        dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-900'
                    }`}
                >
                    <input
                        type="file"
                        accept={props.accept}
                        multiple={props.multiple}
                        className="sr-only"
                        onChange={e => { accept(e.target.files); e.target.value = '' }}
                    />
                    {props.source ? (
                        <>
                            <SourcePreview medium={props.inputMedium} source={props.source} />
                            <span className="text-xs text-gray-500 text-center break-all">
                                {props.source.name}
                                {props.source.meta && <span className="text-gray-400"> — {props.source.meta}</span>}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 text-center">
                                {props.hint ?? defaultHint[props.inputMedium]}
                            </span>
                            <span className="text-xs text-gray-400 text-center">
                                Processed in your browser — nothing is uploaded
                            </span>
                        </>
                    )}
                </label>

                {props.extraElements && <div className="pt-4">{props.extraElements}</div>}

                {props.error && <p className="text-red-600 text-sm pt-3">{props.error}</p>}

                {/* ── Divider ───────────────────────────────────────────────── */}
                <div className="w-full flex flex-row justify-start items-center py-4 gap-3">
                    <div className="w-12 h-px bg-gray-300" />
                    <span className="text-gray-400 text-xs uppercase tracking-widest">output</span>
                    <div className="flex-1 h-px bg-gray-300" />
                </div>

                {/* ── Output pane ───────────────────────────────────────────── */}
                {props.outputVisual && <div className="mb-6">{props.outputVisual}</div>}

                {textOutput ? (
                    <>
                        <TextAreaAnalytics
                            title={props.textResultTitle ?? 'Result'}
                            userInput={props.textResult ?? ''}
                            color={props.backColor}
                            output={true}
                        />
                        <textarea
                            className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
                            rows={5}
                            value={props.textResult ?? ''}
                            readOnly
                        />
                    </>
                ) : (
                    <div className={`${paneClass} bg-gray-50 border border-gray-300`}>
                        {props.progress ? (
                            <div className="w-full max-w-md flex flex-col gap-2">
                                <div className="w-full h-1 bg-gray-200">
                                    <div
                                        className="h-1 bg-gray-900 transition-all"
                                        style={{ width: `${Math.max(0, Math.min(100, props.progress.pct))}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 text-center">{props.progress.label}</span>
                            </div>
                        ) : props.results && props.results.length > 0 ? (
                            // Multi-file output: one mono row per file, plus a
                            // single primary action that saves the whole set.
                            <div className="w-full flex flex-col gap-3">
                                <ul className="w-full max-h-40 overflow-auto border border-gray-300 bg-white divide-y divide-gray-200">
                                    {props.results.map(file => (
                                        <li key={file.fileName} className="flex items-center justify-between gap-3 px-3 py-1.5">
                                            <span className="font-mono text-sm text-gray-700 break-all">{file.fileName}</span>
                                            <a
                                                href={file.url}
                                                download={file.fileName}
                                                className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
                                            >
                                                {file.meta ?? 'Save'}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                                {props.onDownloadAll && (
                                    <button
                                        type="button"
                                        onClick={props.onDownloadAll}
                                        className="self-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                                    >
                                        Download all {props.results.length} files
                                    </button>
                                )}
                            </div>
                        ) : props.result ? (
                            <>
                                <ResultPreview medium={props.outputMedium as MediaMedium} result={props.result} />
                                {props.result.meta && (
                                    <span className="text-xs text-gray-400 text-center">{props.result.meta}</span>
                                )}
                                <a
                                    href={props.result.url}
                                    download={props.result.fileName}
                                    className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                                >
                                    Download {props.result.fileName}
                                </a>
                            </>
                        ) : (
                            <span className="text-xs uppercase tracking-widest text-gray-400">
                                {props.source ? 'Adjust the options above' : 'No file loaded yet'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 px-8 md:px-12">
                <ShareView />
                <AdditionalTools />
            </div>
        </div>
    )
}

export default MediaConverter
