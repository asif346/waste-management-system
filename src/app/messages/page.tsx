'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
  const openRouterModel = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'openai/gpt-4o-mini'

  useEffect(() => {
    console.log('API Key:', openRouterApiKey ? 'Present' : 'Missing')
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    setError('')

    const newMessage: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, newMessage])
    setInput('')

    try {
      if (!openRouterApiKey) throw new Error('OpenRouter API key is missing')

      console.log('Sending message:', newMessage.content)
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            ...messages.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            {
              role: 'user',
              content: newMessage.content
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }

      const data = await response.json()
      const responseText = data.choices[0]?.message?.content || ''
      console.log('Received response:', responseText)

      const assistantMessage: Message = { role: 'assistant', content: responseText }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
            }`}>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {error && <p className="text-red-500 text-center">{error}</p>}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  )
}