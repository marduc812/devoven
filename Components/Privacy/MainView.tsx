'use client'

import React from 'react'
import Link from 'next/link'
import FeedbackModal from '@/Components/Feedback/FeedbackModal'
import CookiePreferencesLink from '@/Components/Consent/CookiePreferencesLink'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className='flex flex-col gap-4'>
        <h2 className='text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400'>{title}</h2>
        {children}
    </div>
)

const P = ({ children }: { children: React.ReactNode }) => (
    <p className='text-gray-500 dark:text-zinc-400 text-sm leading-relaxed'>{children}</p>
)

/** One row of the "what is collected" tables. */
const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className='flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6 px-4 py-3'>
        <span className='text-sm text-gray-900 dark:text-white font-medium whitespace-nowrap'>{label}</span>
        <span className='text-xs text-gray-500 dark:text-zinc-400 sm:text-right'>{value}</span>
    </div>
)

const Table = ({ children }: { children: React.ReactNode }) => (
    <div className='border border-gray-900 dark:border-white/15 divide-y divide-gray-900 dark:divide-white/15'>
        {children}
    </div>
)

const PrivacyMainView = () => {
    return (
        <div className='max-w-3xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12'>

            <div className='flex flex-col gap-4'>
                <h1 className='text-3xl font-light text-gray-900 dark:text-white tracking-tight'>Privacy</h1>
                <P>
                    Every tool on DevOven runs in your browser. What you paste into a box, the
                    files you drop on a page, the images you convert: none of it is uploaded,
                    and none of it reaches a server we control. Close the tab and it is gone.
                </P>
                <P>
                    That leaves the site itself, which is measured in two tiers. The first
                    counts page views and needs no cookie, so it runs for everyone. The second
                    is Google Analytics, which does set cookies, and runs only if you press
                    Accept on the banner. This page says exactly what each one collects.
                </P>
            </div>

            <Section title='Tier one: page counts, no cookie, always on'>
                <P>
                    We use Vercel Web Analytics to count visits. It stores nothing on your
                    device: no cookie, no local storage, no fingerprint. Because nothing is
                    written to or read from your device, it falls outside the consent rule that
                    the cookie banner exists to satisfy, and we rely instead on our legitimate
                    interest in knowing which tools people use.
                </P>
                <Table>
                    <Row label='Page visited' value='Path only. The query string is stripped before the hit is sent, so a shared tool link never carries its contents to us.' />
                    <Row label='Referrer' value='The site you arrived from, if any' />
                    <Row label='Country, browser, OS, device type' value='Derived from the request, coarse-grained' />
                    <Row label='Visitor count' value='A daily one-way hash computed on Vercel’s servers, discarded every 24 hours. It cannot be reversed and cannot follow you to another site or across days.' />
                    <Row label='Your IP address' value='Used to derive the above, never stored by us' />
                    <Row label='Processor' value='Vercel Inc., under a data processing agreement' />
                    <Row label='Retention' value='Aggregate statistics only, kept no longer than 25 months' />
                </Table>
                <P>
                    It is never combined with anything else, never used to build a profile,
                    never used to follow you across other sites, and never sold or shared.
                </P>
            </Section>

            <Section title='Tier two: Google Analytics, only if you accept'>
                <P>
                    Press Accept and Google Analytics 4 loads, which sets cookies on your
                    device and sends data to Google, including to servers in the United States.
                    The legal basis is your consent, nothing else, and you can take it back at
                    any moment.
                </P>
                <Table>
                    <Row label='Page visited' value='Path only. As above, the query string is stripped before it is sent.' />
                    <Row label='Cookies' value='_ga and related, to recognise a returning browser' />
                    <Row label='Interactions' value='A few button presses, such as copying a share link, recorded as the tool’s path with no input values' />
                    <Row label='Session data' value='Referrer, approximate location, device and browser' />
                    <Row label='Processor' value='Google Ireland Ltd. / Google LLC' />
                </Table>
                <P>
                    Decline and none of it loads: no script is fetched and no cookie is
                    written. Change your mind later, in either direction, and any Google
                    Analytics cookies already on your device are deleted at that moment.
                </P>
                <div className='flex flex-row items-center gap-4'>
                    <CookiePreferencesLink />
                </div>
            </Section>

            <Section title='What stays in your browser'>
                <P>
                    Some things are stored on your device and go nowhere else. You can clear
                    them at any time through your browser’s site data settings.
                </P>
                <Table>
                    <Row label='Tool input and output' value='Held in memory while the page is open, then discarded' />
                    <Row label='Recently used tools' value='Local storage, to fill the recents list on the home page' />
                    <Row label='Your cookie choice' value='Local storage, so you are asked once' />
                    <Row label='Blocks pipelines' value='Local storage, so an unfinished pipeline survives a reload' />
                    <Row label='Theme' value='Local storage, light or dark' />
                </Table>
            </Section>

            <Section title='The three tools that do use a server'>
                <P>
                    Almost everything is client-side, but three tools cannot be. They are the
                    only places where something you provide leaves your browser, and none of
                    them keeps a record.
                </P>
                <Table>
                    <Row label='What is my IP' value='Reads your IP, user agent and language from your own request and hands them straight back to you. Nothing is stored.' />
                    <Row label='Google Maps key scanner' value='Sends the API key you enter to Google, to test whether it is restricted. The key is used for that check and not retained.' />
                    <Row label='Feedback form' value='Your message, your email if you fill it in, plus the page you were on and your browser’s user agent, delivered to the site owner over Telegram.' />
                </Table>
            </Section>

            <Section title='Your rights'>
                <P>
                    If you are in the EU or UK, you have the right to ask what data is held
                    about you, to have it corrected or erased, to object to processing based on
                    legitimate interest, and to complain to your data protection authority.
                </P>
                <P>
                    In practice there is very little to ask about: the page counts are
                    aggregate and hold nothing that points back to you, so we usually cannot
                    identify a single person’s data even if asked. Withdrawing consent for
                    Google Analytics is immediate, and is done with the Cookies link in the
                    footer rather than by writing to anyone.
                </P>
            </Section>

            <Section title='Contact'>
                <P>
                    DevOven is run by marduc812. Use the form below for anything on this page,
                    including a data request. Leave an email address in it if you want a reply.
                </P>
                <FeedbackModal variant='contact' />
            </Section>

            <div className='flex flex-col gap-4'>
                <P>
                    If this ever changes materially, the change lands with a new deployment and
                    this page is updated with it. The site is open source, so the code behind
                    every claim here is public and checkable.
                </P>
                <div className='flex flex-row gap-6'>
                    <Link
                        href='/'
                        prefetch={false}
                        className='text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors'
                    >
                        &larr; Back to the tools
                    </Link>
                    <Link
                        href='/open-source'
                        prefetch={false}
                        className='text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors'
                    >
                        Source code
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PrivacyMainView
