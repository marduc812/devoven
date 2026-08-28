import React, { Dispatch, SetStateAction } from 'react'
import { IoClipboardOutline } from 'react-icons/io5';
import toast from 'react-hot-toast'
import { SwapButton } from './Buttons';

type CMYKToRGBTypes = {
    fromCyan: string;
    fromMagenta: string;
    fromYellow: string;
    fromKey: string;
    toValue: { r: number, g: number, b: number };
    setFromCyan: Dispatch<SetStateAction<string>>;
    setFromMagenta: Dispatch<SetStateAction<string>>;
    setFromYellow: Dispatch<SetStateAction<string>>;
    setFromKey: Dispatch<SetStateAction<string>>;
    toRGBColor: string;
}

const CMYKToRGBView = (props: CMYKToRGBTypes) => {

    const copyHandler = (value: string) => {
        navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
    }

    const channels = [
        { label: 'C', name: 'Cyan',    value: props.fromCyan,    set: props.setFromCyan,    accent: 'text-cyan-400' },
        { label: 'M', name: 'Magenta', value: props.fromMagenta, set: props.setFromMagenta, accent: 'text-pink-400' },
        { label: 'Y', name: 'Yellow',  value: props.fromYellow,  set: props.setFromYellow,  accent: 'text-yellow-400' },
        { label: 'K', name: 'Key',     value: props.fromKey,     set: props.setFromKey,     accent: 'text-gray-400' },
    ];

    const rgbChannels = [
        { label: 'R', name: 'Red',   value: props.toValue.r, accent: 'text-red-400' },
        { label: 'G', name: 'Green', value: props.toValue.g, accent: 'text-green-400' },
        { label: 'B', name: 'Blue',  value: props.toValue.b, accent: 'text-blue-400' },
    ];

    const rgbString = `rgb(${props.toValue.r}, ${props.toValue.g}, ${props.toValue.b})`;

    return (
        <div className="flex flex-col gap-5 w-full">

            {/* Color swatch */}
            <div
                style={{ backgroundColor: props.toRGBColor }}
                className="h-14 w-full rounded-xl border border-white/10 transition-colors duration-300"
            />

            {/* CMYK sliders */}
            <div className="flex flex-col gap-3">
                {channels.map(({ label, name, value, set, accent }) => (
                    <div key={label} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-4 shrink-0 ${accent}`}>{label}</span>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            aria-label={name}
                            className="w-14 shrink-0 bg-gray-950/80 border border-white/10 rounded-lg text-gray-100 text-sm text-center px-2 py-1.5 focus:border-white/20 focus:outline-none"
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
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
                <SwapButton link={`/converting/rgb-to-cmyk?from=${props.toValue.r},${props.toValue.g},${props.toValue.b}`} color="cyan" />
                <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* RGB output cards */}
            <div className="grid grid-cols-3 gap-3">
                {rgbChannels.map(({ label, name, value, accent }) => (
                    <button
                        key={label}
                        onClick={() => copyHandler(value.toString())}
                        className="flex flex-col items-center gap-1 bg-gray-950/80 border border-white/10 rounded-xl py-3 px-2 hover:border-white/20 transition-all duration-200 group"
                    >
                        <span className={`text-xs font-bold ${accent}`}>{label}</span>
                        <span className="text-2xl font-light text-white">{value}</span>
                        <IoClipboardOutline className="text-gray-700 group-hover:text-gray-400 text-xs transition-colors" />
                    </button>
                ))}
            </div>

            {/* CSS rgb() string */}
            <button
                onClick={() => copyHandler(rgbString)}
                className="flex items-center justify-between bg-gray-950/80 border border-white/10 rounded-xl px-4 py-2.5 hover:border-white/20 transition-all duration-200 group"
            >
                <span className="text-sm font-mono text-gray-300">{rgbString}</span>
                <IoClipboardOutline className="text-gray-600 group-hover:text-gray-300 transition-colors shrink-0 ml-2" />
            </button>

        </div>
    )
}

export default CMYKToRGBView
