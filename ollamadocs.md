> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Introduction

Ollama's API allows you to run and interact with models programatically.

## Get started

If you're just getting started, follow the [quickstart](/quickstart) documentation to get up and running with Ollama's API.

## Base URL

After installation, Ollama's API is served by default at:

```
http://localhost:11434/api
```

For running cloud models on **ollama.com**, the same API is available with the following base URL:

```
https://ollama.com/api
```

## Example request

Once Ollama is running, its API is automatically available and can be accessed via `curl`:

```shell  theme={"system"}
curl http://localhost:11434/api/generate -d '{
  "model": "gemma3",
  "prompt": "Why is the sky blue?"
}'
```

## Libraries

Ollama has official libraries for Python and JavaScript:

* [Python](https://github.com/ollama/ollama-python)
* [JavaScript](https://github.com/ollama/ollama-js)

Several community-maintained libraries are available for Ollama. For a full list, see the [Ollama GitHub repository](https://github.com/ollama/ollama?tab=readme-ov-file#libraries-1).

## Versioning

Ollama's API isn't strictly versioned, but the API is expected to be stable and backwards compatible. Deprecations are rare and will be announced in the [release notes](https://github.com/ollama/ollama/releases). > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication

No authentication is required when accessing Ollama's API locally via `http://localhost:11434`.

Authentication is required for the following:

* Running cloud models via ollama.com
* Publishing models
* Downloading private models

Ollama supports two authentication methods:

* **Signing in**: sign in from your local installation, and Ollama will automatically take care of authenticating requests to ollama.com when running commands
* **API keys**: API keys for programmatic access to ollama.com's API

## Signing in

To sign in to ollama.com from your local installation of Ollama, run:

```
ollama signin
```

Once signed in, Ollama will automatically authenticate commands as required:

```
ollama run gpt-oss:120b-cloud
```

Similarly, when accessing a local API endpoint that requires cloud access, Ollama will automatically authenticate the request:

```shell  theme={"system"}
curl http://localhost:11434/api/generate -d '{
  "model": "gpt-oss:120b-cloud",
  "prompt": "Why is the sky blue?"
}'
```

## API keys

For direct access to ollama.com's API served at `https://ollama.com/api`, authentication via API keys is required.

First, create an [API key](https://ollama.com/settings/keys), then set the `OLLAMA_API_KEY` environment variable:

```shell  theme={"system"}
export OLLAMA_API_KEY=your_api_key
```

Then use the API key in the Authorization header:

```shell  theme={"system"}
curl https://ollama.com/api/generate \
  -H "Authorization: Bearer $OLLAMA_API_KEY" \
  -d '{
    "model": "gpt-oss:120b",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'
```

API keys don't currently expire, however you can revoke them at any time in your [API keys settings](https://ollama.com/settings/keys). > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming

Certain API endpoints stream responses by default, such as `/api/generate`. These responses are provided in the newline-delimited JSON format (i.e. the `application/x-ndjson` content type). For example:

```json  theme={"system"}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.097767Z","response":"That","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.109172Z","response":"'","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.121485Z","response":"s","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.132802Z","response":" a","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.143931Z","response":" fantastic","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.155176Z","response":" question","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.166576Z","response":"!","done":true, "done_reason": "stop"}
```

## Disabling streaming

Streaming can be disabled by providing `{"stream": false}` in the request body for any endpoint that support streaming. This will cause responses to be returned in the `application/json` format instead:

```json  theme={"system"}
{"model":"gemma3","created_at":"2025-10-26T17:15:24.166576Z","response":"That's a fantastic question!","done":true}
```

## When to use streaming vs non-streaming

**Streaming (default)**:

* Real-time response generation
* Lower perceived latency
* Better for long generations

**Non-streaming**:

* Simpler to process
* Better for short responses, or structured outputs
* Easier to handle in some applications > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Usage

Ollama's API responses include metrics that can be used for measuring performance and model usage:

* `total_duration`: How long the response took to generate
* `load_duration`: How long the model took to load
* `prompt_eval_count`: How many input tokens were processed
* `prompt_eval_duration`: How long it took to evaluate the prompt
* `eval_count`: How many output tokens were processes
* `eval_duration`: How long it took to generate the output tokens

All timing values are measured in nanoseconds.

## Example response

For endpoints that return usage metrics, the response body will include the usage fields. For example, a non-streaming call to `/api/generate` may return the following response:

```json  theme={"system"}
{
  "model": "gemma3",
  "created_at": "2025-10-17T23:14:07.414671Z",
  "response": "Hello! How can I help you today?",
  "done": true,
  "done_reason": "stop",
  "total_duration": 174560334,
  "load_duration": 101397084,
  "prompt_eval_count": 11,
  "prompt_eval_duration": 13074791,
  "eval_count": 18,
  "eval_duration": 52479709
}
```

For endpoints that return **streaming responses**, usage fields are included as part of the final chunk, where `done` is `true`. > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Errors

## Status codes

Endpoints return appropriate HTTP status codes based on the success or failure of the request in the HTTP status line (e.g. `HTTP/1.1 200 OK` or `HTTP/1.1 400 Bad Request`). Common status codes are:

* `200`: Success
* `400`: Bad Request (missing parameters, invalid JSON, etc.)
* `404`: Not Found (model doesn't exist, etc.)
* `429`: Too Many Requests (e.g. when a rate limit is exceeded)
* `500`: Internal Server Error
* `502`: Bad Gateway (e.g. when a cloud model cannot be reached)

## Error messages

Errors are returned in the `application/json` format with the following structure, with the error message in the `error` property:

```json  theme={"system"}
{
  "error": "the model failed to generate a response"
}
```

## Errors that occur while streaming

If an error occurs mid-stream, the error will be returned as an object in the `application/x-ndjson` format with an `error` property. Since the response has already started, the status code of the response will not be changed.

```json  theme={"system"}
{"model":"gemma3","created_at":"2025-10-26T17:21:21.196249Z","response":" Yes","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:21:21.207235Z","response":".","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:21:21.219166Z","response":"I","done":false}
{"model":"gemma3","created_at":"2025-10-26T17:21:21.231094Z","response":"can","done":false}
{"error":"an error was encountered while running the model"}
```

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# OpenAI compatibility

Ollama provides compatibility with parts of the [OpenAI API](https://platform.openai.com/docs/api-reference) to help connect existing applications to Ollama.

## Usage

### Simple `/v1/chat/completions` example

<CodeGroup dropdown>
  ```python basic.py theme={"system"}
  from openai import OpenAI

  client = OpenAI(
      base_url='http://localhost:11434/v1/',
      api_key='ollama',  # required but ignored
  )

  chat_completion = client.chat.completions.create(
      messages=[
          {
              'role': 'user',
              'content': 'Say this is a test',
          }
      ],
      model='gpt-oss:20b',
  )
  print(chat_completion.choices[0].message.content)
  ```

  ```javascript basic.js theme={"system"}
  import OpenAI from "openai";

  const openai = new OpenAI({
    baseURL: "http://localhost:11434/v1/",
    apiKey: "ollama", // required but ignored
  });

  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Say this is a test" }],
    model: "gpt-oss:20b",
  });

  console.log(chatCompletion.choices[0].message.content);
  ```

  ```shell basic.sh theme={"system"}
  curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-oss:20b",
    "messages": [{ "role": "user", "content": "Say this is a test" }]
  }'
  ```
</CodeGroup>

### Simple `/v1/responses` example

<CodeGroup dropdown>
  ```python responses.py theme={"system"}
  from openai import OpenAI

  client = OpenAI(
      base_url='http://localhost:11434/v1/',
      api_key='ollama',  # required but ignored
  )

  responses_result = client.responses.create(
    model='qwen3:8b',
    input='Write a short poem about the color blue',
  )
  print(responses_result.output_text)
  ```

  ```javascript responses.js theme={"system"}
  import OpenAI from "openai";

  const openai = new OpenAI({
    baseURL: "http://localhost:11434/v1/",
    apiKey: "ollama", // required but ignored
  });

  const responsesResult = await openai.responses.create({
    model: "qwen3:8b",
    input: "Write a short poem about the color blue",
  });

  console.log(responsesResult.output_text);
  ```

  ```shell responses.sh theme={"system"}
  curl -X POST http://localhost:11434/v1/responses \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:8b",
    "input": "Write a short poem about the color blue"
  }'
  ```
</CodeGroup>

### `/v1/chat/completions` with vision example

<CodeGroup dropdown>
  ```python vision.py theme={"system"}
  from openai import OpenAI

  client = OpenAI(
      base_url='http://localhost:11434/v1/',
      api_key='ollama',  # required but ignored
  )

  response = client.chat.completions.create(
      model='qwen3-vl:8b',
      messages=[
          {
              'role': 'user',
              'content': [
                  {'type': 'text', 'text': "What's in this image?"},
                  {
                      'type': 'image_url',
                      'image_url': 'data:image/png;base64,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',
                  },
              ],
          }
      ],
      max_tokens=300,
  )
  print(response.choices[0].message.content)
  ```

  ```javascript vision.js theme={"system"}
  import OpenAI from "openai";

  const openai = new OpenAI({
    baseURL: "http://localhost:11434/v1/",
    apiKey: "ollama", // required but ignored
  });

  const response = await openai.chat.completions.create({
    model: "qwen3-vl:8b",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What's in this image?" },
          {
            type: "image_url",
            image_url:
              "data:image/png;base64,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",
          },
        ],
      },
    ],
  });
  console.log(response.choices[0].message.content);
  ```

  ```shell vision.sh theme={"system"}
  curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-vl:8b",
    "messages": [{ "role": "user", "content": [{"type": "text", "text": "What is this an image of?"}, {"type": "image_url", "image_url": "data:image/png;base64,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"}]}]
  }'
  ```
</CodeGroup>

## Endpoints

### `/v1/chat/completions`

#### Supported features

* [x] Chat completions
* [x] Streaming
* [x] JSON mode
* [x] Reproducible outputs
* [x] Vision
* [x] Tools
* [x] Reasoning/thinking control (for thinking models)
* [ ] Logprobs

#### Supported request fields

* [x] `model`
* [x] `messages`
  * [x] Text `content`
  * [x] Image `content`
    * [x] Base64 encoded image
    * [ ] Image URL
  * [x] Array of `content` parts
* [x] `frequency_penalty`
* [x] `presence_penalty`
* [x] `response_format`
* [x] `seed`
* [x] `stop`
* [x] `stream`
* [x] `stream_options`
  * [x] `include_usage`
* [x] `temperature`
* [x] `top_p`
* [x] `max_tokens`
* [x] `tools`
* [x] `reasoning_effort` (`"high"`, `"medium"`, `"low"`, `"none"`)
* [x] `reasoning`
  * [x] `effort` (`"high"`, `"medium"`, `"low"`, `"none"`)
* [ ] `tool_choice`
* [ ] `logit_bias`
* [ ] `user`
* [ ] `n`

### `/v1/completions`

#### Supported features

* [x] Completions
* [x] Streaming
* [x] JSON mode
* [x] Reproducible outputs
* [ ] Logprobs

#### Supported request fields

* [x] `model`
* [x] `prompt`
* [x] `frequency_penalty`
* [x] `presence_penalty`
* [x] `seed`
* [x] `stop`
* [x] `stream`
* [x] `stream_options`
  * [x] `include_usage`
* [x] `temperature`
* [x] `top_p`
* [x] `max_tokens`
* [x] `suffix`
* [ ] `best_of`
* [ ] `echo`
* [ ] `logit_bias`
* [ ] `user`
* [ ] `n`

#### Notes

* `prompt` currently only accepts a string

### `/v1/models`

#### Notes

* `created` corresponds to when the model was last modified
* `owned_by` corresponds to the ollama username, defaulting to `"library"`

### `/v1/models/{model}`

#### Notes

* `created` corresponds to when the model was last modified
* `owned_by` corresponds to the ollama username, defaulting to `"library"`

### `/v1/embeddings`

#### Supported request fields

* [x] `model`
* [x] `input`
  * [x] string
  * [x] array of strings
  * [ ] array of tokens
  * [ ] array of token arrays
* [x] `encoding format`
* [x] `dimensions`
* [ ] `user`

### `/v1/images/generations` (experimental)

> Note: This endpoint is experimental and may change or be removed in future versions.

Generate images using image generation models.

<CodeGroup dropdown>
  ```python images.py theme={"system"}
  from openai import OpenAI

  client = OpenAI(
      base_url='http://localhost:11434/v1/',
      api_key='ollama',  # required but ignored
  )

  response = client.images.generate(
      model='x/z-image-turbo',
      prompt='A cute robot learning to paint',
      size='1024x1024',
      response_format='b64_json',
  )
  print(response.data[0].b64_json[:50] + '...')
  ```

  ```javascript images.js theme={"system"}
  import OpenAI from "openai";

  const openai = new OpenAI({
    baseURL: "http://localhost:11434/v1/",
    apiKey: "ollama", // required but ignored
  });

  const response = await openai.images.generate({
    model: "x/z-image-turbo",
    prompt: "A cute robot learning to paint",
    size: "1024x1024",
    response_format: "b64_json",
  });

  console.log(response.data[0].b64_json.slice(0, 50) + "...");
  ```

  ```shell images.sh theme={"system"}
  curl -X POST http://localhost:11434/v1/images/generations \
  -H "Content-Type: application/json" \
  -d '{
    "model": "x/z-image-turbo",
    "prompt": "A cute robot learning to paint",
    "size": "1024x1024",
    "response_format": "b64_json"
  }'
  ```
</CodeGroup>

#### Supported request fields

* [x] `model`
* [x] `prompt`
* [x] `size` (e.g. "1024x1024")
* [x] `response_format` (only `b64_json` supported)
* [ ] `n`
* [ ] `quality`
* [ ] `style`
* [ ] `user`

### `/v1/responses`

> Note: Added in Ollama v0.13.3

Ollama supports the [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses). Only the non-stateful flavor is supported (i.e., there is no `previous_response_id` or `conversation` support).

#### Supported features

* [x] Streaming
* [x] Tools (function calling)
* [x] Reasoning summaries (for thinking models)
* [ ] Stateful requests

#### Supported request fields

* [x] `model`
* [x] `input`
* [x] `instructions`
* [x] `tools`
* [x] `stream`
* [x] `temperature`
* [x] `top_p`
* [x] `max_output_tokens`
* [ ] `previous_response_id` (stateful v1/responses not supported)
* [ ] `conversation` (stateful v1/responses not supported)
* [ ] `truncation`

## Models

Before using a model, pull it locally `ollama pull`:

```shell  theme={"system"}
ollama pull llama3.2
```

### Default model names

For tooling that relies on default OpenAI model names such as `gpt-3.5-turbo`, use `ollama cp` to copy an existing model name to a temporary name:

```shell  theme={"system"}
ollama cp llama3.2 gpt-3.5-turbo
```

Afterwards, this new model name can be specified the `model` field:

```shell  theme={"system"}
curl http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": "Hello!"
            }
        ]
    }'
```

### Setting the context size

The OpenAI API does not have a way of setting the context size for a model. If you need to change the context size, create a `Modelfile` which looks like:

```
FROM <some model>
PARAMETER num_ctx <context size>
```

Use the `ollama create mymodel` command to create a new model with the updated context size. Call the API with the updated model name:

```shell  theme={"system"}
curl http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "mymodel",
        "messages": [
            {
                "role": "user",
                "content": "Hello!"
            }
        ]
    }'
```
  > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Anthropic compatibility

Ollama provides compatibility with the [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) to help connect existing applications to Ollama, including tools like Claude Code.

## Usage

### Environment variables

To use Ollama with tools that expect the Anthropic API (like Claude Code), set these environment variables:

```shell  theme={"system"}
export ANTHROPIC_AUTH_TOKEN=ollama  # required but ignored
export ANTHROPIC_BASE_URL=http://localhost:11434
```

### Simple `/v1/messages` example

<CodeGroup dropdown>
  ```python basic.py theme={"system"}
  import anthropic

  client = anthropic.Anthropic(
      base_url='http://localhost:11434',
      api_key='ollama',  # required but ignored
  )

  message = client.messages.create(
      model='qwen3-coder',
      max_tokens=1024,
      messages=[
          {'role': 'user', 'content': 'Hello, how are you?'}
      ]
  )
  print(message.content[0].text)
  ```

  ```javascript basic.js theme={"system"}
  import Anthropic from "@anthropic-ai/sdk";

  const anthropic = new Anthropic({
    baseURL: "http://localhost:11434",
    apiKey: "ollama", // required but ignored
  });

  const message = await anthropic.messages.create({
    model: "qwen3-coder",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Hello, how are you?" }],
  });

  console.log(message.content[0].text);
  ```

  ```shell basic.sh theme={"system"}
  curl -X POST http://localhost:11434/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: ollama" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "qwen3-coder",
    "max_tokens": 1024,
    "messages": [{ "role": "user", "content": "Hello, how are you?" }]
  }'
  ```
</CodeGroup>

### Streaming example

<CodeGroup dropdown>
  ```python streaming.py theme={"system"}
  import anthropic

  client = anthropic.Anthropic(
      base_url='http://localhost:11434',
      api_key='ollama',
  )

  with client.messages.stream(
      model='qwen3-coder',
      max_tokens=1024,
      messages=[{'role': 'user', 'content': 'Count from 1 to 10'}]
  ) as stream:
      for text in stream.text_stream:
          print(text, end='', flush=True)
  ```

  ```javascript streaming.js theme={"system"}
  import Anthropic from "@anthropic-ai/sdk";

  const anthropic = new Anthropic({
    baseURL: "http://localhost:11434",
    apiKey: "ollama",
  });

  const stream = await anthropic.messages.stream({
    model: "qwen3-coder",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Count from 1 to 10" }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      process.stdout.write(event.delta.text);
    }
  }
  ```

  ```shell streaming.sh theme={"system"}
  curl -X POST http://localhost:11434/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-coder",
    "max_tokens": 1024,
    "stream": true,
    "messages": [{ "role": "user", "content": "Count from 1 to 10" }]
  }'
  ```
</CodeGroup>

### Tool calling example

<CodeGroup dropdown>
  ```python tools.py theme={"system"}
  import anthropic

  client = anthropic.Anthropic(
      base_url='http://localhost:11434',
      api_key='ollama',
  )

  message = client.messages.create(
      model='qwen3-coder',
      max_tokens=1024,
      tools=[
          {
              'name': 'get_weather',
              'description': 'Get the current weather in a location',
              'input_schema': {
                  'type': 'object',
                  'properties': {
                      'location': {
                          'type': 'string',
                          'description': 'The city and state, e.g. San Francisco, CA'
                      }
                  },
                  'required': ['location']
              }
          }
      ],
      messages=[{'role': 'user', 'content': "What's the weather in San Francisco?"}]
  )

  for block in message.content:
      if block.type == 'tool_use':
          print(f'Tool: {block.name}')
          print(f'Input: {block.input}')
  ```

  ```javascript tools.js theme={"system"}
  import Anthropic from "@anthropic-ai/sdk";

  const anthropic = new Anthropic({
    baseURL: "http://localhost:11434",
    apiKey: "ollama",
  });

  const message = await anthropic.messages.create({
    model: "qwen3-coder",
    max_tokens: 1024,
    tools: [
      {
        name: "get_weather",
        description: "Get the current weather in a location",
        input_schema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA",
            },
          },
          required: ["location"],
        },
      },
    ],
    messages: [{ role: "user", content: "What's the weather in San Francisco?" }],
  });

  for (const block of message.content) {
    if (block.type === "tool_use") {
      console.log("Tool:", block.name);
      console.log("Input:", block.input);
    }
  }
  ```

  ```shell tools.sh theme={"system"}
  curl -X POST http://localhost:11434/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-coder",
    "max_tokens": 1024,
    "tools": [
      {
        "name": "get_weather",
        "description": "Get the current weather in a location",
        "input_schema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state"
            }
          },
          "required": ["location"]
        }
      }
    ],
    "messages": [{ "role": "user", "content": "What is the weather in San Francisco?" }]
  }'
  ```
</CodeGroup>

## Using with Claude Code

[Claude Code](https://code.claude.com/docs/en/overview) can be configured to use Ollama as its backend.

### Recommended models

For coding use cases, models like `glm-4.7`, `minimax-m2.1`, and `qwen3-coder` are recommended.

Download a model before use:

```shell  theme={"system"}
ollama pull qwen3-coder
```

> Note: Qwen 3 coder is a 30B parameter model requiring at least 24GB of VRAM to run smoothly. More is required for longer context lengths.

```shell  theme={"system"}
ollama pull glm-4.7:cloud
```

### Quick setup

```shell  theme={"system"}
ollama launch claude
```

This will prompt you to select a model, configure Claude Code automatically, and launch it. To configure without launching:

```shell  theme={"system"}
ollama launch claude --config
```

### Manual setup

Set the environment variables and run Claude Code:

```shell  theme={"system"}
ANTHROPIC_AUTH_TOKEN=ollama ANTHROPIC_BASE_URL=http://localhost:11434 claude --model qwen3-coder
```

Or set the environment variables in your shell profile:

```shell  theme={"system"}
export ANTHROPIC_AUTH_TOKEN=ollama
export ANTHROPIC_BASE_URL=http://localhost:11434
```

Then run Claude Code with any Ollama model:

```shell  theme={"system"}
claude --model qwen3-coder
```

## Endpoints

### `/v1/messages`

#### Supported features

* [x] Messages
* [x] Streaming
* [x] System prompts
* [x] Multi-turn conversations
* [x] Vision (images)
* [x] Tools (function calling)
* [x] Tool results
* [x] Thinking/extended thinking

#### Supported request fields

* [x] `model`
* [x] `max_tokens`
* [x] `messages`
  * [x] Text `content`
  * [x] Image `content` (base64)
  * [x] Array of content blocks
  * [x] `tool_use` blocks
  * [x] `tool_result` blocks
  * [x] `thinking` blocks
* [x] `system` (string or array)
* [x] `stream`
* [x] `temperature`
* [x] `top_p`
* [x] `top_k`
* [x] `stop_sequences`
* [x] `tools`
* [x] `thinking`
* [ ] `tool_choice`
* [ ] `metadata`

#### Supported response fields

* [x] `id`
* [x] `type`
* [x] `role`
* [x] `model`
* [x] `content` (text, tool\_use, thinking blocks)
* [x] `stop_reason` (end\_turn, max\_tokens, tool\_use)
* [x] `usage` (input\_tokens, output\_tokens)

#### Streaming events

* [x] `message_start`
* [x] `content_block_start`
* [x] `content_block_delta` (text\_delta, input\_json\_delta, thinking\_delta)
* [x] `content_block_stop`
* [x] `message_delta`
* [x] `message_stop`
* [x] `ping`
* [x] `error`

## Models

Ollama supports both local and cloud models.

### Local models

Pull a local model before use:

```shell  theme={"system"}
ollama pull qwen3-coder
```

Recommended local models:

* `qwen3-coder` - Excellent for coding tasks
* `gpt-oss:20b` - Strong general-purpose model

### Cloud models

Cloud models are available immediately without pulling:

* `glm-4.7:cloud` - High-performance cloud model
* `minimax-m2.1:cloud` - Fast cloud model

### Default model names

For tooling that relies on default Anthropic model names such as `claude-3-5-sonnet`, use `ollama cp` to copy an existing model name:

```shell  theme={"system"}
ollama cp qwen3-coder claude-3-5-sonnet
```

Afterwards, this new model name can be specified in the `model` field:

```shell  theme={"system"}
curl http://localhost:11434/v1/messages \
    -H "Content-Type: application/json" \
    -d '{
        "model": "claude-3-5-sonnet",
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": "Hello!"
            }
        ]
    }'
```

## Differences from the Anthropic API

### Behavior differences

* API key is accepted but not validated
* `anthropic-version` header is accepted but not used
* Token counts are approximations based on the underlying model's tokenizer

### Not supported

The following Anthropic API features are not currently supported:

| Feature                     | Description                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `/v1/messages/count_tokens` | Token counting endpoint                                     |
| `tool_choice`               | Forcing specific tool use or disabling tools                |
| `metadata`                  | Request metadata (user\_id)                                 |
| Prompt caching              | `cache_control` blocks for caching prefixes                 |
| Batches API                 | `/v1/messages/batches` for async batch processing           |
| Citations                   | `citations` content blocks                                  |
| PDF support                 | `document` content blocks with PDF files                    |
| Server-sent errors          | `error` events during streaming (errors return HTTP status) |

### Partial support

| Feature           | Status                                                   |
| ----------------- | -------------------------------------------------------- |
| Image content     | Base64 images supported; URL images not supported        |
| Extended thinking | Basic support; `budget_tokens` accepted but not enforced |


> ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Generate a response

> Generates a response for the provided prompt



## OpenAPI

````yaml /openapi.yaml post /api/generate
openapi: 3.1.0
info:
  title: Ollama API
  version: 0.1.0
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  description: |
    OpenAPI specification for the Ollama HTTP API
servers:
  - url: http://localhost:11434
    description: Ollama
security: []
paths:
  /api/generate:
    post:
      summary: Generate a response
      description: Generates a response for the provided prompt
      operationId: generate
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateRequest'
            example:
              model: gemma3
              prompt: Why is the sky blue?
      responses:
        '200':
          description: Generation responses
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GenerateResponse'
              example:
                model: gemma3
                created_at: '2025-10-17T23:14:07.414671Z'
                response: Hello! How can I help you today?
                done: true
                done_reason: stop
                total_duration: 174560334
                load_duration: 101397084
                prompt_eval_count: 11
                prompt_eval_duration: 13074791
                eval_count: 18
                eval_duration: 52479709
            application/x-ndjson:
              schema:
                $ref: '#/components/schemas/GenerateStreamEvent'
      x-codeSamples:
        - lang: bash
          label: Default
          source: |
            curl http://localhost:11434/api/generate -d '{
              "model": "gemma3",
              "prompt": "Why is the sky blue?"
            }'
        - lang: bash
          label: Non-streaming
          source: |
            curl http://localhost:11434/api/generate -d '{
              "model": "gemma3",
              "prompt": "Why is the sky blue?",
              "stream": false
            }'
        - lang: bash
          label: With options
          source: |
            curl http://localhost:11434/api/generate -d '{
              "model": "gemma3",
              "prompt": "Why is the sky blue?",
              "options": {
                "temperature": 0.8,
                "top_p": 0.9,
                "seed": 42
              }
            }'
        - lang: bash
          label: Structured outputs
          source: |
            curl http://localhost:11434/api/generate -d '{
              "model": "gemma3",
              "prompt": "What are the populations of the United States and Canada?",
              "stream": false,
              "format": {
                "type": "object",
                "properties": {
                  "countries": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "country": {"type": "string"},
                        "population": {"type": "integer"}
                      },
                      "required": ["country", "population"]
                    }
                  }
                },
                "required": ["countries"]
              }
            }'
        - lang: bash
          label: With images
          source: |
            curl http://localhost:11434/api/generate -d '{
              "model": "gemma3",
              "prompt": "What is in this picture?",
              "images": ["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"]
            }'
        - lang: bash
          label: Load model
          source: |
            curl http://localhost:11434/api/generate -d '{
              "model": "gemma3"
            }'
        - lang: bash
          label: Unload model
          source: |
            curl http://localhost:11434/api/generate -d '{
              "model": "gemma3",
              "keep_alive": 0
            }'
components:
  schemas:
    GenerateRequest:
      type: object
      required:
        - model
      properties:
        model:
          type: string
          description: Model name
        prompt:
          type: string
          description: Text for the model to generate a response from
        suffix:
          type: string
          description: >-
            Used for fill-in-the-middle models, text that appears after the user
            prompt and before the model response
        images:
          type: array
          items:
            type: string
            description: Base64-encoded images for models that support image input
        format:
          description: >-
            Structured output format for the model to generate a response from.
            Supports either the string `"json"` or a JSON schema object.
          oneOf:
            - type: string
            - type: object
        system:
          description: System prompt for the model to generate a response from
          type: string
        stream:
          description: When true, returns a stream of partial responses
          type: boolean
          default: true
        think:
          oneOf:
            - type: boolean
            - type: string
              enum:
                - high
                - medium
                - low
          description: >-
            When true, returns separate thinking output in addition to content.
            Can be a boolean (true/false) or a string ("high", "medium", "low")
            for supported models.
        raw:
          type: boolean
          description: >-
            When true, returns the raw response from the model without any
            prompt templating
        keep_alive:
          oneOf:
            - type: string
            - type: number
          description: >-
            Model keep-alive duration (for example `5m` or `0` to unload
            immediately)
        options:
          $ref: '#/components/schemas/ModelOptions'
        logprobs:
          type: boolean
          description: Whether to return log probabilities of the output tokens
        top_logprobs:
          type: integer
          description: >-
            Number of most likely tokens to return at each token position when
            logprobs are enabled
    GenerateResponse:
      type: object
      properties:
        model:
          type: string
          description: Model name
        created_at:
          type: string
          description: ISO 8601 timestamp of response creation
        response:
          type: string
          description: The model's generated text response
        thinking:
          type: string
          description: The model's generated thinking output
        done:
          type: boolean
          description: Indicates whether generation has finished
        done_reason:
          type: string
          description: Reason the generation stopped
        total_duration:
          type: integer
          description: Time spent generating the response in nanoseconds
        load_duration:
          type: integer
          description: Time spent loading the model in nanoseconds
        prompt_eval_count:
          type: integer
          description: Number of input tokens in the prompt
        prompt_eval_duration:
          type: integer
          description: Time spent evaluating the prompt in nanoseconds
        eval_count:
          type: integer
          description: Number of output tokens generated in the response
        eval_duration:
          type: integer
          description: Time spent generating tokens in nanoseconds
        logprobs:
          type: array
          items:
            $ref: '#/components/schemas/Logprob'
          description: >-
            Log probability information for the generated tokens when logprobs
            are enabled
    GenerateStreamEvent:
      type: object
      properties:
        model:
          type: string
          description: Model name
        created_at:
          type: string
          description: ISO 8601 timestamp of response creation
        response:
          type: string
          description: The model's generated text response for this chunk
        thinking:
          type: string
          description: The model's generated thinking output for this chunk
        done:
          type: boolean
          description: Indicates whether the stream has finished
        done_reason:
          type: string
          description: Reason streaming finished
        total_duration:
          type: integer
          description: Time spent generating the response in nanoseconds
        load_duration:
          type: integer
          description: Time spent loading the model in nanoseconds
        prompt_eval_count:
          type: integer
          description: Number of input tokens in the prompt
        prompt_eval_duration:
          type: integer
          description: Time spent evaluating the prompt in nanoseconds
        eval_count:
          type: integer
          description: Number of output tokens generated in the response
        eval_duration:
          type: integer
          description: Time spent generating tokens in nanoseconds
    ModelOptions:
      type: object
      description: Runtime options that control text generation
      properties:
        seed:
          type: integer
          description: Random seed used for reproducible outputs
        temperature:
          type: number
          format: float
          description: Controls randomness in generation (higher = more random)
        top_k:
          type: integer
          description: Limits next token selection to the K most likely
        top_p:
          type: number
          format: float
          description: Cumulative probability threshold for nucleus sampling
        min_p:
          type: number
          format: float
          description: Minimum probability threshold for token selection
        stop:
          oneOf:
            - type: string
            - type: array
              items:
                type: string
          description: Stop sequences that will halt generation
        num_ctx:
          type: integer
          description: Context length size (number of tokens)
        num_predict:
          type: integer
          description: Maximum number of tokens to generate
      additionalProperties: true
    Logprob:
      type: object
      description: Log probability information for a generated token
      properties:
        token:
          type: string
          description: The text representation of the token
        logprob:
          type: number
          description: The log probability of this token
        bytes:
          type: array
          items:
            type: integer
          description: The raw byte representation of the token
        top_logprobs:
          type: array
          items:
            $ref: '#/components/schemas/TokenLogprob'
          description: Most likely tokens and their log probabilities at this position
    TokenLogprob:
      type: object
      description: Log probability information for a single token alternative
      properties:
        token:
          type: string
          description: The text representation of the token
        logprob:
          type: number
          description: The log probability of this token
        bytes:
          type: array
          items:
            type: integer
          description: The raw byte representation of the token

````  > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Generate a chat message

> Generate the next chat message in a conversation between a user and an assistant.



## OpenAPI

````yaml /openapi.yaml post /api/chat
openapi: 3.1.0
info:
  title: Ollama API
  version: 0.1.0
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  description: |
    OpenAPI specification for the Ollama HTTP API
servers:
  - url: http://localhost:11434
    description: Ollama
security: []
paths:
  /api/chat:
    post:
      summary: Generate a chat message
      description: >-
        Generate the next chat message in a conversation between a user and an
        assistant.
      operationId: chat
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChatRequest'
      responses:
        '200':
          description: Chat response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatResponse'
              example:
                model: gemma3
                created_at: '2025-10-17T23:14:07.414671Z'
                message:
                  role: assistant
                  content: Hello! How can I help you today?
                done: true
                done_reason: stop
                total_duration: 174560334
                load_duration: 101397084
                prompt_eval_count: 11
                prompt_eval_duration: 13074791
                eval_count: 18
                eval_duration: 52479709
            application/x-ndjson:
              schema:
                $ref: '#/components/schemas/ChatStreamEvent'
      x-codeSamples:
        - lang: bash
          label: Default
          source: |
            curl http://localhost:11434/api/chat -d '{
              "model": "gemma3",
              "messages": [
                {
                  "role": "user",
                  "content": "why is the sky blue?"
                }
              ]
            }'
        - lang: bash
          label: Non-streaming
          source: |
            curl http://localhost:11434/api/chat -d '{
              "model": "gemma3",
              "messages": [
                {
                  "role": "user",
                  "content": "why is the sky blue?"
                }
              ],
              "stream": false
            }'
        - lang: bash
          label: Structured outputs
          source: >
            curl -X POST http://localhost:11434/api/chat -H "Content-Type:
            application/json" -d '{
              "model": "gemma3",
              "messages": [
                {
                  "role": "user",
                  "content": "What are the populations of the United States and Canada?"
                }
              ],
              "stream": false,
              "format": {
                "type": "object",
                "properties": {
                  "countries": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "country": {"type": "string"},
                        "population": {"type": "integer"}
                      },
                      "required": ["country", "population"]
                    }
                  }
                },
                "required": ["countries"]
              }
            }'
        - lang: bash
          label: Tool calling
          source: |
            curl http://localhost:11434/api/chat -d '{
              "model": "qwen3",
              "messages": [
                {
                  "role": "user",
                  "content": "What is the weather today in Paris?"
                }
              ],
              "stream": false,
              "tools": [
                {
                  "type": "function",
                  "function": {
                    "name": "get_current_weather",
                    "description": "Get the current weather for a location",
                    "parameters": {
                      "type": "object",
                      "properties": {
                        "location": {
                          "type": "string",
                          "description": "The location to get the weather for, e.g. San Francisco, CA"
                        },
                        "format": {
                          "type": "string",
                          "description": "The format to return the weather in, e.g. 'celsius' or 'fahrenheit'",
                          "enum": ["celsius", "fahrenheit"]
                        }
                      },
                      "required": ["location", "format"]
                    }
                  }
                }
              ]
            }'
        - lang: bash
          label: Thinking
          source: |
            curl http://localhost:11434/api/chat -d '{
              "model": "gpt-oss",
              "messages": [
                {
                  "role": "user",
                  "content": "What is 1+1?"
                }
              ],
              "think": "low"
            }'
        - lang: bash
          label: Images
          source: |
            curl http://localhost:11434/api/chat -d '{
              "model": "gemma3",
              "messages": [
                {
                  "role": "user",
                  "content": "What is in this image?",
                  "images": [
                    "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"
                  ]
                }
              ]
            }'
components:
  schemas:
    ChatRequest:
      type: object
      required:
        - model
        - messages
      properties:
        model:
          type: string
          description: Model name
        messages:
          type: array
          description: >-
            Chat history as an array of message objects (each with a role and
            content)
          items:
            $ref: '#/components/schemas/ChatMessage'
        tools:
          type: array
          description: Optional list of function tools the model may call during the chat
          items:
            $ref: '#/components/schemas/ToolDefinition'
        format:
          oneOf:
            - type: string
              enum:
                - json
            - type: object
          description: Format to return a response in. Can be `json` or a JSON schema
        options:
          $ref: '#/components/schemas/ModelOptions'
        stream:
          type: boolean
          default: true
        think:
          oneOf:
            - type: boolean
            - type: string
              enum:
                - high
                - medium
                - low
          description: >-
            When true, returns separate thinking output in addition to content.
            Can be a boolean (true/false) or a string ("high", "medium", "low")
            for supported models.
        keep_alive:
          oneOf:
            - type: string
            - type: number
          description: >-
            Model keep-alive duration (for example `5m` or `0` to unload
            immediately)
        logprobs:
          type: boolean
          description: Whether to return log probabilities of the output tokens
        top_logprobs:
          type: integer
          description: >-
            Number of most likely tokens to return at each token position when
            logprobs are enabled
    ChatResponse:
      type: object
      properties:
        model:
          type: string
          description: Model name used to generate this message
        created_at:
          type: string
          format: date-time
          description: Timestamp of response creation (ISO 8601)
        message:
          type: object
          properties:
            role:
              type: string
              enum:
                - assistant
              description: Always `assistant` for model responses
            content:
              type: string
              description: Assistant message text
            thinking:
              type: string
              description: Optional deliberate thinking trace when `think` is enabled
            tool_calls:
              type: array
              items:
                $ref: '#/components/schemas/ToolCall'
              description: Tool calls requested by the assistant
            images:
              type: array
              items:
                type: string
              description: Optional base64-encoded images in the response
        done:
          type: boolean
          description: Indicates whether the chat response has finished
        done_reason:
          type: string
          description: Reason the response finished
        total_duration:
          type: integer
          description: Total time spent generating in nanoseconds
        load_duration:
          type: integer
          description: Time spent loading the model in nanoseconds
        prompt_eval_count:
          type: integer
          description: Number of tokens in the prompt
        prompt_eval_duration:
          type: integer
          description: Time spent evaluating the prompt in nanoseconds
        eval_count:
          type: integer
          description: Number of tokens generated in the response
        eval_duration:
          type: integer
          description: Time spent generating tokens in nanoseconds
        logprobs:
          type: array
          items:
            $ref: '#/components/schemas/Logprob'
          description: >-
            Log probability information for the generated tokens when logprobs
            are enabled
    ChatStreamEvent:
      type: object
      properties:
        model:
          type: string
          description: Model name used for this stream event
        created_at:
          type: string
          format: date-time
          description: When this chunk was created (ISO 8601)
        message:
          type: object
          properties:
            role:
              type: string
              description: Role of the message for this chunk
            content:
              type: string
              description: Partial assistant message text
            thinking:
              type: string
              description: Partial thinking text when `think` is enabled
            tool_calls:
              type: array
              items:
                $ref: '#/components/schemas/ToolCall'
              description: Partial tool calls, if any
            images:
              type: array
              items:
                type: string
              description: Partial base64-encoded images, when present
        done:
          type: boolean
          description: True for the final event in the stream
    ChatMessage:
      type: object
      required:
        - role
        - content
      properties:
        role:
          type: string
          enum:
            - system
            - user
            - assistant
            - tool
          description: Author of the message.
        content:
          type: string
          description: Message text content
        images:
          type: array
          items:
            type: string
            description: Base64-encoded image content
          description: Optional list of inline images for multimodal models
        tool_calls:
          type: array
          items:
            $ref: '#/components/schemas/ToolCall'
          description: Tool call requests produced by the model
    ToolDefinition:
      type: object
      required:
        - type
        - function
      properties:
        type:
          type: string
          enum:
            - function
          description: Type of tool (always `function`)
        function:
          type: object
          required:
            - name
            - parameters
          properties:
            name:
              type: string
              description: Function name exposed to the model
            description:
              type: string
              description: Human-readable description of the function
            parameters:
              type: object
              description: JSON Schema for the function parameters
    ModelOptions:
      type: object
      description: Runtime options that control text generation
      properties:
        seed:
          type: integer
          description: Random seed used for reproducible outputs
        temperature:
          type: number
          format: float
          description: Controls randomness in generation (higher = more random)
        top_k:
          type: integer
          description: Limits next token selection to the K most likely
        top_p:
          type: number
          format: float
          description: Cumulative probability threshold for nucleus sampling
        min_p:
          type: number
          format: float
          description: Minimum probability threshold for token selection
        stop:
          oneOf:
            - type: string
            - type: array
              items:
                type: string
          description: Stop sequences that will halt generation
        num_ctx:
          type: integer
          description: Context length size (number of tokens)
        num_predict:
          type: integer
          description: Maximum number of tokens to generate
      additionalProperties: true
    ToolCall:
      type: object
      properties:
        function:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              description: Name of the function to call
            description:
              type: string
              description: What the function does
            arguments:
              type: object
              description: JSON object of arguments to pass to the function
    Logprob:
      type: object
      description: Log probability information for a generated token
      properties:
        token:
          type: string
          description: The text representation of the token
        logprob:
          type: number
          description: The log probability of this token
        bytes:
          type: array
          items:
            type: integer
          description: The raw byte representation of the token
        top_logprobs:
          type: array
          items:
            $ref: '#/components/schemas/TokenLogprob'
          description: Most likely tokens and their log probabilities at this position
    TokenLogprob:
      type: object
      description: Log probability information for a single token alternative
      properties:
        token:
          type: string
          description: The text representation of the token
        logprob:
          type: number
          description: The log probability of this token
        bytes:
          type: array
          items:
            type: integer
          description: The raw byte representation of the token

```` > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Generate embeddings

> Creates vector embeddings representing the input text



## OpenAPI

````yaml /openapi.yaml post /api/embed
openapi: 3.1.0
info:
  title: Ollama API
  version: 0.1.0
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  description: |
    OpenAPI specification for the Ollama HTTP API
servers:
  - url: http://localhost:11434
    description: Ollama
security: []
paths:
  /api/embed:
    post:
      summary: Generate embeddings
      description: Creates vector embeddings representing the input text
      operationId: embed
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EmbedRequest'
            example:
              model: embeddinggemma
              input: Generate embeddings for this text
      responses:
        '200':
          description: Vector embeddings for the input text
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmbedResponse'
              example:
                model: embeddinggemma
                embeddings:
                  - - 0.010071029
                    - -0.0017594862
                    - 0.05007221
                    - 0.04692972
                    - 0.054916814
                    - 0.008599704
                    - 0.105441414
                    - -0.025878139
                    - 0.12958129
                    - 0.031952348
                total_duration: 14143917
                load_duration: 1019500
                prompt_eval_count: 8
      x-codeSamples:
        - lang: bash
          label: Default
          source: |
            curl http://localhost:11434/api/embed -d '{
              "model": "embeddinggemma",
              "input": "Why is the sky blue?"
            }'
        - lang: bash
          label: Multiple inputs
          source: |
            curl http://localhost:11434/api/embed -d '{
              "model": "embeddinggemma",
              "input": [
                "Why is the sky blue?",
                "Why is the grass green?"
              ]
            }'
        - lang: bash
          label: Truncation
          source: |
            curl http://localhost:11434/api/embed -d '{
              "model": "embeddinggemma",
              "input": "Generate embeddings for this text",
              "truncate": true
            }'
        - lang: bash
          label: Dimensions
          source: |
            curl http://localhost:11434/api/embed -d '{
              "model": "embeddinggemma",
              "input": "Generate embeddings for this text",
              "dimensions": 128
            }'
components:
  schemas:
    EmbedRequest:
      type: object
      required:
        - model
        - input
      properties:
        model:
          type: string
          description: Model name
        input:
          oneOf:
            - type: string
            - type: array
              items:
                type: string
          description: Text or array of texts to generate embeddings for
        truncate:
          type: boolean
          default: true
          description: >-
            If true, truncate inputs that exceed the context window. If false,
            returns an error.
        dimensions:
          type: integer
          description: Number of dimensions to generate embeddings for
        keep_alive:
          type: string
          description: Model keep-alive duration
        options:
          $ref: '#/components/schemas/ModelOptions'
    EmbedResponse:
      type: object
      properties:
        model:
          type: string
          description: Model that produced the embeddings
        embeddings:
          type: array
          items:
            type: array
            items:
              type: number
          description: Array of vector embeddings
        total_duration:
          type: integer
          description: Total time spent generating in nanoseconds
        load_duration:
          type: integer
          description: Load time in nanoseconds
        prompt_eval_count:
          type: integer
          description: Number of input tokens processed to generate embeddings
    ModelOptions:
      type: object
      description: Runtime options that control text generation
      properties:
        seed:
          type: integer
          description: Random seed used for reproducible outputs
        temperature:
          type: number
          format: float
          description: Controls randomness in generation (higher = more random)
        top_k:
          type: integer
          description: Limits next token selection to the K most likely
        top_p:
          type: number
          format: float
          description: Cumulative probability threshold for nucleus sampling
        min_p:
          type: number
          format: float
          description: Minimum probability threshold for token selection
        stop:
          oneOf:
            - type: string
            - type: array
              items:
                type: string
          description: Stop sequences that will halt generation
        num_ctx:
          type: integer
          description: Context length size (number of tokens)
        num_predict:
          type: integer
          description: Maximum number of tokens to generate
      additionalProperties: true > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# List models

> Fetch a list of models and their details



## OpenAPI

````yaml /openapi.yaml get /api/tags
openapi: 3.1.0
info:
  title: Ollama API
  version: 0.1.0
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  description: |
    OpenAPI specification for the Ollama HTTP API
servers:
  - url: http://localhost:11434
    description: Ollama
security: []
paths:
  /api/tags:
    get:
      summary: List models
      description: Fetch a list of models and their details
      operationId: list
      responses:
        '200':
          description: List available models
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ListResponse'
              example:
                models:
                  - name: gemma3
                    model: gemma3
                    modified_at: '2025-10-03T23:34:03.409490317-07:00'
                    size: 3338801804
                    digest: >-
                      a2af6cc3eb7fa8be8504abaf9b04e88f17a119ec3f04a3addf55f92841195f5a
                    details:
                      format: gguf
                      family: gemma
                      families:
                        - gemma
                      parameter_size: 4.3B
                      quantization_level: Q4_K_M
      x-codeSamples:
        - lang: bash
          label: List models
          source: |
            curl http://localhost:11434/api/tags
components:
  schemas:
    ListResponse:
      type: object
      properties:
        models:
          type: array
          items:
            $ref: '#/components/schemas/ModelSummary'
    ModelSummary:
      type: object
      description: Summary information for a locally available model
      properties:
        name:
          type: string
          description: Model name
        model:
          type: string
          description: Model name
        remote_model:
          type: string
          description: Name of the upstream model, if the model is remote
        remote_host:
          type: string
          description: URL of the upstream Ollama host, if the model is remote
        modified_at:
          type: string
          description: Last modified timestamp in ISO 8601 format
        size:
          type: integer
          description: Total size of the model on disk in bytes
        digest:
          type: string
          description: SHA256 digest identifier of the model contents
        details:
          type: object
          description: Additional information about the model's format and family
          properties:
            format:
              type: string
              description: Model file format (for example `gguf`)
            family:
              type: string
              description: Primary model family (for example `llama`)
            families:
              type: array
              items:
                type: string
              description: All families the model belongs to, when applicable
            parameter_size:
              type: string
              description: Approximate parameter count label (for example `7B`, `13B`)
            quantization_level:
              type: string
              description: Quantization level used (for example `Q4_0`)

````

```` > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# List running models

> Retrieve a list of models that are currently running



## OpenAPI

````yaml /openapi.yaml get /api/ps
openapi: 3.1.0
info:
  title: Ollama API
  version: 0.1.0
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  description: |
    OpenAPI specification for the Ollama HTTP API
servers:
  - url: http://localhost:11434
    description: Ollama
security: []
paths:
  /api/ps:
    get:
      summary: List running models
      description: Retrieve a list of models that are currently running
      operationId: ps
      responses:
        '200':
          description: Models currently loaded into memory
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PsResponse'
              example:
                models:
                  - name: gemma3
                    model: gemma3
                    size: 6591830464
                    digest: >-
                      a2af6cc3eb7fa8be8504abaf9b04e88f17a119ec3f04a3addf55f92841195f5a
                    details:
                      parent_model: ''
                      format: gguf
                      family: gemma3
                      families:
                        - gemma3
                      parameter_size: 4.3B
                      quantization_level: Q4_K_M
                    expires_at: '2025-10-17T16:47:07.93355-07:00'
                    size_vram: 5333539264
                    context_length: 4096
      x-codeSamples:
        - lang: bash
          label: List running models
          source: |
            curl http://localhost:11434/api/ps
components:
  schemas:
    PsResponse:
      type: object
      properties:
        models:
          type: array
          items:
            $ref: '#/components/schemas/Ps'
          description: Currently running models
    Ps:
      type: object
      properties:
        name:
          type: string
          description: Name of the running model
        model:
          type: string
          description: Name of the running model
        size:
          type: integer
          description: Size of the model in bytes
        digest:
          type: string
          description: SHA256 digest of the model
        details:
          type: object
          description: Model details such as format and family
        expires_at:
          type: string
          description: Time when the model will be unloaded
        size_vram:
          type: integer
          description: VRAM usage in bytes
        context_length:
          type: integer
          description: Context length for the running model

```` > ## Documentation Index
> Fetch the complete documentation index at: https://docs.ollama.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Show model details



## OpenAPI

````yaml /openapi.yaml post /api/show
openapi: 3.1.0
info:
  title: Ollama API
  version: 0.1.0
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  description: |
    OpenAPI specification for the Ollama HTTP API
servers:
  - url: http://localhost:11434
    description: Ollama
security: []
paths:
  /api/show:
    post:
      summary: Show model details
      operationId: show
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ShowRequest'
            example:
              model: gemma3
      responses:
        '200':
          description: Model information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ShowResponse'
              example:
                parameters: |-
                  temperature 0.7
                  num_ctx 2048
                license: |-
                  Gemma Terms of Use 

                  Last modified: February 21, 2024...
                capabilities:
                  - completion
                  - vision
                modified_at: '2025-08-14T15:49:43.634137516-07:00'
                details:
                  parent_model: ''
                  format: gguf
                  family: gemma3
                  families:
                    - gemma3
                  parameter_size: 4.3B
                  quantization_level: Q4_K_M
                model_info:
                  gemma3.attention.head_count: 8
                  gemma3.attention.head_count_kv: 4
                  gemma3.attention.key_length: 256
                  gemma3.attention.sliding_window: 1024
                  gemma3.attention.value_length: 256
                  gemma3.block_count: 34
                  gemma3.context_length: 131072
                  gemma3.embedding_length: 2560
                  gemma3.feed_forward_length: 10240
                  gemma3.mm.tokens_per_image: 256
                  gemma3.vision.attention.head_count: 16
                  gemma3.vision.attention.layer_norm_epsilon: 0.000001
                  gemma3.vision.block_count: 27
                  gemma3.vision.embedding_length: 1152
                  gemma3.vision.feed_forward_length: 4304
                  gemma3.vision.image_size: 896
                  gemma3.vision.num_channels: 3
                  gemma3.vision.patch_size: 14
                  general.architecture: gemma3
                  general.file_type: 15
                  general.parameter_count: 4299915632
                  general.quantization_version: 2
                  tokenizer.ggml.add_bos_token: true
                  tokenizer.ggml.add_eos_token: false
                  tokenizer.ggml.add_padding_token: false
                  tokenizer.ggml.add_unknown_token: false
                  tokenizer.ggml.bos_token_id: 2
                  tokenizer.ggml.eos_token_id: 1
                  tokenizer.ggml.merges: null
                  tokenizer.ggml.model: llama
                  tokenizer.ggml.padding_token_id: 0
                  tokenizer.ggml.pre: default
                  tokenizer.ggml.scores: null
                  tokenizer.ggml.token_type: null
                  tokenizer.ggml.tokens: null
                  tokenizer.ggml.unknown_token_id: 3
      x-codeSamples:
        - lang: bash
          label: Default
          source: |
            curl http://localhost:11434/api/show -d '{
              "model": "gemma3"
            }'
        - lang: bash
          label: Verbose
          source: |
            curl http://localhost:11434/api/show -d '{
              "model": "gemma3",
              "verbose": true
            }'
components:
  schemas:
    ShowRequest:
      type: object
      required:
        - model
      properties:
        model:
          type: string
          description: Model name to show
        verbose:
          type: boolean
          description: If true, includes large verbose fields in the response.
    ShowResponse:
      type: object
      properties:
        parameters:
          type: string
          description: Model parameter settings serialized as text
        license:
          type: string
          description: The license of the model
        modified_at:
          type: string
          description: Last modified timestamp in ISO 8601 format
        details:
          type: object
          description: High-level model details
        template:
          type: string
          description: The template used by the model to render prompts
        capabilities:
          type: array
          items:
            type: string
          description: List of supported features
        model_info:
          type: object
          description: Additional model metadata

````
 