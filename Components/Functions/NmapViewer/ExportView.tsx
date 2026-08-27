import React from 'react'
import { generateHTML } from './utils';
import { HostType } from './types';
import { IoDownloadOutline } from 'react-icons/io5';

const ExportView = (props: { title: string, hosts: HostType | HostType[] }) => {

  const handleGenerateHTMLReport = async () => {
    const title = props.title.replace('.xml', '') + ' Report';

    try {
      const htmlReport = await generateHTML(title, props.hosts);
      const blob = new Blob([htmlReport], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `${title}.html`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('Error generating HTML report:', error);
    }
  }

  return (
    <button
      type='button'
      onClick={handleGenerateHTMLReport}
      className='flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer text-[10px] font-bold uppercase tracking-widest'
    >
      <IoDownloadOutline className='text-sm' />
      <span>Export HTML</span>
    </button>
  )
}

export default ExportView
