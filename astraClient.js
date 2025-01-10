const { DataAPIClient } = require("@datastax/astra-db-ts");

class AstraDBClient {
    constructor() {
        this.client = new DataAPIClient(process.env.ASTRA_DB_TOKEN);
        this.db = this.client.db(`https://${process.env.ASTRA_DB_ID}-${process.env.ASTRA_DB_REGION}.apps.astra.datastax.com`);
    }

    async testConnection() {
        try {
            const collections = await this.db.listCollections();
            console.log('Successfully connected to AstraDB. Available collections:', collections);
            return true;
        } catch (error) {
            console.error('Error connecting to AstraDB:', error);
            return false;
        }
    }

    async storeChat(userId, message, response) {
        try {
            const chatCollection = this.db.collection('chat_history');
            await chatCollection.create({
                userId,
                message,
                response,
                timestamp: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error storing chat:', error);
            return false;
        }
    }
}

module.exports = AstraDBClient;