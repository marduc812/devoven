'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateMakefile, ProjectType } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'docker', label: 'Docker' },
  { value: 'generic', label: 'Generic' },
];

export function MakefileGen() {
  const [projectType, setProjectType] = useState<ProjectType>('node');
  const [fromValue, setFromValue] = useState('install, build, test, lint, clean');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setFromValue(decodeURIComponent(from));
    const pt = params.get('type') as ProjectType | null;
    if (pt && PROJECT_TYPES.find(t => t.value === pt)) setProjectType(pt);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ type: projectType })

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      const result = generateMakefile(fromValue, projectType);
      const parts: string[] = [];
      if (result.warnings.length > 0) {
        result.warnings.forEach(w => parts.push('# Warning: ' + w));
        parts.push('');
      }
      parts.push(result.content);
      setToValue(parts.join('\n'));
    } catch (e) {
      setToValue('# Error: ' + (e instanceof Error ? e.message : 'Invalid input'));
    }
  }, [fromValue, projectType]);

  return (
    <AdvancedConverter
      title="Makefile Generator"
      description="Generate a [1 Makefile 2] with [1 .PHONY 2] declarations, a [1 help 2] target, and common patterns. Enter target names separated by commas, then select a project type."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Targets (comma-separated)"
      toTitle="Makefile"
      backColor="lime"
      extraElements={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Project:</span>
          {PROJECT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setProjectType(t.value)}
              className={`px-3 py-1.5 text-xs border transition-all ${
                projectType === t.value
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    />
  );
}
