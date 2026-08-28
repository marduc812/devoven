// All functions in this file are pure (no React, no browser APIs).

export type KeyframeStop = {
  offset: number; // 0-100 (percentage)
  properties: Record<string, string>;
};

export type AnimationProps = {
  name: string;
  duration: number; // seconds
  timingFunction: string;
  iterationCount: string; // '1', '2', 'infinite'
  direction: string; // 'normal', 'reverse', 'alternate', 'alternate-reverse'
  fillMode: string; // 'none', 'forwards', 'backwards', 'both'
  delay: number; // seconds
  keyframes: KeyframeStop[];
};

export function generateAnimationCSS(anim: AnimationProps): string {
  const kf = anim.keyframes
    .map((stop) => {
      const props = Object.entries(stop.properties)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `    ${k}: ${v};`)
        .join('\n');
      return `  ${stop.offset}% {\n${props}\n  }`;
    })
    .join('\n');

  return `@keyframes ${anim.name} {\n${kf}\n}\n\n.animated {\n  animation: ${anim.name} ${anim.duration}s ${anim.timingFunction} ${anim.delay}s ${anim.iterationCount} ${anim.direction} ${anim.fillMode};\n}`;
}

export function generateDefaultAnimation(): AnimationProps {
  return {
    name: 'myAnimation',
    duration: 1,
    timingFunction: 'ease',
    iterationCount: 'infinite',
    direction: 'alternate',
    fillMode: 'both',
    delay: 0,
    keyframes: [
      { offset: 0, properties: { opacity: '0', transform: 'translateY(0px)' } },
      { offset: 100, properties: { opacity: '1', transform: 'translateY(-20px)' } },
    ],
  };
}
