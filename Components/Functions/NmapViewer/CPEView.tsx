import React from 'react';

const CPEView = (props: { cpe: string }) => {

  // getCPE() joins the entries; split them back out so each one gets its own line.
  const entries = props.cpe.split(',').map(entry => entry.trim()).filter(Boolean);

  return (
    <div className='bg-gray-50 px-3 py-2.5'>
      <p className='text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2'>CPE</p>
      <ul className='flex flex-col gap-1'>
        {entries.map((entry, index) => (
          <li key={index} className='font-mono text-[11px] text-gray-900 break-all'>{entry}</li>
        ))}
      </ul>
    </div>
  );
};

export default CPEView;
