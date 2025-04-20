import { initializeModel, modelStatus, MODEL_CONFIG, generateContent } from './model.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables
    let chats = JSON.parse(localStorage.getItem('chats')) || [];
    let currentChatId = localStorage.getItem('currentChatId');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const themeToggle = document.querySelector('.theme-toggle');
    const newChatBtn = document.getElementById('new-chat');
    const chatHistory = document.getElementById('chat-history');
    const typingIndicator = document.getElementById('typing-indicator');
    const modelStatusElement = document.getElementById('model-status');
    const statusDot = modelStatusElement.querySelector('.status-dot');
    const statusText = modelStatusElement.querySelector('.status-text');

    let model = null;
    let isModelReady = false;
    let startTime = null;
    let progressInterval = null;
    let retryCount = 0;
    const maxRetries = 3;

    // Theme handling
    const themeSwitch = document.getElementById('theme-switch');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeSwitch.checked = savedTheme === 'dark';

    // Theme switch handler
    themeSwitch.addEventListener('change', () => {
        const newTheme = themeSwitch.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Load current chat messages immediately
    if (currentChatId) {
        const currentChat = chats.find(chat => chat.id === currentChatId);
        if (currentChat) {
            displayChatMessages(currentChat.messages);
        }
    }

    // Display chat history immediately
    displayChatHistory();

    // Initialize model in the background with proper error handling
    async function initModel() {
        try {
            // Update UI to show loading state
            statusText.textContent = 'Loading Model...';
            statusDot.classList.add('loading');
            
            // Start progress updates
            startTime = Date.now();
            progressInterval = setInterval(updateLoadingProgress, 1000);
            
            // Initialize model with timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Model initialization timeout')), 10000)
            );
            
            const modelPromise = initializeModel();
            model = await Promise.race([modelPromise, timeoutPromise]);
            
            // Clear loading state
            clearInterval(progressInterval);
            statusText.textContent = 'Ready to Chat';
            statusDot.classList.remove('loading');
            statusDot.classList.add('ready');
            isModelReady = true;
        } catch (error) {
            console.error('Error initializing model:', error);
            clearInterval(progressInterval);
            statusText.textContent = 'Model Load Failed';
            statusDot.classList.remove('loading');
            statusDot.classList.add('error');
            
            // Show retry button
            const retryButton = document.querySelector('.retry-button');
            if (retryButton) {
                retryButton.style.display = 'block';
            }
        }
    }

    // Start model initialization in the background
    setTimeout(() => {
        initModel().catch(console.error);
    }, 500); // Reduced delay

    // Update loading progress
    function updateLoadingProgress() {
        if (!startTime) return;
        
        const elapsedTime = (Date.now() - startTime) / 1000;
        const estimatedTotalTime = 10; // Reduced time estimate
        
        if (elapsedTime >= estimatedTotalTime) {
            statusText.textContent = 'Loading Model... (Almost there)';
        } else {
            const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
            const seconds = Math.floor(remainingTime);
            statusText.textContent = `Loading Model... (${seconds}s remaining)`;
        }
    }

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    // Send message on Enter (without Shift)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Send message on button click
    sendButton.addEventListener('click', handleSendMessage);

    // New chat button click
    newChatBtn.addEventListener('click', () => {
        createNewChat();
    });

    // Handle sending messages
    async function handleSendMessage() {
        const message = userInput.value.trim();
        if (!message || !modelStatus.isReady) return;

        // Create new chat if none exists
        if (!currentChatId) {
            createNewChat();
        }

        // Add user message to chat
        addMessage(message, true);
        userInput.value = '';

        // Show typing indicator
        document.getElementById('typing-indicator').style.display = 'flex';

        try {
            // Generate response
            const response = await generateResponse(message);
            
            // Add AI response to chat
            addMessage(response, false);
        } catch (error) {
            console.error('Error generating response:', error);
            addMessage('Sorry, I encountered an error while generating a response.', false);
        } finally {
            // Hide typing indicator
            document.getElementById('typing-indicator').style.display = 'none';
        }
    }

    // Generate response using the model
    async function generateResponse(message) {
        try {
            // Generate content using the Gemini API
            const response = await generateContent(message);
            return response;
        } catch (error) {
            console.error('Error in generateResponse:', error);
            if (error.message.includes('API key')) {
                return "Error: Please check your API key configuration.";
            } else if (error.message.includes('model')) {
                return "Error: Model not found. Please check the model configuration.";
            } else {
                return "Sorry, I encountered an error while generating a response. Please try again.";
            }
        }
    }

    // Initialize chat history
    function initializeChatHistory() {
        // Load chats from localStorage
        const savedChats = localStorage.getItem('chats');
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
        
        // Load current chat ID
        currentChatId = localStorage.getItem('currentChatId');
        
        // Display chat history
        displayChatHistory();
        
        // Load current chat messages if exists
        if (currentChatId) {
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                displayChatMessages(currentChat.messages);
            }
        }
    }

    // Save chat history to localStorage
    function saveChats() {
        localStorage.setItem('chats', JSON.stringify(chats));
        if (currentChatId) {
            localStorage.setItem('currentChatId', currentChatId);
        }
    }

    // Create a new chat
    function createNewChat() {
        currentChatId = Date.now().toString();
        const newChat = {
            id: currentChatId,
            title: 'New Chat',
            messages: []
        };
        chats.push(newChat);
        saveChats();
        displayChatHistory();
        clearChatMessages();
    }

    // Display chat history in sidebar
    function displayChatHistory() {
        const historyContainer = document.getElementById('chat-history');
        if (!historyContainer) return;

        // Clear chat history efficiently
        historyContainer.innerHTML = '';
        
        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-item');
            if (chat.id === currentChatId) {
                chatItem.classList.add('active');
            }

            // Create chat title container
            const titleContainer = document.createElement('div');
            titleContainer.classList.add('chat-title-container');
            
            // Add chat title - use first message if available
            const title = document.createElement('div');
            title.classList.add('chat-title');
            if (chat.messages && chat.messages.length > 0) {
                const firstMessage = chat.messages[0];
                title.textContent = firstMessage.text.length > 30 
                    ? firstMessage.text.substring(0, 30) + '...' 
                    : firstMessage.text;
            } else {
                title.textContent = 'New Chat';
            }
            
            // Add preview of first message if exists
            const preview = document.createElement('div');
            preview.classList.add('chat-preview');
            if (chat.messages && chat.messages.length > 1) {
                const secondMessage = chat.messages[1];
                preview.textContent = secondMessage.text.length > 30 
                    ? secondMessage.text.substring(0, 30) + '...' 
                    : secondMessage.text;
            } else {
                preview.textContent = 'No messages yet';
            }

            titleContainer.appendChild(title);
            titleContainer.appendChild(preview);
            chatItem.appendChild(titleContainer);

            // Add menu button
            const menuButton = document.createElement('button');
            menuButton.classList.add('chat-menu-button');
            menuButton.innerHTML = '⋮';
            chatItem.appendChild(menuButton);

            // Add menu options
            const menu = document.createElement('div');
            menu.classList.add('chat-menu');
            menu.innerHTML = `
                <div class="chat-menu-option like" data-action="like">
                    <i class="fas fa-heart"></i>
                    <span>Like</span>
                </div>
                <div class="chat-menu-option share" data-action="share">
                    <i class="fas fa-share"></i>
                    <span>Share</span>
                </div>
                <div class="chat-menu-option delete" data-action="delete">
                    <i class="fas fa-trash"></i>
                    <span>Delete</span>
                </div>
            `;
            chatItem.appendChild(menu);

            // Handle menu button click
            menuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('show');
            });

            // Handle menu option clicks
            menu.addEventListener('click', (e) => {
                const option = e.target.closest('.chat-menu-option');
                if (!option) return;

                const action = option.dataset.action;
                switch (action) {
                    case 'like':
                        handleLikeChat(chat.id);
                        break;
                    case 'share':
                        handleShareChat(chat.id);
                        break;
                    case 'delete':
                        handleDeleteChat(chat.id);
                        break;
                }
                menu.classList.remove('show');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!chatItem.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });

            // Use event delegation for better performance
            chatItem.addEventListener('click', () => {
                currentChatId = chat.id;
                displayChatMessages(chat.messages);
                displayChatHistory();
                saveChats();
            });
            
            fragment.appendChild(chatItem);
        });
        
        // Append all chat items at once
        historyContainer.appendChild(fragment);
    }

    function handleLikeChat(chatId) {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.liked = !chat.liked;
            saveChats();
            displayChatHistory();
        }
    }

    function handleShareChat(chatId) {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            // Create a shareable link
            const chatData = {
                id: chat.id,
                messages: chat.messages
            };
            const encodedData = btoa(JSON.stringify(chatData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?chat=${encodedData}`;
            
            // Copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Chat link copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy chat link. Please try again.');
            });
        }
    }

    function handleDeleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            chats = chats.filter(c => c.id !== chatId);
            if (currentChatId === chatId) {
                currentChatId = null;
                clearChatMessages();
            }
            saveChats();
            displayChatHistory();
        }
    }

    // Display messages for a specific chat
    function displayChatMessages(messages) {
        // Clear chat messages efficiently
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
            // Create a document fragment for better performance
            const fragment = document.createDocumentFragment();
            
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message');
                messageDiv.classList.add(message.isUser ? 'user-message' : 'bot-message');
                
                // Format the text if it's a bot message
                const formattedText = message.isUser ? message.text : formatMessage(message.text);
                messageDiv.innerHTML = formattedText;

                const label = document.createElement('div');
                label.classList.add('message-label');
                label.textContent = message.isUser ? 'You' : 'ChatX';

                const container = document.createElement('div');
                container.classList.add('message-container');
                container.classList.add(message.isUser ? 'user-message-container' : 'bot-message-container');
                
                container.appendChild(label);
                container.appendChild(messageDiv);
                fragment.appendChild(container);
            });
            
            // Append all messages at once
            chatMessages.appendChild(fragment);
            
            // Scroll to bottom after rendering
            requestAnimationFrame(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        });
    }

    // Clear current chat messages
    function clearChatMessages() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
    }

    function formatMessage(text) {
        // Convert markdown-like syntax to HTML
        let formattedText = text
            // Convert ```code``` to <pre><code> with copy button
            .replace(/```([\s\S]*?)```/g, (match, code) => {
                const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<pre><code>${escapedCode}</code><button class="copy-code-button">Copy</button></pre>`;
            })
            // Convert `code` to <code>
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Convert **text** to <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert *text* to <em>text</em>
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert # Heading to <h1>Heading</h1>
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Convert ## Heading to <h2>Heading</h2>
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            // Convert ### Heading to <h3>Heading</h3>
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            // Convert - or * list items to <ul><li>
            .replace(/^[-*] (.*$)/gm, '<li>$1</li>')
            // Convert 1. list items to <ol><li>
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            // Convert > quote to <blockquote>
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            // Convert Explanation: to explanation section with icon
            .replace(/Explanation:(.*?)(?=\n\n|$)/gs, '<div class="explanation"><h4>Explanation</h4>$1</div>');

        // Wrap list items in appropriate list tags
        if (formattedText.includes('<li>')) {
            formattedText = formattedText.replace(/<li>.*?<\/li>/gs, '<ul>$&</ul>');
        }

        return formattedText;
    }

    function addMessage(text, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        
        // Format the text if it's a bot message
        const formattedText = isUser ? text : formatMessage(text);
        messageDiv.innerHTML = formattedText;

        const label = document.createElement('div');
        label.classList.add('message-label');
        label.textContent = isUser ? 'You' : 'ChatX';

        const container = document.createElement('div');
        container.classList.add('message-container');
        container.classList.add(isUser ? 'user-message-container' : 'bot-message-container');
        
        container.appendChild(label);
        container.appendChild(messageDiv);

        const chatMessages = document.getElementById('chat-messages');
        chatMessages.appendChild(container);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save message to current chat
        if (currentChatId) {
            const currentChat = chats.find(chat => chat.id === currentChatId);
            if (currentChat) {
                currentChat.messages.push({
                    text,
                    isUser,
                    timestamp: new Date().toISOString()
                });
                saveChats();
            }
        }
    }

    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('light-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Add copy code functionality
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-code-button')) {
            const button = e.target;
            const codeBlock = button.previousElementSibling;
            const code = codeBlock.textContent;
            
            navigator.clipboard.writeText(code).then(() => {
                button.textContent = 'Copied!';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy code:', err);
            });
        }
    });

    function typeMessage(element, text, speed = 20) {
        let index = 0;
        element.textContent = '';
        
        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
                // Scroll to bottom smoothly
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
        
        type();
    }

    async function sendMessage() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Clear input
        userInput.value = '';
        
        // Add user message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'message user-message';
        userMessageDiv.innerHTML = `
            <div class="message-label">You</div>
            <div class="message-content">${message}</div>
        `;
        chatMessages.appendChild(userMessageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
        
        // Add bot message container
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'message bot-message';
        botMessageDiv.innerHTML = `
            <div class="message-label">ChatX</div>
            <div class="message-content"></div>
        `;
        chatMessages.appendChild(botMessageDiv);
        
        // Get the message content element
        const messageContent = botMessageDiv.querySelector('.message-content');
        
        try {
            // Show typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = `
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            botMessageDiv.appendChild(typingIndicator);
            
            // Get response from model
            const response = await model.generate(message);
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Format the response
            const formattedResponse = formatMessage(response);
            
            // Create a temporary div to hold the formatted HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formattedResponse;
            
            // Get all text nodes from the formatted response
            const textNodes = [];
            const walker = document.createTreeWalker(
                tempDiv,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            // Type out each text node
            for (const textNode of textNodes) {
                const text = textNode.textContent;
                let currentText = '';
                
                for (let i = 0; i < text.length; i++) {
                    currentText += text[i];
                    textNode.textContent = currentText;
                    
                    // Scroll to bottom after each character
                    chatMessages.scrollTo({
                        top: chatMessages.scrollHeight,
                        behavior: 'smooth'
                    });
                    
                    // Add a small delay between characters
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            
            // Save to chat history
            saveToChatHistory(message, response);
            
        } catch (error) {
            messageContent.textContent = 'Sorry, I encountered an error. Please try again.';
            console.error('Error:', error);
        }
    }
}); 