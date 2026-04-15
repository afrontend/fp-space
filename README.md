# fp-space [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> library for fp-space-game

## Installation

```sh
$ npm install --save fp-space
```

## Usage

```js
const fpSpace = require('fp-space');

fpSpace('Rainbow');
```
## Demo GIF 업데이트

터미널 동작 미리보기를 자동으로 재생성합니다.

```sh
# 의존 도구 설치 (최초 1회)
brew install asciinema
brew install agg
brew install gh && gh auth login

# 데모 생성 및 GitHub Releases 업로드
npm run release
```

`npm run release` 실행 순서:

1. `scripts/autoplay.js` — AI가 게임을 자동 플레이하고 자동 종료
2. `asciinema rec` — 터미널 출력을 `demo.cast`로 녹화
3. `agg` — `demo.cast` → `demo.gif` 변환
4. `gh release upload` — GitHub Releases `demo-assets` 태그에 업로드
5. `README.md` — GIF URL을 GitHub Releases 경로로 교체

master 브랜치에 푸시하면 `.github/workflows/demo.yml`이 위 과정을 자동으로 실행합니다.

## License

MIT © [Bob Hwang](https://afrontend.github.io)


[npm-image]: https://badge.fury.io/js/fp-space.svg
[npm-url]: https://npmjs.org/package/fp-space
[travis-image]: https://travis-ci.org/afrontend/fp-space.svg?branch=master
[travis-url]: https://travis-ci.org/afrontend/fp-space
[daviddm-image]: https://david-dm.org/afrontend/fp-space.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/afrontend/fp-space
[coveralls-image]: https://coveralls.io/repos/afrontend/fp-space/badge.svg
[coveralls-url]: https://coveralls.io/r/afrontend/fp-space
