# Twitch Point Farmer Dashboard

A dashboard application for automatically farming Twitch channel points and tracking watch time, with Discord webhook notifications.

## Features

- 📊 **Dashboard Overview**: View stats, active channels, and recent activity
- 📺 **Channel Management**: Add, edit, and remove Twitch channels to farm points from
- 📈 **Statistics**: Track total points collected, watch time, and bonus claims
- 📝 **Activity Logs**: Monitor all farming activities with detailed logs
- 🔔 **Discord Notifications**: Receive real-time notifications via Discord webhook
- ⚙️ **Settings**: Configure Twitch API credentials and farming preferences

## Setup Instructions

### 1. Twitch API Credentials

To use this application, you need to obtain Twitch API credentials:

1. **Create a Twitch Developer Application**:
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
   - Click "Register Your Application"
   - Fill in the details:
     - Name: "Twitch Point Farmer" (or any name)
     - OAuth Redirect URLs: `http://localhost:5000/callback`
     - Category: "Website Integration"
   - Click "Create"

2. **Get Client ID and Generate Secret**:
   - From your newly created application, copy the "Client ID"
   - Click "New Secret" to generate a Client Secret
   - Copy the Client Secret

3. **Generate Access & Refresh Tokens**:
   - Open this URL in your browser (replace YOUR_CLIENT_ID with your actual Client ID):
   ```
   https://id.twitch.tv/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5000/callback&response_type=code&scope=user:read:follows+channel:read:subscriptions+bits:read+chat:read+chat:edit+whispers:read+whispers:edit
   ```
   - Authorize the application
   - You'll be redirected to localhost with a code parameter in the URL
   - Copy the code from the URL: `http://localhost:5000/callback?code=YOUR_CODE`

4. **Exchange Code for Tokens**:
   - Use this cURL command (or Postman/similar tool):
   ```
   curl -X POST \
   https://id.twitch.tv/oauth2/token \
   -F client_id=YOUR_CLIENT_ID \
   -F client_secret=YOUR_CLIENT_SECRET \
   -F code=YOUR_CODE \
   -F grant_type=authorization_code \
   -F redirect_uri=http://localhost:5000/callback
   ```
   - From the response, copy the `access_token` and `refresh_token`

5. **Enter Credentials in Dashboard**:
   - Go to the Settings page in the dashboard
   - Enter your Twitch username, Client ID, Access Token, and Refresh Token
   - Save the settings

### 2. Discord Webhook (Optional)

The application comes preconfigured with a Discord webhook, but you can update it in Settings:

1. In your Discord server, go to a channel's settings
2. Select "Integrations" > "Webhooks" > "New Webhook"
3. Copy the Webhook URL
4. Paste it in the Settings page of the dashboard

## Deployment

### Deploy on Replit

1. Fork this repository to your Replit account
2. Run the application with `npm run dev`
3. Access the dashboard at the provided URL
4. Configure your Twitch API credentials in Settings

### Deploy on Other Platforms

#### Prerequisites
- Node.js 16+
- npm or yarn

#### Installation
```bash
# Install dependencies
npm install

# Start the application
npm run dev
```

The application will be available at `http://localhost:5000`.

## Technical Notes

- The application uses in-memory storage by default
- All activity logs are automatically sent to the configured Discord webhook
- The application automatically refreshes Twitch tokens when they expire
- Maximum concurrent channels can be configured in Settings

## Troubleshooting

- **"Twitch access token not set, farming not started"**: Go to Settings and enter your Twitch API credentials
- **Discord webhook not working**: Check that your webhook URL is valid and accessible
- **Channels not updating**: Ensure your Twitch access token has the required scopes

## License

MIT