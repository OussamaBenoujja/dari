# @darna/core-config

Runtime helpers for reading `import.meta.env` (or `process.env` during tests) with sensible defaults so each app can consume the correct backend endpoints inside Dockerized deployments.

```js
import { getEnv, getApiBaseUrl } from '@darna/core-config'

const env = getEnv()
const apiUrl = getApiBaseUrl()
```
