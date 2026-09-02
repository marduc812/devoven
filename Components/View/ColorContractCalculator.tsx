import React, { Dispatch, SetStateAction } from 'react'

type ColorContrastCalculatorTypes = {
    fromFg: string;
    fromBg: string;
    contrastRatio: number;
    setFromFg: Dispatch<SetStateAction<string>>;
    setFromBg: Dispatch<SetStateAction<string>>;
}

const inputClass = "rounded-xl border border-white/10 bg-gray-900/80 px-3 py-2 text-white w-28 focus:border-white/20 focus:outline-none transition-colors";

const ColorContrastCalculatorView = (props: ColorContrastCalculatorTypes) => {

    return (
        <>
            <div className='centered-content'>
                <div className='flex flex-col gap-4'>

                    <div className='flex flex-row justify-center gap-8'>
                        <div className='flex flex-col gap-2'>
                            <h2 className='font-semibold text-lg text-white'>Foreground</h2>
                            <div className='flex flex-row items-center gap-3'>
                                <input maxLength={7} className={inputClass} value={props.fromFg.toUpperCase()} onChange={(e) => props.setFromFg(e.target.value)} />
                                <input type="color" value={props.fromFg} onChange={(e) => props.setFromFg(e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                            </div>
                        </div>

                        <div className='border-l border-white/10' />

                        <div className='flex flex-col gap-2'>
                            <h2 className='font-semibold text-lg text-white'>Background</h2>
                            <div className='flex flex-row items-center gap-3'>
                                <input maxLength={7} className={inputClass} value={props.fromBg.toUpperCase()} onChange={(e) => props.setFromBg(e.target.value)} />
                                <input type="color" value={props.fromBg} onChange={(e) => props.setFromBg(e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <div className='flex flex-col items-center gap-1 py-2'>
                        <h2 className='font-semibold text-lg text-white'>Contrast Ratio</h2>
                        <p className='text-4xl font-bold text-white'>{props.contrastRatio.toFixed(2)}<span className='text-gray-500'>:1</span></p>
                    </div>

                    <div>
                        <h2 className='font-semibold text-lg text-white mb-3'>Tests</h2>
                        <div className='rounded-xl border border-white/10 overflow-hidden'>
                            <table className='w-full'>
                                <thead>
                                    <tr className='border-b border-white/10 bg-white/5'>
                                        <th className="text-left px-4 py-2 text-gray-400 text-sm font-medium">Text type</th>
                                        <th className="text-left px-4 py-2 text-gray-400 text-sm font-medium">Test</th>
                                        <th className="text-left px-4 py-2 text-gray-400 text-sm font-medium">Result</th>
                                        <th className="text-left px-4 py-2 text-gray-400 text-sm font-medium">Preview</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-white/5'>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>Normal</td>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>WCAG AA</td>
                                        <td className='px-4 py-2'><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${props.contrastRatio > 4.5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{props.contrastRatio > 4.5 ? 'PASS' : 'FAIL'}</span></td>
                                        <td className='px-4 py-2'><div className='rounded text-center w-32 text-sm px-1' style={{backgroundColor: props.fromBg, color: props.fromFg}}>contrast &gt; 4.5</div></td>
                                    </tr>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>Normal</td>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>WCAG AAA</td>
                                        <td className='px-4 py-2'><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${props.contrastRatio > 7 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{props.contrastRatio > 7 ? 'PASS' : 'FAIL'}</span></td>
                                        <td className='px-4 py-2'><div className='rounded text-center w-32 text-sm px-1' style={{backgroundColor: props.fromBg, color: props.fromFg}}>contrast &gt; 7</div></td>
                                    </tr>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>Large</td>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>WCAG AA</td>
                                        <td className='px-4 py-2'><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${props.contrastRatio > 4.5 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{props.contrastRatio > 4.5 ? 'PASS' : 'FAIL'}</span></td>
                                        <td className='px-4 py-2'><div className='rounded text-center w-32 text-lg px-1' style={{backgroundColor: props.fromBg, color: props.fromFg}}>contrast &gt; 4.5</div></td>
                                    </tr>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>Large</td>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>WCAG AAA</td>
                                        <td className='px-4 py-2'><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${props.contrastRatio > 3 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{props.contrastRatio > 3 ? 'PASS' : 'FAIL'}</span></td>
                                        <td className='px-4 py-2'><div className='rounded text-center w-32 text-lg px-1' style={{backgroundColor: props.fromBg, color: props.fromFg}}>contrast &gt; 3</div></td>
                                    </tr>
                                    <tr>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>UI Components</td>
                                        <td className='px-4 py-2 text-gray-300 text-sm'>WCAG AA</td>
                                        <td className='px-4 py-2'><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${props.contrastRatio > 3 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{props.contrastRatio > 3 ? 'PASS' : 'FAIL'}</span></td>
                                        <td className='px-4 py-2'><input className='rounded text-center w-32 text-sm px-1' style={{backgroundColor: props.fromBg, color: props.fromFg}} value={'contrast > 3'} readOnly /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}

export default ColorContrastCalculatorView
