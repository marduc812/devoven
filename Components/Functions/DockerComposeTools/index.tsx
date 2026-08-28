'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processDockerCompose } from './logic';

export function DockerComposeConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(function() {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(function() {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processDockerCompose(input));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Docker Compose to Run Command"
      description="Paste a [1 docker-compose.yml 2] service block and get equivalent [1 docker run 2] commands. Supports image, ports, volumes, environment, restart, networks, container_name, and more."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="docker-compose.yml"
      toTitle="docker run commands"
      backColor="lime"
    />
  );
}
