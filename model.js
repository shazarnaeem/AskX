// Model configuration
const MODEL_CONFIG = {
    apiKey: 'AIzaSyBducvKo11LPuLZRnwlVF1ED1LsFCExPM0',
    model: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    options: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048
    }
};

// Model loading status
let modelStatus = {
    isReady: true,
    isLoading: false,
    error: null
};

// Initialize the model
async function initializeModel() {
    try {
        // Check if API key is set
        if (!MODEL_CONFIG.apiKey) {
            throw new Error('Please set your Gemini API key in model.js');
        }

        // No need to import the SDK since we'll use fetch directly
        console.log('Gemini model initialized successfully');
        modelStatus.isReady = true;
        updateStatusUI();
        return MODEL_CONFIG;
    } catch (error) {
        console.error('Model initialization error:', error);
        modelStatus.error = error;
        modelStatus.isReady = false;
        updateStatusUI();
        throw error;
    }
}

// Generate content using the Gemini API
async function generateContent(prompt) {
    try {
        const response = await fetch(`${MODEL_CONFIG.endpoint}?key=${MODEL_CONFIG.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: MODEL_CONFIG.options
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error generating content:', error);
        throw error;
    }
}

// Update the UI based on model status
function updateStatusUI() {
    const statusLine = document.querySelector('.status-line');
    const statusDot = document.querySelector('.status-dot');
    const retryButton = document.querySelector('.retry-button');

    if (!statusLine || !statusDot || !retryButton) return;

    if (modelStatus.isReady) {
        statusLine.querySelector('.status-text').textContent = 'Ready to Chat';
        statusDot.classList.remove('loading', 'error');
        statusDot.classList.add('ready');
        retryButton.style.display = 'none';
    } else if (modelStatus.error) {
        let errorMessage = 'Model Load Failed';
        if (modelStatus.error.message.includes('API key')) {
            errorMessage = 'Please set your Gemini API key';
        }
        
        statusLine.querySelector('.status-text').textContent = errorMessage;
        statusDot.classList.remove('loading', 'ready');
        statusDot.classList.add('error');
        retryButton.style.display = 'block';
    }
}

// Add retry button click handler
document.addEventListener('DOMContentLoaded', () => {
    const retryButton = document.querySelector('.retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', () => {
            initializeModel().catch(console.error);
        });
    }
});

// Export functions and variables
export {
    initializeModel,
    modelStatus,
    MODEL_CONFIG,
    generateContent
}; 