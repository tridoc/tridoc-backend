# tridoc

## Run "live"

Use the vscode-devcontainer: this will start tridoc and fuseki.

It will use TRIDOC_PWD = "pw123".
Access tridoc from http://localhost:8000 and fuseki from http://localhost:8001

## Tips & Tricks

- Upload Backups with
```sh
curl -D - -X PUT --data-binary @tridoc_backup_sumthing.zip -H "content-Type: application/zip" -u tridoc:pw123 http://localhost:8000/raw/zip
```
