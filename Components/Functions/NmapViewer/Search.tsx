import React, { useState } from 'react';
import { IoSearchOutline, IoInformationCircleOutline } from "react-icons/io5";
import { ResultTable, inputClass } from '@/Components/MainView/MainPanel/ResultUI';

interface SearchProps {
  onSearch: (query: string) => void;
}

const FilterTag = ({ children }: { children: React.ReactNode }) => (
  <span className='inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[11px] px-1.5 py-0.5'>
    {children}
  </span>
);

const filters = [
  { filter: 'host', desc: 'IP and hostname', ex: '1.1.1.1, test.hostname', match: 'Partial' },
  { filter: 'status', desc: 'Host status', ex: 'up, down', match: 'Exact' },
  { filter: 'state', desc: 'Port state', ex: 'open, closed, filtered', match: 'Partial' },
  { filter: 'pnumber', desc: 'Port number', ex: '22, 445', match: 'Exact' },
  { filter: 'protocol', desc: 'Port protocol', ex: 'tcp, udp', match: 'Exact' },
  { filter: 'sname', desc: 'Service name', ex: 'http, smtp, rdp', match: 'Partial' },
  { filter: 'port', desc: 'Port info', ex: 'rpcbind, PostgreSQL, v3.2', match: 'Partial' },
  { filter: 'pscript', desc: 'Script output', ex: 'Supported Methods, Apache', match: 'Partial' },
];

const Search = ({ onSearch }: SearchProps) => {

  const [visible, setVisible] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex w-full items-stretch gap-2'>
        <div className='relative flex-1'>
          <IoSearchOutline
            aria-hidden='true'
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-500'
          />
          <input
            onChange={handleInputChange}
            placeholder='Search hosts, ports, services, scripts...'
            aria-label='Search hosts'
            className={`${inputClass} pl-9`}
          />
        </div>
        <button
          type='button'
          onClick={() => setVisible(v => !v)}
          aria-expanded={visible}
          aria-label='Search filters'
          className={`px-3 border transition-colors duration-150 cursor-pointer ${
            visible
              ? 'border-gray-900 text-gray-900 bg-gray-50'
              : 'border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900'
          }`}
        >
          <IoInformationCircleOutline className='text-xl' />
        </button>
      </div>

      {visible && (
        <div className='flex flex-col gap-3 border border-gray-200 bg-gray-50 p-4'>
          <div>
            <h2 className='text-xs font-bold uppercase tracking-widest text-gray-500 mb-1'>Search Filters</h2>
            <p className='text-sm text-gray-600'>
              A plain search matches every part of the scan. Use <FilterTag>filter:value</FilterTag> to narrow it down.
            </p>
          </div>
          <ResultTable
            headers={['Filter', 'Fields', 'Example', 'Match']}
            rows={filters.map(({ filter, desc, ex, match }) => [
              <FilterTag key={filter}>{filter}</FilterTag>,
              <span key='desc' className='font-sans text-gray-900'>{desc}</span>,
              <span key='ex' className='text-gray-600'>{ex}</span>,
              <span key='match' className='font-sans text-gray-600'>{match}</span>,
            ])}
          />
        </div>
      )}
    </div>
  );
};

export default Search;
