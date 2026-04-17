# fp-space [![NPM version][npm-image]][npm-url] [![Build Status][actions-image]][actions-url]

> A functional space shooter game library

![Demo](https://github.com/afrontend/fp-space/releases/download/demo-assets/demo.gif)

## Just run

```sh
npx fp-space
```

Use `--full` to fill the entire terminal window:

```sh
npx fp-space --full
```

## Run with source

```sh
git clone https://github.com/afrontend/fp-space.git
cd fp-space
npm install
npm start
```

### CLI options

| Option | Description |
|--------|-------------|
| `-f, --full` | Use full terminal size for the board |

## Controls

| Key | Action |
|-----|--------|
| `←` `→` | Move shuttle left / right |
| `↑` | Fire missile |
| `Space` | Pause / resume |
| `q` / `Ctrl+C` | Quit |

## Library API

Install as a dependency:

```sh
npm install fp-space
```

```js
const game = require('fp-space');
```

### `game.init(rows?, columns?)`

Creates the initial game state. Defaults to a 15×15 grid.

```js
let state = game.init(15, 15);
```

### `game.tick(state)`

Advances the game by one frame. Moves missiles up every tick; moves the meteorite down every 3rd tick. Detects collisions. Returns updated state.

```js
state = game.tick(state);
```

### `game.key(keyName, state)`

Applies a key input. Valid key names: `'left'`, `'right'`, `'up'`, `'space'`.
Returns updated state.

```js
state = game.key('left', state);
```

### `game.join(state)`

Merges all panels into a single 2D array for rendering.

```js
const grid = game.join(state);
grid.forEach(row => {
  console.log(row.map(item => game.isBlank(item) ? '.' : '■').join(' '));
});
```

### `game.isBlank(item)`

Returns `true` if a cell is empty.

### Minimal example

```js
const game = require('fp-space');

let state = game.init(15, 15);

setInterval(() => {
  state = game.tick(state);
  const grid = game.join(state);
  console.clear();
  console.log(grid.map(row =>
    row.map(item => game.isBlank(item) ? '.' : '■').join(' ')
  ).join('\n'));
}, 200);
```

## Demo GIF 업데이트

터미널 동작 미리보기를 자동으로 재생성합니다.

```sh
# 의존 도구 설치 (최초 1회)
brew install asciinema
brew install agg
brew install gh && gh auth login

# 데모 생성 및 GitHub Releases 업로드
npm run demo-gif
```

`npm run demo-gif` 실행 순서:

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
[actions-image]: https://github.com/afrontend/fp-space/actions/workflows/demo.yml/badge.svg
[actions-url]: https://github.com/afrontend/fp-space/actions/workflows/demo.yml
