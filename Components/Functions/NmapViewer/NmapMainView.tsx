'use client'

import Panel from '@/Components/MainView/MainPanel/Panel'
import React, { useCallback, useRef, useState } from 'react'
import { IoFolderOpenOutline } from "react-icons/io5";
import NmapViewer from './NmapViewer';
import { ErrorNote } from '@/Components/MainView/MainPanel/ResultUI';

const NmapMainView = () => {

    const [fileContent, setFileContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChosen = (file: File) => {
        setError('');
        const fileReader = new FileReader();
        fileReader.onloadend = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
                setFileName(file.name);
                setFileContent(e.target.result.toString());
            } else {
                setError(`Could not read "${file.name}".`);
            }
        };
        fileReader.onerror = () => setError(`Could not read "${file.name}".`);
        fileReader.readAsText(file);
    };

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChosen(e.dataTransfer.files[0]);
        }
    }, []);

    const onClick = () => fileInputRef.current?.click();

    const reset = () => {
        setFileContent('');
        setFileName('');
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Panel
            title="Nmap Viewer"
            backColor="lime"
            description="Preview an [1 Nmap 2] XML scan in a clean, searchable GUI — hosts, open ports, services, versions, NSE script output and CPEs. The file is parsed in your browser and [1 never uploaded 2]."
            extraElements={
                <div className='flex flex-col gap-6'>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className='hidden'
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                handleFileChosen(e.target.files[0]);
                            }
                        }}
                        accept=".xml,text/xml,application/xml"
                    />

                    {fileContent === '' ? (
                        <div
                            onClick={onClick}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={onDrop}
                            className={`border border-dashed px-6 py-10 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center gap-2 ${
                                dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-900'
                            }`}
                        >
                            <IoFolderOpenOutline className='text-3xl text-gray-500' />
                            <p className='text-sm font-bold uppercase tracking-widest text-gray-500'>
                                Drop an Nmap XML file here
                            </p>
                            <p className='text-xs text-gray-400'>
                                or click to choose one — produced by <span className='font-mono'>nmap -oX scan.xml</span>
                            </p>
                        </div>
                    ) : (
                        <div className='flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-gray-50 px-3 py-2'>
                            <span className='flex items-center gap-2 min-w-0'>
                                <IoFolderOpenOutline className='text-base text-gray-500 flex-shrink-0' />
                                <span className='font-mono text-sm text-gray-900 truncate'>{fileName}</span>
                            </span>
                            <button
                                type='button'
                                onClick={reset}
                                className='px-3 py-1.5 border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer text-[10px] font-bold uppercase tracking-widest'
                            >
                                Load another file
                            </button>
                        </div>
                    )}

                    {error && <ErrorNote>{error}</ErrorNote>}

                    {fileContent && <NmapViewer nmapScan={fileContent} title={fileName} />}
                </div>
            }
        />
    )
}

export default NmapMainView
