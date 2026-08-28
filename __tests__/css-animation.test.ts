import { generateAnimationCSS, generateDefaultAnimation, AnimationProps } from '../Components/Functions/CssAnimationTools/logic';

describe('generateDefaultAnimation', () => {
  it('returns a valid AnimationProps object', () => {
    const anim = generateDefaultAnimation();
    expect(anim.name).toBe('myAnimation');
    expect(anim.duration).toBe(1);
    expect(anim.timingFunction).toBe('ease');
    expect(anim.iterationCount).toBe('infinite');
    expect(anim.direction).toBe('alternate');
    expect(anim.fillMode).toBe('both');
    expect(anim.delay).toBe(0);
    expect(anim.keyframes).toHaveLength(2);
    expect(anim.keyframes[0].offset).toBe(0);
    expect(anim.keyframes[1].offset).toBe(100);
  });
});

describe('generateAnimationCSS', () => {
  it('generates valid @keyframes CSS', () => {
    const anim = generateDefaultAnimation();
    const css = generateAnimationCSS(anim);
    expect(css).toContain('@keyframes myAnimation');
    expect(css).toContain('0%');
    expect(css).toContain('100%');
    expect(css).toContain('.animated');
    expect(css).toContain('animation:');
  });

  it('includes animation shorthand with correct values', () => {
    const anim: AnimationProps = {
      name: 'testAnim',
      duration: 2,
      timingFunction: 'linear',
      iterationCount: '3',
      direction: 'normal',
      fillMode: 'forwards',
      delay: 0.5,
      keyframes: [
        { offset: 0, properties: { opacity: '0' } },
        { offset: 100, properties: { opacity: '1' } },
      ],
    };
    const css = generateAnimationCSS(anim);
    expect(css).toContain('@keyframes testAnim');
    expect(css).toContain('testAnim 2s linear 0.5s 3 normal forwards');
    expect(css).toContain('opacity: 0;');
    expect(css).toContain('opacity: 1;');
  });

  it('filters out empty property values', () => {
    const anim: AnimationProps = {
      name: 'cleanAnim',
      duration: 1,
      timingFunction: 'ease',
      iterationCount: 'infinite',
      direction: 'normal',
      fillMode: 'none',
      delay: 0,
      keyframes: [
        { offset: 0, properties: { opacity: '0', transform: '' } },
      ],
    };
    const css = generateAnimationCSS(anim);
    expect(css).toContain('opacity: 0;');
    expect(css).not.toContain('transform:');
  });

  it('generates CSS with multiple keyframe stops', () => {
    const anim: AnimationProps = {
      name: 'multiStop',
      duration: 1,
      timingFunction: 'ease',
      iterationCount: '1',
      direction: 'normal',
      fillMode: 'none',
      delay: 0,
      keyframes: [
        { offset: 0, properties: { opacity: '0' } },
        { offset: 50, properties: { opacity: '0.5' } },
        { offset: 100, properties: { opacity: '1' } },
      ],
    };
    const css = generateAnimationCSS(anim);
    expect(css).toContain('0%');
    expect(css).toContain('50%');
    expect(css).toContain('100%');
  });
});
