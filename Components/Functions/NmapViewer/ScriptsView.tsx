import React from 'react';
import { PortScriptType } from './types';

const ScriptsView = (props: { scripts: PortScriptType | PortScriptType[], port: string }) => {

  const scriptsArray = Array.isArray(props.scripts) ? props.scripts : [props.scripts];

  return (
    <div className='bg-gray-50 px-3 py-2.5'>
      <p className='text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2'>Scripts</p>
      <div className='flex flex-col gap-2 max-h-60 overflow-auto'>
        {scriptsArray.map((script, index) => (
          <div key={props.port + index} className='flex flex-col gap-0.5'>
            <span className='font-mono text-[11px] font-bold text-indigo-700 break-all'>{script['@_id']}</span>
            {/* Script output is multi-line by nature — keep the line breaks nmap emitted. */}
            <pre className='font-mono text-[11px] text-gray-600 whitespace-pre-wrap break-words'>
              {script['@_output']}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScriptsView;
