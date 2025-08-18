interface MetadataResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const uploadMetadataFile = async (file: File): Promise<MetadataResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://sei-agents-metadata.onrender.com/metadata', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    
    return {
      success: false,
      error: errorMessage
    };
  }
};
