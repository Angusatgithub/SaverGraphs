const UP_API_BASE_URL = 'https://api.up.com.au/api/v1';

export class UpApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'UpApiError';
  }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    console.log('Making request to Up API ping endpoint...');
    console.log('API Key length:', apiKey.length);
    console.log('First 10 chars:', apiKey.substring(0, 10));
    
    const response = await fetch(`${UP_API_BASE_URL}/util/ping`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      throw new UpApiError(
        response.status,
        response.status === 401 
          ? 'Invalid API key'
          : `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    return data.meta.statusEmoji === '⚡️'; // Up API returns this emoji when ping is successful
  } catch (error) {
    console.error('Validation error:', error);
    if (error instanceof UpApiError) {
      throw error;
    }
    throw new UpApiError(500, 'Failed to connect to Up API');
  }
} 