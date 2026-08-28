'use client'

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { VscBug } from 'react-icons/vsc';

type FeedbackModalProps = {
  variant?: 'footer' | 'report';
};

const FeedbackModal = ({ variant = 'footer' }: FeedbackModalProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    if (submitting) return;
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, email, website }),
      });
      if (res.ok) {
        toast.success('Thanks for your feedback! 🎉');
        setMessage('');
        setEmail('');
        setOpen(false);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const portalElement = typeof document !== 'undefined' ? document.getElementById('overlays') : null;

  return (
    <>
      {variant === 'report' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Report a bug"
          className="flex-shrink-0 border border-gray-900 flex items-center gap-1.5 px-3 py-1.5 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-150"
        >
          <VscBug className="text-base" />
          <span className="uppercase tracking-wide text-xs font-semibold">Report bug</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-gray-400 text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Feedback
        </button>
      )}

      {open && portalElement && createPortal(
        <>
          <div className="backdrop" onClick={close}></div>
          <div className="modal">
            <div className="flex flex-row justify-between items-center">
              <h3 className="font-bold text-2xl px-2">Send feedback</h3>
              <span onClick={close} className="close">&times;</span>
            </div>
            <p className="px-2 text-sm text-gray-500">Found a bug or have a feature request? Let us know.</p>
            <form onSubmit={submit} className="flex flex-col gap-3 p-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message..."
                maxLength={2000}
                rows={5}
                required
                className="w-full rounded-md border border-gray-300 dark:border-white/15 bg-transparent p-2 text-sm"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, if you'd like a reply)"
                maxLength={200}
                className="w-full rounded-md border border-gray-300 dark:border-white/15 bg-transparent p-2 text-sm"
              />
              {/* Honeypot: hidden from real users, bots tend to fill it. */}
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <button
                type="submit"
                disabled={submitting}
                className="self-end rounded-md bg-gray-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </>,
        portalElement
      )}
    </>
  );
};

export default FeedbackModal;
