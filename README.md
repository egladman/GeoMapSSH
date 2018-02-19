<h1 align="center">
  <a href="https://github.com/egladman/GeoMapSSH"><img src="docs/img/marker.svg" alt="GeoMapSSH" width="200"></a>
  <br>
  GeoMapSSH
  <br>
</h1>

<h4 align="center">View failed ssh attempts in real time</h4>

<br>

## Prerequistes

### Install Dependencies

Run the following commands:
```
nvm use
npm install
```

## How to use

### Simple

Run the following command:
```
npm start
```

### Advanced

When overwriting the default port it's currently necessary to update the value in `public/index.html`

```
npm start -- -l docs/example -p 3030
npm start -- --log docs/example --port 3030
```
