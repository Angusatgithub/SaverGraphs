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
    // Remove any whitespace
    const cleanKey = apiKey.trim().replace(/\s+/g, '');
    
    // Check if the key starts with 'up:yeah:'
    if (!cleanKey.startsWith('up:yeah:')) {
      throw new UpApiError(
        400,
        'Invalid API key format. The key should start with "up:yeah:"'
      );
    }

    // Validate the token part after 'up:yeah:'
    const tokenParts = cleanKey.split(':');
    if (tokenParts.length !== 3 || tokenParts[0] !== 'up' || tokenParts[1] !== 'yeah') {
      throw new UpApiError(
        400,
        'Invalid API key format. The key should be in the format "up:yeah:yourtoken"'
      );
    }

    const actualToken = tokenParts[2];
    if (!actualToken || !/^[a-zA-Z0-9]+$/.test(actualToken)) {
      throw new UpApiError(
        400,
        'Invalid API key format. The token part should only contain letters and numbers.'
      );
    }

    console.log('Making request to Up API ping endpoint...');
    console.log('API Key length:', cleanKey.length);
    console.log('Token format valid:', cleanKey.startsWith('up:yeah:'));
    
    const response = await fetch(`${UP_API_BASE_URL}/util/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      if (response.status === 401) {
        throw new UpApiError(
          401,
          'Invalid API key. Please make sure you are using a valid Up Personal Access Token from your Up developer settings.'
        );
      }
      
      throw new UpApiError(
        response.status,
        `API request failed with status ${response.status}`
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

export interface UpAccount {
  id: string;
  attributes: {
    displayName: string;
    accountType: string;
    balance: {
      value: string;
      currencyCode: string;
    };
  };
}

export async function fetchAccounts(apiKey: string): Promise<UpAccount[]> {
  const cleanKey = apiKey.trim().replace(/\s+/g, '');
  const response = await fetch(`${UP_API_BASE_URL}/accounts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cleanKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error fetching accounts:', errorText);
    throw new UpApiError(response.status, 'Failed to fetch accounts');
  }

  const data = await response.json();
  // Up API returns accounts in data array
  return data.data as UpAccount[];
} 