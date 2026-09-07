'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { TextInputPane } from '@/Components/View/FileInput';
import {
  CopyButton,
  SectionTitle,
  StatTile,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  boxLabelClass,
  boxStatsClass,
  checkboxClass,
  checkboxLabelClass,
  labelClass,
  paneClass,
  selectClass,
} from '@/Components/MainView/MainPanel/formControls';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  SEPARATORS,
  SET_OPERATIONS,
  Separator,
  SetOperation,
  applySetOperation,
  isSeparator,
  isSetOperation,
  operationHint,
  operationLabel,
  operationSymbol,
  separatorLabel,
} from './logic';

export const SetOps = () => {
  const [listA, setListA] = useState('');
  const [listB, setListB] = useState('');
  const [operation, setOperation] = useState<SetOperation>('intersection');
  const [separator, setSeparator] = useState<Separator>('line');
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [sort, setSort] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    // `from` is the site-wide key for a tool's main input, which here is list A.
    const from = params.get('from') ?? params.get('a');
    if (from) setListA(from);
    const b = params.get('b');
    if (b) setListB(b);
    const op = params.get('op');
    if (isSetOperation(op)) setOperation(op);
    const sep = params.get('separator');
    if (isSeparator(sep)) setSeparator(sep);
    if (params.get('case') === 'insensitive') setCaseSensitive(false);
    if (params.get('sort') === 'yes') setSort(true);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({
    from: listA,
    b: listB,
    op: operation,
    separator,
    case: caseSensitive ? 'sensitive' : 'insensitive',
    sort: sort ? 'yes' : 'no',
  });

  const result = useMemo(
    () => applySetOperation(listA, listB, operation, { caseSensitive, sort, separator }),
    [listA, listB, operation, caseSensitive, sort, separator],
  );

  const { counts } = result;
  const placeholder =
    separator === 'line' ? 'apple\nbanana\ncherry' : `apple${separator === 'tab' ? '\t' : ', '}banana`;

  return (
    <Panel
      title="Set Operations"
      description="Compare two lists as sets: [1 union 2], [1 intersection 2], the items only one of them has, or the items exactly one of them has. Each list is deduplicated first, and the result keeps the order the items were first seen in unless you ask for it sorted. Useful for diffing two exports, two allowlists, or two sets of ids."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* The two lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInputPane
              label="List A"
              value={listA}
              onChange={setListA}
              placeholder={placeholder}
              rows={8}
            />
            <TextInputPane
              label="List B"
              value={listB}
              onChange={setListB}
              placeholder={placeholder}
              rows={8}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Operation</label>
              <select
                className={selectClass}
                value={operation}
                onChange={(e) => setOperation(e.target.value as SetOperation)}
              >
                {SET_OPERATIONS.map((op) => (
                  <option key={op} value={op}>
                    {operationLabel[op]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Items are</label>
              <select
                className={selectClass}
                value={separator}
                onChange={(e) => setSeparator(e.target.value as Separator)}
              >
                {SEPARATORS.map((sep) => (
                  <option key={sep} value={sep}>
                    {separatorLabel[sep]}
                  </option>
                ))}
              </select>
            </div>
            <label className={`${checkboxLabelClass} sm:self-end sm:pb-2`}>
              <input
                type="checkbox"
                className={checkboxClass}
                checked={!caseSensitive}
                onChange={(e) => setCaseSensitive(!e.target.checked)}
              />
              Ignore case
            </label>
            <label className={`${checkboxLabelClass} sm:self-end sm:pb-2`}>
              <input
                type="checkbox"
                className={checkboxClass}
                checked={sort}
                onChange={(e) => setSort(e.target.checked)}
              />
              Sort the result
            </label>
          </div>

          {/* How the two lists relate — true whichever operation is picked */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <StatTile
              label="In A"
              value={counts.a}
              hint={counts.duplicatesA ? `${counts.duplicatesA} repeats folded` : 'distinct items'}
            />
            <StatTile
              label="In B"
              value={counts.b}
              hint={counts.duplicatesB ? `${counts.duplicatesB} repeats folded` : 'distinct items'}
            />
            <StatTile label="In both" value={counts.both} hint="A ∩ B" />
            <StatTile label="Only A" value={counts.onlyA} hint="A \ B" />
            <StatTile label="Only B" value={counts.onlyB} hint="B \ A" />
            <StatTile
              label="Overlap"
              value={`${(result.jaccard * 100).toFixed(0)}%`}
              hint="Jaccard index"
            />
          </div>

          {/* Result */}
          <div className="flex flex-col gap-2">
            <SectionTitle note={operationHint[operation]}>
              {operationLabel[operation]} · {operationSymbol[operation]}
            </SectionTitle>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className={boxLabelClass}>Result</span>
                <span className={boxStatsClass}>
                  {counts.result} item{counts.result === 1 ? '' : 's'}
                </span>
              </div>
              <CopyButton text={result.joined} label="the result" />
            </div>
            <textarea
              className={`${paneClass} min-h-[10rem]`}
              value={result.joined}
              readOnly
              spellCheck={false}
            />
          </div>
        </div>
      }
    />
  );
};
