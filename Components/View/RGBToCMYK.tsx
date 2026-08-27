import React, { Dispatch, SetStateAction } from 'react'
import { IoClipboardOutline } from 'react-icons/io5';
import { SwapButton } from './Buttons';
import toast from 'react-hot-toast'

type RGBToCMYKTypes = {
    fromRed: string;
    fromGreen: string;
    fromBlue: string;
    toValue: { c: number, m: number, y: number, k: number };
    setFromRed: Dispatch<SetStateAction<string>>;
    setFromGreen: Dispatch<SetStateAction<string>>;
    setFromBlue: Dispatch<SetStateAction<string>>;
    toRGBColor: string;
}

const RGBToCMYKView = (props: RGBToCMYKTypes) => {

    const copyHandler = (value: string) => {
        navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
    }

    const channels = [
        { label: 'R', name: 'Red',   value: props.fromRed,   set: props.setFromRed,   accent: 'text-red-400' },
        { label: 'G', name: 'Green', value: props.fromGreen, set: props.setFromGreen, accent: 'text-green-400' },
        { label: 'B', name: 'Blue',  value: props.fromBlue,  set: props.setFromBlue,  accent: 'text-blue-400' },
    ];

    const cmykChannels = [
        { label: 'C', name: 'Cyan',    value: props.toValue.c },
        { label: 'M', name: 'Magenta', value: props.toValue.m },
        { label: 'Y', name: 'Yellow',  value: props.toValue.y },
        { label: 'K', name: 'Key',     value: props.toValue.k },
    ];

    const cmykString = `cmyk(${props.toValue.c}%, ${props.toValue.m}%, ${props.toValue.y}%, ${props.toValue.k}%)`;

    return (
        <div className="flex flex-col gap-5 w-full">

            {/* Color swatch */}
            <div
                style={{ backgroundColor: props.toRGBColor }}
                className="h-14 w-full rounded-xl border border-white/10 transition-colors duration-300"
            />

            {/* RGB sliders */}
            <div className="flex flex-col gap-3">
                {channels.map(({ label, name, value, set, accent }) => (
                    <div key={label} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-4 shrink-0 ${accent}`}>{label}</span>
                        <input
                            type="number"
                            min="0"
                            max="255"
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            aria-label={name}
                            className="w-14 shrink-0 bg-gray-950/80 border border-white/10 rounded-lg text-gray-100 text-sm text-center px-2 py-1.5 focus:border-white/20 focus:outline-none"
                        />
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            aria-label={`${name} slider`}
                            className="flex-1 accent-cyan-500"
                        />
                    </div>
                ))}
            </div>

            {/* Divider with swap */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <SwapButton link={`/converting/cmyk-to-rgb?from=${props.toValue.c},${props.toValue.m},${props.toValue.y},${props.toValue.k}`} color="cyan" />
                <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* CMYK output grid */}
            <div className="grid grid-cols-2 gap-3">
                {cmykChannels.map(({ label, name, value }) => (
                    <button
                        key={label}
                        onClick={() => copyHandler(`${value}%`)}
                        className="flex flex-col items-center gap-1 bg-gray-950/80 border border-white/10 rounded-xl py-3 px-4 hover:border-white/20 transition-all duration-200 group"
                    >
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{name}</span>
                        <span className="text-2xl font-light text-white">{value}%</span>
                        <IoClipboardOutline className="text-gray-700 group-hover:text-gray-400 text-xs transition-colors" />
                    </button>
                ))}
            </div>

            {/* Full CMYK string */}
            <button
                onClick={() => copyHandler(cmykString)}
                className="flex items-center justify-between bg-gray-950/80 border border-white/10 rounded-xl px-4 py-2.5 hover:border-white/20 transition-all duration-200 group"
            >
                <span className="text-sm font-mono text-gray-300">{cmykString}</span>
                <IoClipboardOutline className="text-gray-600 group-hover:text-gray-300 transition-colors shrink-0 ml-2" />
            </button>

        </div>
    )
}

export default RGBToCMYKView
