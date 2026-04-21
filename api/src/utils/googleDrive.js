const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');

const uploadFileToDrive = async (fileObject) => {
  try {
    let auth;
    let serviceAccountEmail = 'Unknown';
    let isOAuth = false;
    
    // OPTION 1: OAuth2 using Refresh Token (Required for free @gmail.com accounts)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      isOAuth = true;
      auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );
      auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }
    // OPTION 2: Service Account JSON string
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
       const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
       serviceAccountEmail = credentials.client_email || 'Unknown';
       auth = new google.auth.GoogleAuth({
         credentials,
         scopes: ['https://www.googleapis.com/auth/drive.file'],
       });
    } 
    // OPTION 3: Service Account JSON file path
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       auth = new google.auth.GoogleAuth({
         scopes: ['https://www.googleapis.com/auth/drive.file'],
       });
    } else {
       throw new Error('Google Drive credentials not configured. Please set GOOGLE_REFRESH_TOKEN (along with CLIENT_ID and SECRET) OR GOOGLE_APPLICATION_CREDENTIALS in your .env file.');
    }

    const drive = google.drive({ version: 'v3', auth });

    const bufferStream = new Readable();
    bufferStream.push(fileObject.buffer);
    bufferStream.push(null);

    const ext = path.extname(fileObject.originalname);
    const name = path.basename(fileObject.originalname, ext).replace(/\s+/g, '-').toLowerCase();

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const fileMetadata = {
      name: `${name}-${Date.now()}${ext}`,
      parents: folderId ? [folderId] : [],
    };

    const media = {
      mimeType: fileObject.mimetype,
      body: bufferStream,
    };

    try {
      // Upload the file
      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
        supportsAllDrives: true, // Needed if using Shared Drives with Workspace
      });

      const fileId = response.data.id;

      // Make the file accessible so anyone with the link can view the resume
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });

      // Return the viewable link (which is an absolute https URL)
      return response.data.webViewLink;
    } catch (apiError) {
      if (apiError.message && apiError.message.includes('File not found') && !isOAuth) {
        throw new Error(
          `Google Drive folder not found or not accessible. You MUST go to Google Drive, right-click the folder, choose "Share", and grant "Editor" access to your Service Account email: ${serviceAccountEmail}`
        );
      }
      if (apiError.message && apiError.message.includes('storage quota')) {
        throw new Error(
          `Google no longer provides free storage quotas to Service Accounts. If you are using a free @gmail.com account, you MUST use OAuth2 instead. Please configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in your .env file. (If you have Google Workspace, you must upload to a "Shared Drive" instead of "My Drive").`
        );
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Google Drive API Error:', error.message);
    throw error;
  }
};

module.exports = { uploadFileToDrive };