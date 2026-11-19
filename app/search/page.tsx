import SearchView from '@/Components/View/Search'
import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Tools | DevOven',
  description: 'Search every DevOven tool by name or keyword: encoders, hashers, converters, network, text, image, audio and PDF utilities that run in your browser.',
}

const page = () => {
  return (
    <SearchView />
  )
}

export default page