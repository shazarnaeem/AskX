const config = {
    // Response patterns with context awareness
    responsePatterns: {
        greeting: {
            patterns: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
            responses: [
                "Hello! How can I help you today?",
                "Hi there! What can I do for you?",
                "Hey! Nice to meet you. How can I assist you?",
                "Greetings! What brings you here today?"
            ]
        },
        question: {
            patterns: ["what", "why", "how", "when", "where", "who", "which", "?"],
            responses: [
                "That's an interesting question. Let me think about that...",
                "I understand your question. Here's what I think...",
                "That's a great question! Let me help you with that.",
                "I'd be happy to help you with that question."
            ],
            followUp: {
                "what": "Could you tell me more about what you're looking for?",
                "why": "That's a good question. Let me explain...",
                "how": "I can help you with that. Here's how...",
                "when": "Let me check the timing for you...",
                "where": "I can help you find that location...",
                "who": "I can provide information about that person...",
                "which": "Let me help you choose between the options..."
            }
        },
        help: {
            patterns: ["help", "assist", "support", "guide", "advice"],
            responses: [
                "I'm here to help! What do you need assistance with?",
                "I'm ready to assist you. What can I help you with?",
                "How can I be of service to you today?",
                "I'm at your service. What do you need help with?"
            ]
        },
        thanks: {
            patterns: ["thank", "thanks", "appreciate"],
            responses: [
                "You're welcome! Is there anything else I can help you with?",
                "Glad I could help! Feel free to ask if you need anything else.",
                "My pleasure! Don't hesitate to ask if you need more help.",
                "Happy to help! Let me know if you have any other questions."
            ]
        },
        goodbye: {
            patterns: ["bye", "goodbye", "see you", "farewell"],
            responses: [
                "Goodbye! Have a great day!",
                "See you later! Take care!",
                "Farewell! Come back anytime!",
                "Bye! It was nice chatting with you!"
            ]
        },
        default: {
            responses: [
                "I understand what you're saying.",
                "That's interesting! Tell me more.",
                "I see. How can I help you with that?",
                "I'm listening. What else would you like to discuss?"
            ]
        }
    },

    // Context tracking
    context: {
        lastQuestionType: null,
        conversationHistory: [],
        maxHistoryLength: 5
    }
}; 