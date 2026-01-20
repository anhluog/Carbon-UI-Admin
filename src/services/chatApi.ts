// frontend/services/chatApi.ts

// ================================
// TYPES
// ================================
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AgentRequest {
    message: string;
    session_id: string;
}

export interface AgentResponse {
    reply: string;
}

// ================================
// CONFIG
// ================================
const API_BASE_URL = 'http://localhost:5001'; // Python AI Agent
const REQUEST_TIMEOUT = 90_000; // 90 giây

// ================================
// SESSION HANDLER (MEMORY KEY)
// ================================
function getSessionId(): string {
    let sessionId = localStorage.getItem('ai_agent_session');

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('ai_agent_session', sessionId);
    }

    return sessionId;
}

// ================================
// CORE FUNCTION
// ================================
export async function sendChatMessage(
    userMessage: string
): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT
    );

    try {
        const payload: AgentRequest = {
            message: userMessage,
            session_id: getSessionId(),
        };

        const response = await fetch(
            `${API_BASE_URL}/agent/chat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            throw new Error(
                `Backend error: ${response.status}`
            );
        }

        const data: AgentResponse = await response.json();

        if (!data?.reply) {
            throw new Error('Empty response from AI agent');
        }

        return data.reply;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return '⏳ AI Agent phản hồi quá chậm, vui lòng thử lại.';
        }

        console.error('Chat API error:', error);
        return '❌ Không thể kết nối AI Agent.';
    } finally {
        clearTimeout(timeoutId);
    }
}
