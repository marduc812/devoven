import React, { Dispatch, SetStateAction } from 'react'
import { IoClipboardOutline, IoUnlinkSharp } from 'react-icons/io5';
import toast from 'react-hot-toast'

type RelativeLuminanceViewTypes = {
    fromColor: string;
    fromAccuracy: number;
    setFromColor: Dispatch<SetStateAction<string>>;
    setFromAccuracy: Dispatch<SetStateAction<number>>;
    toValue: number;
}

const RelativeLuminanceView = (props: RelativeLuminanceViewTypes) => {

    const copyHandler = () => {
        navigator.clipboard.writeText(props.toValue.toFixed(props.fromAccuracy).toString());
        toast.success('Copied to clipboard');
    }

    const copyURLWithParams = () => {
        navigator.clipboard.writeText(
            document.location.origin.concat(document.location.pathname, '?from=', encodeURIComponent(`${props.fromColor},${props.fromAccuracy}`))
        );
        toast.success('Copied URL to clipboard');
    }

    const luminanceValue = props.toValue.toFixed(props.fromAccuracy);

    return (
        <div className="flex flex-col gap-5 w-full">

            {/* Color swatch */}
            <div
                style={{ backgroundColor: props.fromColor }}
                className="h-14 w-full rounded-xl border border-white/10 transition-colors duration-300"
            />

            {/* Hex input + color picker */}
            <div className="flex items-center gap-3">
                <input
                    maxLength={7}
                    value={props.fromColor.toUpperCase()}
                    onChange={(e) => props.setFromColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 bg-gray-950/80 border border-white/10 rounded-xl text-gray-100 font-mono text-sm px-4 py-2.5 focus:border-white/20 focus:outline-none"
                />
                <input
                    type="color"
                    value={props.fromColor}
                    onChange={(e) => props.setFromColor(e.target.value)}
                    className="h-10 w-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                />
            </div>

            {/* Accuracy slider */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Accuracy</span>
                    <span className="text-xs text-gray-400 font-mono">{props.fromAccuracy} digits</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={props.fromAccuracy}
                    onChange={(e) => props.setFromAccuracy(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                />
            </div>

            {/* Luminance output */}
            <div className="flex items-center justify-between bg-gray-950/80 border border-white/10 rounded-xl px-4 py-4 group">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Relative Luminance</span>
                    <span className="text-3xl font-light text-white font-mono">{luminanceValue}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyURLWithParams}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-50 transition-all duration-200"
                        aria-label="Copy as link"
                    >
                        <IoUnlinkSharp />
                    </button>
                    <button
                        onClick={copyHandler}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-50 transition-all duration-200"
                        aria-label="Copy value"
                    >
                        <IoClipboardOutline />
                    </button>
                </div>
            </div>

        </div>
    )
}

export default RelativeLuminanceView
