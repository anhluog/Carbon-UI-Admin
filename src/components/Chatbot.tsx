import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'bot' }[]>([]);
    const [inputValue, setInputValue] = useState('');

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;
    
        const userMessage = inputValue;
    
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setInputValue('');
    
        try {
            const res = await fetch('http://localhost:8081/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "llama",
                    messages: [
                        { role: "user", content: userMessage }
                    ],
                    max_tokens: 100,
                    temperature: 0.7
                }),
            });
    
            const data = await res.json();
    
            const reply =
                data?.choices?.[0]?.message?.content
                ?? "⚠️ Không có phản hồi từ model";
    
            setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);
    
        } catch (error) {
            setMessages(prev => [...prev, {
                text: "❌ Không kết nối được backend Java",
                sender: "bot"
            }]);
        }
    };

    return (
        <>
            <button
                onClick={toggleChat}
                className="fixed bottom-8 right-8 bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition-colors z-50"
                aria-label="Open chat"
            >
                <MessageSquare size={24} />
            </button>

            <div
                className={`
                    fixed bottom-24 right-8 z-50
                    w-[calc(100vw-4rem)] max-w-md
                    origin-bottom-right transition-all duration-300 ease-in-out
                    ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}
            >
                <div className="bg-white rounded-2xl max-h-[70vh] flex flex-col shadow-xl border border-gray-200">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-xl font-bold text-gray-900">NoDy</h3>
                        <button onClick={toggleChat} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                                <div className={`rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 border rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-green-600 text-white rounded-lg p-2 hover:bg-green-700 transition-colors"
                            aria-label="Send message"
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Chatbot;