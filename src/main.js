import './styles/global.css';
import { S } from './lib/storage.js';
import { state, app, render } from './app.js';

(async () => {
  render(); // show splash immediately
  await new Promise((r) => setTimeout(r, 1100));

  const u = S.get('user');
  if (u) {
    state.user = { reminders: {}, ...u };
    app._loadToday();
    state.stage = 'app';
  } else {
    state.stage = 'auth';
  }
  render();
})();
