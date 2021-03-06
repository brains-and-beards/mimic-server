# Mimic Server

## Install

`yarn install`

## Run server and watch for configuration changes

`yarn watch`

## Generate a self-signed certificate for serving SSL requests

Running an HTTPS server requires a UNIX-compatible system with
[openssl](https://www.openssl.org/) installed.

- Run `yarn generate-cert`. This will create a certificate-key pair in the
  project directory. (The files will be called `localhost.crt` and
  `localhost.key`, respectively).
- Mark the generated certificate as locally trusted (for example, on Mac OS X,
  add it to keychain and update "trust" preferences).
- The server should now support SSL on port 3001, or a custom `httpsPort`
  specified in the config file (apimocker.json).

## Tests

You can run all the project's unit test suites with `yarn test`.
