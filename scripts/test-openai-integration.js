const assert = require('assert');

// Test that compiled dist files exist and are syntactically valid
const { OpenAIService } = require('../dist/main/openaiService');

console.log('Testing OpenAI Integration...');

// 1. Instantiation Test
assert(typeof OpenAIService === 'function', 'OpenAIService should be a constructor class');
const service = new OpenAIService('sk-test-key-12345', 'gpt-4o');
assert(service !== null, 'Service instance should be created');
assert(typeof service.askStream === 'function', 'Service should have askStream function');
assert(typeof service.updateConfig === 'function', 'Service should have updateConfig function');

console.log('✅ OpenAI / ChatGPT integration tests passed successfully!');
