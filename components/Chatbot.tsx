import React, { useState, useRef, useEffect, useCallback } from 'react';
import { type Message } from '../types';
import { createChatSession, sendMessageToGemini } from '../services/geminiService';
import { type Chat } from "@google/genai";
import ChatHistory from './ChatHistory';

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const ExerciseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.09 10.11A5 5 0 1 1 8.91 4H8a5 5 0 0 0-1 9.9" />
        <path d="M12 15v5" />
        <path d="M12 21h0" />
        <path d="M10 18h4" />
    </svg>
);

const GlossaryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: '¡Hola! Soy tu asistente de IA para Blender. ¿En qué te puedo ayudar hoy? Pregúntame sobre modelado, texturizado, renderizado o cualquier otra duda que tengas.',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExerciseMode, setIsExerciseMode] = useState(false);
    const [isGlossaryMode, setIsGlossaryMode] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatSession.current = createChatSession();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    const sendMessage = useCallback(async (messageText: string) => {
        if (messageText.trim() === '' || isLoading) return;

        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        if (chatSession.current) {
            let { text, sources } = await sendMessageToGemini(chatSession.current, messageText);
            
            if (text.includes('[MODO_EJERCICIO_ACTIVADO]')) {
                setIsExerciseMode(true);
                setIsGlossaryMode(false);
                text = text.replace(/\[MODO_EJERCICIO_ACTIVADO\]/g, '').trim();
            }
            if (text.includes('[MODO_EJERCICIO_DESACTIVADO]')) {
                setIsExerciseMode(false);
                text = text.replace(/\[MODO_EJERCICIO_DESACTIVADO\]/g, '').trim();
            }
            if (text.includes('[MODO_GLOSARIO_ACTIVADO]')) {
                setIsGlossaryMode(true);
                setIsExerciseMode(false);
                text = text.replace(/\[MODO_GLOSARIO_ACTIVADO\]/g, '').trim();
            }
            if (text.includes('[MODO_GLOSARIO_DESACTIVADO]')) {
                setIsGlossaryMode(false);
                text = text.replace(/\[MODO_GLOSARIO_DESACTIVADO\]/g, '').trim();
            }

            const modelMessage: Message = { role: 'model', text: text.trim(), sources };
            setMessages(prev => [...prev, modelMessage]);
        }
        
        setIsLoading(false);

    }, [isLoading]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    const handleToggleExerciseMode = () => {
        const message = isExerciseMode ? "Quiero salir del modo ejercicio" : "Quiero empezar un ejercicio práctico";
        sendMessage(message);
    };

    const handleToggleGlossaryMode = () => {
        const message = isGlossaryMode ? "Quiero salir del modo glosario" : "Quiero una definición";
        sendMessage(message);
    };

    return (
        <div className="w-full max-w-3xl h-[80vh] flex flex-col bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
             <div className="p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm flex justify-between items-center rounded-t-2xl flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-200">Asistente de Blender</h2>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleToggleGlossaryMode}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isGlossaryMode 
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 ring-purple-400' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                        title={isGlossaryMode ? 'Salir del Modo Glosario' : 'Activar Modo Glosario'}
                    >
                        <GlossaryIcon className="w-4 h-4" />
                        <span>GLOSARIO</span>
                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isGlossaryMode ? 'bg-white' : 'bg-gray-400'}`}></div>
                    </button>
                    <button 
                        onClick={handleToggleExerciseMode}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isExerciseMode 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-green-400' 
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                        title={isExerciseMode ? 'Salir del Modo Ejercicio' : 'Activar Modo Ejercicio'}
                    >
                        {isExerciseMode ? (
                            <span className="text-sm leading-none -mt-0.5" aria-label="computer icon">💻</span>
                        ) : (
                            <ExerciseIcon className="w-4 h-4" />
                        )}
                        <span>Modo Ejercicio</span>
                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isExerciseMode ? 'bg-white' : 'bg-gray-400'}`}></div>
                    </button>
                </div>
            </div>
            
            <ChatHistory 
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
            />

            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <form onSubmit={handleSubmit} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu pregunta sobre Blender..."
                        className="flex-grow bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || input.trim() === ''}
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <SendIcon className="w-6 h-6"/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;