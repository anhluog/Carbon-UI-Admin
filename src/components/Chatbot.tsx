import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

import userAvatar from '../assets/User.png';
import botAvatar from '../assets/NoDy.png';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Auto scroll ref
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;

        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:8081/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama',
                    messages: [{ role: 'user', content: userMessage }],
                    max_tokens: 100,
                    temperature: 0.7,
                }),
            });

            const data = await res.json();

            const reply =
                data?.choices?.[0]?.message?.content ??
                '⚠️ Không có phản hồi từ model';

            setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { text: '❌ Không kết nối được backend Java', sender: 'bot' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // AUTO SCROLL khi có message mới hoặc bot đang typing
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <>
            {/* Open chat button */}
            <button
                onClick={toggleChat}
                className="fixed bottom-8 right-8 z-50 rounded-full bg-green-600 p-4 text-white shadow-lg transition hover:bg-green-700"
            >
                <MessageSquare size={24} />
            </button>

            {/* Chat window */}
            <div
                className={`fixed bottom-24 right-8 z-50 w-[calc(100vw-4rem)] max-w-md origin-bottom-right transition-all duration-300 ${
                    isOpen
                        ? 'scale-100 opacity-100'
                        : 'pointer-events-none scale-95 opacity-0'
                }`}
            >
                <div className="flex max-h-[70vh] flex-col rounded-2xl border bg-white shadow-xl">

                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-4">
                        <h3 className="text-xl font-bold">NoDy</h3>
                        <button
                            onClick={toggleChat}
                            className="rounded-lg p-2 hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-4 flex items-end gap-2 ${
                                    msg.sender === 'user'
                                        ? 'justify-end'
                                        : 'justify-start'
                                }`}
                            >
                                {msg.sender === 'bot' && (
                                    <img
                                        src={botAvatar}
                                        className="h-8 w-8 rounded-full"
                                        alt="Bot"
                                    />
                                )}

                                <div
                                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                        msg.sender === 'user'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                    }`}
                                >
                                    {msg.text}
                                </div>

                                {msg.sender === 'user' && (
                                    <img
                                        src={userAvatar}
                                        className="h-8 w-8 rounded-full"
                                        alt="User"
                                    />
                                )}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="mb-4 flex items-end gap-2">
                                <img
                                    src={botAvatar}
                                    className="h-8 w-8 rounded-full"
                                    alt="Bot"
                                />
                                <div className="rounded-lg bg-gray-200 px-4 py-2 text-2xl font-bold">
                                    <span className="animate-typing-1">.</span>
                                    <span className="animate-typing-2">.</span>
                                    <span className="animate-typing-3">.</span>
                                </div>
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-center border-t p-4">
                        <input
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e =>
                                e.key === 'Enter' && handleSendMessage()
                            }
                            placeholder="Type a message..."
                            className="mr-2 flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="rounded-lg bg-green-600 p-2 text-white transition hover:bg-green-700"
                        >
                            <Send size={22} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Chatbot;
