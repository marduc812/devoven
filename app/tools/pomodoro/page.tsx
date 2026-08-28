import { Pomodoro } from '@/Components/Functions/PomodoroTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pomodoro Timer — Focus Blocks and Breaks | DevOven',
  description: 'Free online pomodoro timer with customisable work blocks, short breaks and long breaks. Runs entirely in your browser.',
};

const page = () => {
  return (
    <>
      <Pomodoro />
    </>
  );
};

export default page;
