require('dotenv').config();
const express = require('express');
const cors = require('cors');
const LangflowClient = require('./langflowClient');
const AstraDBClient = require('./astraClient');
const path = require('path');  // Required to set the view engine directory

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Folder where the EJS templates will be located

// Initialize Langflow and AstraDB clients
const langflowClient = new LangflowClient(
    process.env.LANGFLOW_BASE_URL,
    process.env.LANGFLOW_APP_TOKEN
);

const astraClient = new AstraDBClient();

// Test AstraDB connection on startup
astraClient.testConnection()
    .then(connected => {
        if (connected) {
            console.log('AstraDB connection successful');
        } else {
            console.error('Failed to connect to AstraDB');
        }
    })
    .catch(err => console.error('Error connecting to AstraDB:', err));

// Mock-up for tweaks, can be updated dynamically as needed
const tweaks = {
    "File-KEvqB": {},
    "SplitText-3PV1I": {},
    "Google Generative AI Embeddings-yWCwP": {},
    "AstraDB-bqn0N": {},
    "ChatInput-t94Al": {},
    "ParseData-iYGoB": {},
    "Prompt-ztebv": {},
    "ChatOutput-JhWVL": {},
    "GroqModel-2CAku": {}
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Main chat endpoint
app.post('/chat', async (req, res) => {
    try {
        const { message, userId = 'anonymous' } = req.body;

        // Validate incoming message
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Run Langflow client to process the message
        const response = await langflowClient.runFlow(
            process.env.FLOW_ID,
            process.env.LANGFLOW_ID,
            message,
            'chat',
            'chat',
            tweaks
        );

        // Store chat history in AstraDB
        await astraClient.storeChat(userId, message, response);

        // Send back the response
        res.json({ response });
    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Render the EJS view for the chat interface
app.get('/', (req, res) => {
    res.render('index');  // Render 'views/index.ejs'
});

// Set up server to listen on the defined port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
