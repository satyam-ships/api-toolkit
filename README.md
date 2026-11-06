# api-toolkit 🧰

> One CLI for the boring-but-critical API chores: **lint your OpenAPI spec**, **audit security headers**, **probe latency**. Zero dependencies.

```bash
api-toolkit validate openapi.json     # lint spec: missing responses, duplicate operationIds, undeclared path params, no auth
api-toolkit security https://api.example.com   # HSTS, CSP, CORS *, version leaks
api-toolkit test https://api.example.com/health # min / median / max latency, failures
```

Example:
```
$ api-toolkit validate examples/openapi.json
⚠ POST /orders: no requestBody
⚠ GET /orders/{id}: no security requirement
...
0 errors, 3 warnings
```

## CI
Each command exits non-zero on errors:
```yaml
- run: npx api-toolkit validate openapi.json
```

## Roadmap
- [ ] YAML specs
- [ ] `mock` server from spec
- [ ] `generate` client stubs
- [ ] `docs` static HTML
- [ ] Contract testing against live API

## License
[MIT](LICENSE)
