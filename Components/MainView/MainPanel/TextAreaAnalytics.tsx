'use client'

import { TextAnalyticsType } from '@/types';
import React, { useState } from 'react'
import { IoQrCodeOutline, IoClipboardOutline, IoSaveOutline } from "react-icons/io5";
import { toast } from 'react-hot-toast'
import Modal from '@/Components/View/Modal';
import { LoadFileButton } from '@/Components/View/FileInput';
import { QRCodeCanvas } from 'qrcode.react';
import {event} from '@/Components/Functions/gtag'
import { formatTextStats } from '@/Components/Functions/Utils'
import { boxLabelClass, boxStatsClass } from './formControls'

const TextAreaAnalytics = (props: TextAnalyticsType) => {

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

    const text = typeof props.userInput === 'string' ? props.userInput : ''
    const inputStats = formatTextStats(text)

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
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-x-4 mb-1.5'>
        {/* The count belongs to the text, not to the toolbar, so it sits with
            the label and leaves the buttons a clear strip of their own. */}
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-0.5 min-w-0'>
            <h2 className={boxLabelClass}>{props.title}</h2>
            <p className={boxStatsClass}>{ inputStats }</p>
        </div>
        <div className='flex flex-row items-center justify-center gap-1 flex-shrink-0'>
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
