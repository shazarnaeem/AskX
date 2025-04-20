# ChatX - Modern Chat Interface

A beautiful and functional chat interface with a dark theme, built with HTML, CSS, and JavaScript.

## Features

- Modern dark theme design
- Responsive layout
- Message history persistence using localStorage
- Auto-resizing input field
- Smooth animations
- Theme toggle functionality
- Beautiful scrollbar styling

## How to Use

1. Simply open the `index.html` file in your web browser
2. Start typing messages in the input field
3. Press Enter or click the send button to send messages
4. Your chat history will be saved automatically
5. Use the theme toggle in the top-right corner to switch between dark and light themes

## Technical Details

- Built with vanilla JavaScript
- Uses localStorage for data persistence
- Responsive design that works on all screen sizes
- No external dependencies except for Font Awesome icons

## Customization

You can customize the chat interface by modifying the CSS variables in the `styles.css` file:

```css
:root {
    --primary-color: #7289da;
    --secondary-color: #2c2f33;
    --background-color: #23272a;
    --text-color: #ffffff;
    --message-bg: #2c2f33;
    --user-message-bg: #7289da;
    --input-bg: #40444b;
}
```

## Future Improvements

- Add actual API integration for bot responses
- Implement user authentication
- Add file sharing capabilities
- Add emoji support
- Implement typing indicators 