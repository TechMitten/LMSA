# LLM Context

`GET` `/v1/llm/context`

Pre-extracted web content optimized for AI agents, LLM grounding, and RAG pipelines. Use this API to get the context for your LLM or AI agent.

**Base URL:** `https://api.search.brave.com/res`

## Authorization

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `x-subscription-token` | header | string | Yes | The subscription token that was generated for the product. |

## Query Parameters

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `q` | query | string | Yes | The user's search query term. Query can not be empty. Maximum of 400 characters and 50 words in the query. |
| `country` | query | string | No | The search query country, where the results come from. The country string is limited to 2 character country codes of supported countries. |
| `search_lang` | query | string | No | The search language preference. The 2 or more character language code for which the search results are provided. |
| `count` | query | integer | No | The maximum number of search results considered to select the LLM context data. The default is 20 and the maximum is 50. |
| `spellcheck` | query | boolean | No | Whether to enable spellcheck on the query. |
| `maximum_number_of_urls` | query | integer | No | Maximum number of different URLs to include in LLM context. |
| `maximum_number_of_tokens` | query | integer | No | Approximate maximum number of tokens to include in context. The default is `8192` and maximum is `32768`. |
| `maximum_number_of_snippets` | query | integer | No | Maximum number of different snippets (or chunks of text) to include in LLM context. The default is `50` and maximum is `256`. |
| `context_threshold_mode` | query | string | No | The mode to use to determine the threshold for including content in context. Default is `balanced`. |
| `maximum_number_of_tokens_per_url` | query | integer | No | Maximum number of tokens to include per URL. The default is `4096` and maximum is `8192`. |
| `maximum_number_of_snippets_per_url` | query | integer | No | Maximum number of snippets to include per URL. The default is `50` and maximum is `100`. |
| `goggles` | query | string | No | The goggle url or definition to rerank search results. |
| `freshness` | query | string | No | Filters search results by page age. The age of a page is determined by the most relevant date reported by the content, such as its published or last modified date. The following values are supported: - **pd** - Pages aged 24 hours or less. - **pw** - Pages aged 7 days or less. - **pm** - Pages aged 31 days or less. - **py** - Pages aged 365 days or less. - **YYYY-MM-DDtoYYYY-MM-DD** - A custom date range is also supported by specifying start and end dates e.g. `2022-04-01to2022-07-30`. |
| `enable_local` | query | string | No | Whether to enable local recall. Not setting this value means auto-detect and uses local recall if any of the localization headers are provided. |
| `enable_source_metadata` | query | boolean | No | Enable source metadata enrichment (site_name, favicon, thumbnail) in the sources attribute of the response. |

## Headers

| Name | Location | Type | Required | Description |
|------|----------|------|----------|-------------|
| `x-loc-lat` | header | string | No | The latitude of the client's geographical location in degrees,                 to provide relevant local results. The latitude must be greater                 than or equal to -90.0 degrees and less than or equal to +90.0 degrees. |
| `x-loc-long` | header | string | No | The longitude of the client's geographical location in degrees,                 to provide relevant local results. The longitude must be greater                 than or equal to -180.0 and less than or equal to +180.0 degrees. |
| `x-loc-city` | header | string | No | The generic name of the client city |
| `x-loc-state` | header | string | No | A code which could be up to three characters, that represent the client's state/region.                 The region is the first-level subdivision (the broadest or least specific) of the                 <a href="https://en.wikipedia.org/wiki/ISO_3166-2">ISO 3166-2</a> code. |
| `x-loc-state-name` | header | string | No | The name of the client's state/region.                 The region is the first-level subdivision (the broadest or least specific) of the                 <a href="https://en.wikipedia.org/wiki/ISO_3166-2">ISO 3166-2</a> code. |
| `x-loc-country` | header | string | No | The two letter country code for the client's country.                 For a list of country codes,                 see <a href="https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2">ISO 3166-1 alpha-2</a> |
| `x-loc-postal-code` | header | string | No | The client's postal code |
| `api-version` | header | string | No | The API version to use.                 This is denoted by the format `YYYY-MM-DD`.                 Default is the latest that is available. Read                 more about [API versioning](/documentation/guides/versioning). |
| `accept` | header | string | No | The default supported media type is application/json. |
| `cache-control` | header | string | No | Brave Search will return cached content by default.                 To prevent caching set the Cache-Control header to `no-cache`.                 This is currently done as best effort. |
| `user-agent` | header | string | No | The user agent originating the request.                 Brave search can utilize the user agent to provide a different                 experience depending on the device as described by the string.                 The user agent should follow the commonly used browser agent                 strings on each platform. For more information on curating user agents,                 see [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-user-agent). |

## Responses

### 200
Successful Response

| Field | Type | Description |
|-------|------|-------------|
| `grounding` | object? | Container for all LLM context content by type. |
| `grounding.generic` | object[]? | Array of LLM context items with extracted web content. |
| `grounding.generic[].url` | string? | The source URL. |
| `grounding.generic[].title` | string? | The page title. |
| `grounding.generic[].snippets` | string[]? | Extracted text chunks from the page that are picked for their relevance to the query. |
| `grounding.poi` | object? | Point of interest data. When `enable_local` is enabled, the response may include POI data. |
| `grounding.poi.name` | string? | The name of the point of interest. |
| `grounding.poi.url` | string? | The URL of the point of interest. |
| `grounding.poi.title` | string? | The title of the point of interest. |
| `grounding.poi.snippets` | string[]? | The snippets about the point of interest. |
| `grounding.map` | object[]? | Map/place results. When `enable_local` is enabled, the response may include map data. |
| `grounding.map[].name` | string? | The name of the place. |
| `grounding.map[].url` | string? | The URL of the place. |
| `grounding.map[].title` | string? | The title of the place. |
| `grounding.map[].snippets` | string[]? | The snippets about the place. |
| `sources` | object? | Metadata for all referenced URLs, keyed by URL. |

### 400
Bad Request

| Field | Type | Description |
|-------|------|-------------|
| `type` | string? |  |
| `error` | object |  |
| `error.id` | string | A unique identifier for this particular occurrence of the problem. |
| `error.status` | int | The HTTP status code applicable to this problem, expressed as a string value. |
| `error.detail` | string? | Explanation specific to this occurrence of the problem. Like title, this field's value can be localized. |
| `error.meta` | object? | A meta object containing non-standard meta-information about the error. |
| `error.code` | string | An application-specific error code, expressed as a string value. |
| `time` | int? |  |

### 403
Forbidden

| Field | Type | Description |
|-------|------|-------------|
| `type` | string? |  |
| `error` | object |  |
| `error.id` | string | A unique identifier for this particular occurrence of the problem. |
| `error.status` | int | The HTTP status code applicable to this problem, expressed as a string value. |
| `error.detail` | string? | Explanation specific to this occurrence of the problem. Like title, this field's value can be localized. |
| `error.meta` | object? | A meta object containing non-standard meta-information about the error. |
| `error.code` | string | An application-specific error code, expressed as a string value. |
| `time` | int? |  |

### 404
Not Found

| Field | Type | Description |
|-------|------|-------------|
| `type` | string? |  |
| `error` | object |  |
| `error.id` | string | A unique identifier for this particular occurrence of the problem. |
| `error.status` | int | The HTTP status code applicable to this problem, expressed as a string value. |
| `error.detail` | string? | Explanation specific to this occurrence of the problem. Like title, this field's value can be localized. |
| `error.meta` | object? | A meta object containing non-standard meta-information about the error. |
| `error.code` | string | An application-specific error code, expressed as a string value. |
| `time` | int? |  |

### 422
Unprocessable Entity

| Field | Type | Description |
|-------|------|-------------|
| `type` | string? |  |
| `error` | object |  |
| `error.id` | string | A unique identifier for this particular occurrence of the problem. |
| `error.status` | int | The HTTP status code applicable to this problem, expressed as a string value. |
| `error.detail` | string? | Explanation specific to this occurrence of the problem. Like title, this field's value can be localized. |
| `error.meta` | object? | A meta object containing non-standard meta-information about the error. |
| `error.code` | string | An application-specific error code, expressed as a string value. |
| `time` | int? |  |

### 429
Too Many Requests

| Field | Type | Description |
|-------|------|-------------|
| `type` | string? |  |
| `error` | object |  |
| `error.id` | string | A unique identifier for this particular occurrence of the problem. |
| `error.status` | int | The HTTP status code applicable to this problem, expressed as a string value. |
| `error.detail` | string? | Explanation specific to this occurrence of the problem. Like title, this field's value can be localized. |
| `error.meta` | object? | A meta object containing non-standard meta-information about the error. |
| `error.code` | string | An application-specific error code, expressed as a string value. |
| `time` | int? |  |

## Code Samples

### cURL

```bash
curl "https://api.search.brave.com/res/v1/llm/context?q=how+deep+is+the+mediterranean+sea" \
  -H "Accept: application/json" \ 
  -H "Accept-Encoding: gzip" \ 
  -H "X-Subscription-Token: <YOUR_API_KEY>"
```

### Python

```python
import requests

url = "https://api.search.brave.com/res/v1/llm/context"

params = {
    "q": "how deep is the mediterranean sea"
}

headers = {
    "Accept": "application/json",
    "Accept-Encoding": "gzip",
    "X-Subscription-Token": "<YOUR_API_KEY>"
}

response = requests.get(url, params=params, headers=headers)
print(response.json())
```