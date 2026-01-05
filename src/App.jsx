import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Send, MessageSquare, Globe } from 'lucide-react'
import './App.css'

function App() {
  const GREETINGS = {
    'kn-IN': "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಬಹುಭಾಷಾ ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ?",
    'hi-IN': "नमस्ते! मैं आपका बहुभाषी सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
    'ta-IN': "வணக்கம்! நான் உங்கள் பன்மொழி உதவியாளர். நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    'te-IN': "నమస్కారం! నేను మీ బహుభాషా సహాయకుడిని. నేను మీకు ఎలా సహాయం చేయగలను?",
    'ml-IN': "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ബഹുഭാഷാ സഹായിയാണ്. എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?",
    'mr-IN': "नमस्कार! मी तुमचा बहुभाषिक सहाय्यक आहे. मी तुम्हाला कशी मदत करू शकतो?",
    'bn-IN': "হ্যালো! আমি আপনার বহুভাষিক সহকারী। আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
    'gu-IN': "નમસ્તે! હું તમારો બહુભાષી મદદનીશ છું. હું તમને કેવી રીતે મદદ કરી શકું?",
    'pa-IN': "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਬਹੁ-ਭਾਸ਼ਾਈ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
    'en-IN': "Hello! I am your multi-language assistant. How can I help you today?",
    'en-US': "Hello! I am your multi-language assistant. How can I help you today?"
  };

  const [language, setLanguage] = useState('kn-IN')
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: GREETINGS['kn-IN'],
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Update greeting when language changes
  useEffect(() => {
    setMessages(prev => {
      // Only update the initial greeting if it is still the first message
      const newMessages = [...prev];
      const firstMsgIndex = newMessages.findIndex(m => m.id === 1);
      if (firstMsgIndex !== -1 && newMessages.length === 1) {
        newMessages[firstMsgIndex] = {
          ...newMessages[firstMsgIndex],
          text: GREETINGS[language] || GREETINGS['kn-IN']
        };
      }
      return newMessages;
    });
  }, [language]);

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await axios.post('/api', {
        action: 'chat',
        message: input,
        language_code: language
      })

      let botText = "I didn't understand that."

      // Handle the nested body parsing
      // The API returns: { statusCode, headers, body: "{\"success\": true, \"response\": \"...\"}" }
      let responseData = response.data;
      if (typeof responseData === 'string') {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          console.error("Error parsing response string:", e);
        }
      }

      console.log("Response Data:", responseData);

      if (responseData.body) {
        try {
          const body = typeof responseData.body === 'string' ? JSON.parse(responseData.body) : responseData.body;
          if (body.response) {
            botText = body.response;
          } else if (body.message) {
            botText = body.message;
          }
        } catch (e) {
          console.error("Error parsing body:", e);
          if (typeof responseData.body === 'string') botText = responseData.body;
        }
      } else if (responseData.response) {
        botText = responseData.response;
      } else if (responseData.message) {
        botText = responseData.message;
      } else {
        // Fallback
        botText = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="title">
          <MessageSquare size={24} color="#6366f1" />
          <span>Chatbot</span>
          <div className="status-dot"></div>
        </div>
        <div className="language-selector">
          <Globe size={16} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="ta-IN">Tamil (ತಮಿಳು)</option>
            <option value="te-IN">Telugu (ತೆಲುಗು)</option>
            {/* <option value="en-IN">English (English)</option> */}
            <option value="en-US">English (US)</option>

          </select>
        </div>
      </header>

      <div className="chat-window">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-content">
              {msg.text}
            </div>
            <span className="message-time">{msg.timestamp}</span>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-area" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}

export default App
