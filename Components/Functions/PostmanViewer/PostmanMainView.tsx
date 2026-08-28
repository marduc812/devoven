'use client';

import React, { useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { ErrorNote } from '@/Components/MainView/MainPanel/ResultUI';
import CollectionView from './CollectionView';
import DropPane from './DropPane';
import { buildCollectionView, parseEnvironmentFile } from './logic';

type LoadedFile = { name: string; content: string };

const PostmanMainView = () => {
  const [collection, setCollection] = useState<LoadedFile | null>(null);
  const [environment, setEnvironment] = useState<LoadedFile | null>(null);
  const [readError, setReadError] = useState('');

  const environmentSummary = useMemo(
    () => (environment ? parseEnvironmentFile(environment.content) : null),
    [environment]
  );

  // A broken environment is reported once, by environmentSummary; the collection
  // still renders against its own variables rather than showing the same error twice.
  const view = useMemo(
    () =>
      collection
        ? buildCollectionView(collection.content, environmentSummary?.ok ? environment?.content : undefined)
        : null,
    [collection, environment, environmentSummary]
  );

  return (
    <Panel
      title="Postman Collection Viewer"
      backColor="lime"
      description="Preview every API call in a [1 Postman Collection 2] export — grouped by folder and host, with headers, query parameters, auth and bodies. Load an environment to resolve [1 {{variables}} 2]. Both files are parsed in your browser and [1 never uploaded 2]."
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <DropPane
              label="Collection"
              hint="Drop a collection export"
              fileName={collection?.name ?? ''}
              onFile={(name, content) => {
                setReadError('');
                setCollection({ name, content });
              }}
              onClear={() => setCollection(null)}
              onError={setReadError}
            />
            <DropPane
              label="Environment — optional"
              hint="Drop an environment or globals export"
              fileName={environment?.name ?? ''}
              onFile={(name, content) => {
                setReadError('');
                setEnvironment({ name, content });
              }}
              onClear={() => setEnvironment(null)}
              onError={setReadError}
            />
          </div>

          {readError && <ErrorNote>{readError}</ErrorNote>}

          {environmentSummary && !environmentSummary.ok && <ErrorNote>{environmentSummary.error}</ErrorNote>}

          {environmentSummary?.ok && (
            <p className="text-[11px] text-gray-400">
              {environmentSummary.value.scope === 'globals' ? 'Globals' : 'Environment'}{' '}
              <span className="font-mono text-gray-500">{environmentSummary.value.name}</span> —{' '}
              {environmentSummary.value.values.length} value
              {environmentSummary.value.values.length === 1 ? '' : 's'} in play.
            </p>
          )}

          {view && !view.ok && <ErrorNote>{view.error}</ErrorNote>}

          {view?.ok && <CollectionView view={view.value} hasEnvironment={Boolean(environmentSummary?.ok)} />}
        </div>
      }
    />
  );
};

export default PostmanMainView;
