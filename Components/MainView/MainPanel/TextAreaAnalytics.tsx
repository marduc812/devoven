'use client'

import { TextAnalyticsType } from '@/types';
import React, { useState, useEffect } from 'react'
import { IoQrCodeOutline, IoClipboardOutline, IoSaveOutline } from "react-icons/io5";
import { toast } from 'react-hot-toast'
import Modal from '@/Components/View/Modal';
import { LoadFileButton } from '@/Components/View/FileInput';
import { QRCodeCanvas } from 'qrcode.react';
import {event} from '@/Components/Functions/gtag'

const TextAreaAnalytics = (props: TextAnalyticsType) => {

    const [inputStats, setInputStats] = useState('0 chars; 0 lines')
    const notifySuccess = ( message : string ) => toast.success(message)
    const notifyError = ( message : string ) => toast.error(message)
    const [gotCode, setGotCode] = useState(false);
    const QR_MAX_CHARS = 2000;

    const gotCodeClickedHandler = () => {
      if (props.userInput.length > QR_MAX_CHARS) {
        notifyError(`Text is too large for a QR code (${props.userInput.length} / ${QR_MAX_CHARS} chars max).`);
        return;
      }
      if (window.location.hostname !== 'localhost') {
        event({
            action: "QR_Code_Generated",
            category: "User Interaction",
            label: window.location.pathname,
            value: 1,
        });
    }
      setGotCode(true);
    }

    const gotCodeUnclickedHandler = () => {
      setGotCode(false);
    }

    useEffect(() => {
        if (props.userInput && typeof props.userInput === 'string') {
          const stats = `${props.userInput.length} chars;  ${props.userInput.split(' ').length} words; ${props.userInput.split(/\r\n|\r|\n/).length} lines`
          setInputStats(stats)
        }
    }, [props.userInput])

    const copyHandler = () => {
      if (window.location.hostname !== 'localhost') {
        event({
            action: "Copy_button_pressed",
            category: "User Interaction",
            label: window.location.pathname,
            value: 1,
        });
    }
      navigator.clipboard.writeText(props.userInput);
      notifySuccess('Copied to clipboard');
    }

    const downloadHandler = () => {
      if (window.location.hostname !== 'localhost') {
        event({
            action: "Download_button_pressed",
            category: "User Interaction",
            label: window.location.pathname,
            value: 1,
        });
    }
      const element = document.createElement('a');
      const file = new Blob([props.userInput], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "output.txt";
      document.body.appendChild(element);
      element.click();
    }

  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1.5'>
        <h2 className='font-bold text-xs text-gray-900 tracking-widest uppercase'>{props.title}</h2>
        <div className='flex flex-row items-center justify-center gap-1'>
            <p className='text-gray-400 px-2 text-xs font-mono'>
              { inputStats }
            </p>
            <div className='flex flex-row gap-0.5'>
              {props.onLoadFile && <LoadFileButton onText={(text) => props.onLoadFile?.(text)} title='Fill the input from a text file' className='mr-1.5' />}
              <div onClick={gotCodeClickedHandler} className="p-1.5 text-base hover:cursor-pointer text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 active:scale-95"><IoQrCodeOutline title='Get QR code'/></div>
              <div onClick={copyHandler} className="p-1.5 text-base hover:cursor-pointer text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 active:scale-95"><IoClipboardOutline title='Copy to clipboard'/></div>
              <div onClick={downloadHandler} className="p-1.5 text-base hover:cursor-pointer text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150 active:scale-95"><IoSaveOutline title='Save to file'/></div>
            </div>
        </div>
        {gotCode && props.userInput.length <= QR_MAX_CHARS ? <Modal closeWindow={gotCodeUnclickedHandler}><div className='qrCodeOutput'>
          <QRCodeCanvas
                value={props.userInput}
                size={256}
                includeMargin={true}
            />
        </div></Modal> : ''}
    </div>
  )
}

export default TextAreaAnalytics
