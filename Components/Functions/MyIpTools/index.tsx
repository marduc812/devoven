'use client'

import { useEffect, useState } from "react"
import Panel from "@/Components/MainView/MainPanel/Panel"
import { IoClipboardOutline } from "react-icons/io5"
import toast from "react-hot-toast"

interface IpData {
    ip: string
    userAgent: string
    acceptLanguage: string
}

export const MyIp = () => {
    const [data, setData] = useState<IpData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/my-ip')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch IP information')
                return res.json()
            })
            .then((json: IpData) => {
                setData(json)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copied to clipboard')
    }

    const content = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-sm text-gray-500">Loading your IP information...</div>
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-sm text-red-500">Error: {error}</div>
                </div>
            )
        }

        if (!data) return <></>

        return (
            <div className="space-y-6">
                {/* IP Address */}
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        IP Address
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-bold text-gray-900">
                            {data.ip}
                        </span>
                        <button
                            onClick={() => copyToClipboard(data.ip)}
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy IP address"
                        >
                            <IoClipboardOutline size={18} />
                        </button>
                    </div>
                </div>

                {/* User Agent */}
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        User Agent
                    </div>
                    <div className="font-mono text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3 break-all">
                        {data.userAgent}
                    </div>
                </div>

                {/* Accept Language */}
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Accept Language
                    </div>
                    <div className="font-mono text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3 break-all">
                        {data.acceptLanguage}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Panel
            title="My IP Address"
            description="View your public IP address as seen by this server, along with your browser's user agent string and accepted language preferences. Unlike most tools here, this one needs the server: your browser asks it what it sees in the request headers. Nothing is logged or stored."
            backColor="lime"
            extraElements={content()}
        />
    )
}
