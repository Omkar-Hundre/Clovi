import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
  images?: { base64: string; mimeType: string }[];
}

export interface StreamCallback {
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;
  private apiKey: string;

  constructor(apiKey: string, modelName: string = 'gemini-2.5-flash') {
    this.apiKey = apiKey.trim();
    this.modelName = modelName || 'gemini-2.5-flash';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  public updateConfig(apiKey: string, modelName?: string) {
    this.apiKey = apiKey.trim();
    if (modelName) this.modelName = modelName;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  public async askStream(
    prompt: string,
    imageOrImages?: { base64: string; mimeType: string } | { base64: string; mimeType: string }[],
    history: ChatMessage[] = [],
    callbacks?: StreamCallback
  ): Promise<string> {
    const candidateModels = [
      this.modelName || 'gemini-2.5-flash',
      'gemini-3.7-flash',
      'gemini-flash-latest'
    ];

    const systemInstruction =
      'You are an expert AI problem solver and exam assistant. ' +
      '1. Direct Answer: State the direct written answer, final option choice, or optimal code immediately. ' +
      '2. Concise Explanation: Provide at most ONE single sentence of explanation/intuition before the answer, with zero unnecessary filler or prelude. ' +
      '3. For MCQs: State the option letter (e.g. "**(B) Option Name**") and exact answer directly on the first line. ' +
      '4. For Coding: Provide the complete, working implementation in clean markdown code blocks without omitting any logic. ' +
      '5. For Math / STEM: State the final numeric or symbolic answer directly, followed by concise 1-2 line calculation.';

    let lastError: any = null;

    for (const modelCandidate of candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelCandidate,
          systemInstruction,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        });

        const contents: any[] = [];

        // Add recent history if available (limit to last 4 for speed)
        const recentHistory = history.slice(-4);
        for (const msg of recentHistory) {
          const parts: any[] = [];
          if (msg.images && msg.images.length > 0) {
            for (const img of msg.images) {
              parts.push({
                inlineData: {
                  data: img.base64,
                  mimeType: img.mimeType || 'image/jpeg'
                }
              });
            }
          } else if (msg.imageBase64 && msg.imageMimeType) {
            parts.push({
              inlineData: {
                data: msg.imageBase64,
                mimeType: msg.imageMimeType
              }
            });
          }
          parts.push({ text: msg.text });
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts
          });
        }

        // Add current request
        const currentParts: any[] = [];
        const hasImages = Array.isArray(imageOrImages) ? imageOrImages.length > 0 : !!imageOrImages;
        if (Array.isArray(imageOrImages)) {
          for (const img of imageOrImages) {
            if (img && img.base64) {
              currentParts.push({
                inlineData: {
                  data: img.base64,
                  mimeType: img.mimeType || 'image/jpeg'
                }
              });
            }
          }
        } else if (imageOrImages && imageOrImages.base64) {
          currentParts.push({
            inlineData: {
              data: imageOrImages.base64,
              mimeType: imageOrImages.mimeType || 'image/jpeg'
            }
          });
        }

        currentParts.push({
          text: prompt || (hasImages ? 'Give the direct written answer to the question in this screenshot immediately.' : 'Hello')
        });

        contents.push({
          role: 'user',
          parts: currentParts
        });

        const responseStream = await model.generateContentStream({ contents });
        let fullText = '';

        for await (const chunk of responseStream.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          callbacks?.onChunk(chunkText);
        }

        callbacks?.onDone(fullText);
        return fullText;
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiService] Model ${modelCandidate} failed: ${err.message}, attempting next model...`);
      }
    }

    const errMsg = lastError?.message || 'Failed to call Gemini API';
    callbacks?.onError(errMsg);
    throw lastError;
  }
}
