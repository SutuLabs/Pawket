# Pawket (Developer)

<h2 align="center">
<a href="https://info.pawket.app/">
<img src="https://info.pawket.app/images/site-navigation/logo.svg" width="200">
</a>
&
<a href="https://mixch.dev/">
<img src="https://mixch.dev/img/mixch.b0cbbcbf.svg" width="200">
</a>
</h2>

Here is the mono-repo for [Pawket](https://pawket.app/)/Extension/[Mixch](https://mixch.dev/img/mixch.b0cbbcbf.svg)/[Wallet CLI](https://github.com/SutuLabs/Pawket/releases)

Pawket is a comprehensive software that supporting the Chia eco-system, including wallet, developer tool, command line, extension and so on.

The [iOS](https://testflight.apple.com/join/GWcIleEy) testflight and [Android](https://github.com/SutuLabs/Pawket/releases) version is also available.

NOTE: The Github repo is mirrored periodically from Azure DevOps.

## Development

```sh
yarn install
```

### Compiles and hot-reloads for development

```sh
yarn serve # for Pawket
yarn serve:mixch # for Mixch
yarn serve-ext # for Extension
cd server && yarn serve # for Wallet CLI
```

### Compiles and minifies for production
```sh
yarn build:pawket # for Pawket
yarn build:mixch # for Mixch
yarn build-ext # for Extension
yarn build:server # for Wallet CLI
```

### Tests
```sh
yarn test
```

## Contribution

Your contribution is welcome by opening new Issue/PR.

## License

GPL-3.0