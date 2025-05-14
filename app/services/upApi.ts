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
    const response = await fetch(`${UP_API_BASE_URL}/util/ping`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new UpApiError(
        response.status,
        response.status === 401 
          ? 'Invalid API key'
          : `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data.meta.statusEmoji === '⚡️'; // Up API returns this emoji when ping is successful
  } catch (error) {
    if (error instanceof UpApiError) {
      throw error;
    }
    throw new UpApiError(500, 'Failed to connect to Up API');
  }
} 