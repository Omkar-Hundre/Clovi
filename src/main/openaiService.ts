import * as https from 'https';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
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

export class OpenAIService {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gpt-4o') {
    this.apiKey = apiKey.trim();
    this.modelName = modelName || 'gpt-4o';
  }

  public updateConfig(apiKey: string, modelName?: string) {
    this.apiKey = apiKey.trim();
    if (modelName) this.modelName = modelName;
  }

  public async askStream(
    prompt: string,
    imageOrImages?: { base64: string; mimeType: string } | { base64: string; mimeType: string }[],
    history: ChatMessage[] = [],
    callbacks?: StreamCallback
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.apiKey || !this.apiKey.trim()) {
          const err = new Error('OpenAI API Key is missing. Please configure it in Clovi Settings (⚙).');
          callbacks?.onError?.(err.message);
          return reject(err);
        }

        const systemPrompt =
          'You are an expert AI problem solver and exam assistant. ' +
          '1. Direct Answer: State the direct written answer, final option choice, or optimal code immediately. ' +
          '2. Concise Explanation: Provide at most ONE single sentence of explanation/intuition before the answer, with zero unnecessary filler or prelude. ' +
          '3. For MCQs: State the option letter (e.g. "**(B) Option Name**") and exact answer directly on the first line. ' +
          '4. For Coding: Provide the complete, working implementation in clean markdown code blocks without omitting any logic. ' +
          '5. For Math / STEM: State the final numeric or symbolic answer directly, followed by concise 1-2 line calculation.';

        const isReasoningModel = this.modelName.startsWith('o1') || this.modelName.startsWith('o3');

        const messages: any[] = [
          { role: isReasoningModel ? 'developer' : 'system', content: systemPrompt }
        ];

        // Add history
        const recent = history.slice(-4);
        for (const msg of recent) {
          const role = msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user';
          if (role === 'assistant') {
            messages.push({ role: 'assistant', content: msg.text });
          } else {
            const userContent: any[] = [];
            if (msg.images && msg.images.length > 0) {
              for (const img of msg.images) {
                userContent.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`
                  }
                });
              }
            }
            if (msg.text) {
              userContent.push({ type: 'text', text: msg.text });
            }
            messages.push({
              role: 'user',
              content: userContent.length === 1 && userContent[0].type === 'text' ? msg.text : userContent
            });
          }
        }

        // Current prompt & images
        const currentContent: any[] = [];
        if (Array.isArray(imageOrImages)) {
          for (const img of imageOrImages) {
            if (img && img.base64) {
              currentContent.push({
                type: 'image_url',
                image_url: {
                  url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`
                }
              });
            }
          }
        } else if (imageOrImages && imageOrImages.base64) {
          currentContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${imageOrImages.mimeType || 'image/jpeg'};base64,${imageOrImages.base64}`
            }
          });
        }

        if (prompt && prompt.trim()) {
          currentContent.push({ type: 'text', text: prompt.trim() });
        } else if (currentContent.length > 0) {
          currentContent.push({ type: 'text', text: 'Solve the problem in the screenshot directly.' });
        }

        messages.push({
          role: 'user',
          content: currentContent.length === 1 && currentContent[0].type === 'text' ? prompt.trim() : currentContent
        });

        const payload: any = {
          model: this.modelName || 'gpt-4o',
          messages,
          stream: true
        };

        if (isReasoningModel) {
          payload.max_completion_tokens = 4096;
        } else {
          payload.temperature = 0.1;
          payload.max_tokens = 4096;
        }

        const postData = JSON.stringify(payload);

        const options = {
          hostname: 'api.openai.com',
          port: 443,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        let fullText = '';

        const req = https.request(options, (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            let errBody = '';
            res.on('data', chunk => errBody += chunk);
            res.on('end', () => {
              try {
                const parsed = JSON.parse(errBody);
                const errMsg = parsed?.error?.message || `OpenAI API Error (${res.statusCode})`;
                callbacks?.onError?.(errMsg);
                reject(new Error(errMsg));
              } catch (e) {
                const errMsg = `OpenAI API Error (${res.statusCode})`;
                callbacks?.onError?.(errMsg);
                reject(new Error(errMsg));
              }
            });
            return;
          }

          let buffer = '';
          res.on('data', (chunk: Buffer) => {
            buffer += chunk.toString('utf-8');
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') {
                  callbacks?.onDone?.(fullText);
                  resolve(fullText);
                  return;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullText += content;
                    callbacks?.onChunk?.(content);
                  }
                } catch (e) {}
              }
            }
          });

          res.on('end', () => {
            if (buffer.trim()) {
              const trimmed = buffer.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(dataStr);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                      fullText += content;
                      callbacks?.onChunk?.(content);
                    }
                  } catch (e) {}
                }
              }
            }
            callbacks?.onDone?.(fullText);
            resolve(fullText);
          });
        });

        req.on('error', (err) => {
          callbacks?.onError?.(err.message);
          reject(err);
        });

        req.write(postData);
        req.end();
      } catch (err: any) {
        callbacks?.onError?.(err.message || 'Failed to send prompt to OpenAI');
        reject(err);
      }
    });
  }
}
