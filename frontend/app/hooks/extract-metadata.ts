interface MetadataResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const uploadMetadataFile = async (file: File, type: 'research_paper' | 'dataset' = 'research_paper'): Promise<MetadataResponse> => {
  try {
    const formDataForMetadata = new FormData();
    formDataForMetadata.append('file', file);

    const formDataForSummary = new FormData();
    formDataForSummary.append('file', file);

    // Choose endpoints based on type
    const metadataEndpoint = type === 'dataset'
      ? 'https://sei-agents-metadata.onrender.com/dataset/metadata'
      : 'https://sei-agents-metadata.onrender.com/paper/metadata';
    const summaryEndpoint = type === 'dataset'
      ? 'https://sei-agents-metadata.onrender.com/dataset/summary'
      : 'https://sei-agents-metadata.onrender.com/paper/summary';

    const [metadataRes, summaryRes] = await Promise.all([
      fetch(metadataEndpoint, {
        method: 'POST',
        body: formDataForMetadata,
      }),
      fetch(summaryEndpoint, {
        method: 'POST',
        body: formDataForSummary,
      })
    ]);

    if (!metadataRes.ok) {
      throw new Error(`Metadata HTTP error: ${metadataRes.status}`);
    }
    if (!summaryRes.ok) {
      throw new Error(`Summary HTTP error: ${summaryRes.status}`);
    }

    const [metadataJson, summaryJson] = await Promise.all([
      metadataRes.json(),
      summaryRes.json(),
    ]);

    const merged = {
      ...metadataJson,
      abstract: summaryJson?.abstract || metadataJson?.abstract || '',
      keywords: summaryJson?.keywords || metadataJson?.keywords || [],
      ai_summary: {
        abstract: summaryJson?.abstract || metadataJson?.abstract || '',
        keywords: summaryJson?.keywords || metadataJson?.keywords || [],
        problem_statement: summaryJson?.problem_statement || '',
        methodology_summary: summaryJson?.methodology_summary || '',
        results_summary: summaryJson?.results_summary || '',
        conclusion_summary: summaryJson?.conclusion_summary || '',
        contributions: summaryJson?.contributions || '',
        field_of_study: summaryJson?.field_of_study || '',
        subfields: summaryJson?.subfields || [],
        tasks: summaryJson?.tasks || [],
        datasets_used: summaryJson?.datasets_used || null,
        code_link: summaryJson?.code_link || null,
        application_domains: summaryJson?.application_domains || [],
        bibtex: summaryJson?.bibtex || metadataJson?.bibtex_string || ''
      },
      raw: {
        metadata: metadataJson,
        summary: summaryJson,
      }
    };

    return {
      success: true,
      data: merged
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const uploadFileWithSummary = async (file: File): Promise<MetadataResponse> => {
  // Backwards-compatible alias
  return uploadMetadataFile(file);
};