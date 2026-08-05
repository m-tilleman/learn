// Run: node --test src/lib/fsrs6.test.mjs
// Self-contained JS port of fsrs6.ts for testing without a TS build step.
import { test } from "node:test";
import assert from "node:assert/strict";

const W = [0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542];
const clampD = (d) => Math.min(Math.max(d, 1), 10);
const DAY = 86400000;

function make(rr = 0.9) {
  const retr = (t, s) => { const d = -W[20]; const f = Math.pow(0.9, 1/d) - 1; return Math.pow(1 + f*(t/s), d); };
  const ni = (s) => { const d = -W[20]; const f = Math.pow(0.9, 1/d) - 1; return Math.min(Math.max(Math.round((s/f)*(Math.pow(rr,1/d)-1)),1),36500); };
  const id = (g) => clampD(W[4] - Math.exp(W[5]*(g-1)) + 1);
  const nd = (d,g) => clampD(W[7]*id(4) + (1-W[7])*(d + (-W[6]*(g-3))*(10-d)/9));
  const sar = (d,s,r,g) => s*(1 + Math.exp(W[8])*(11-d)*Math.pow(s,-W[9])*(Math.exp(W[10]*(1-r))-1)*(g===2?W[15]:1)*(g===4?W[16]:1));
  const sal = (d,s,r) => W[11]*Math.pow(d,-W[12])*(Math.pow(s+1,W[13])-1)*Math.exp(W[14]*(1-r));
  function review(prev, g, now = new Date()) {
    if (!prev || !prev.lastReview) {
      const s = W[g-1]; return { stability: s, difficulty: id(g), due: new Date(now.getTime()+ (g===1?0:ni(s))*DAY), lastReview: now, reps: 1, lapses: g===1?1:0, state: g===1?"learning":"review" };
    }
    const ed = Math.max((now - prev.lastReview)/DAY, 0);
    const r = retr(ed, prev.stability);
    const s = g===1 ? sal(prev.difficulty, prev.stability, r) : sar(prev.difficulty, prev.stability, r, g);
    return { stability: s, difficulty: nd(prev.difficulty, g), due: new Date(now.getTime()+ni(s)*DAY), lastReview: now, reps: prev.reps+1, lapses: prev.lapses+(g===1?1:0), state: g===1?"relearning":"review" };
  }
  return { retr, ni, review };
}

test("R(S,S) equals 0.90 (forgetting curve anchor)", () => {
  const f = make();
  assert.ok(Math.abs(f.retr(10, 10) - 0.9) < 1e-9);
});

test("initial stability after first Good equals w[2]", () => {
  const f = make();
  const st = f.review(null, 3);
  assert.ok(Math.abs(st.stability - W[2]) < 1e-9);
});

test("stability grows on successful review", () => {
  const f = make();
  let st = f.review(null, 3);
  const before = st.stability;
  st = f.review(st, 3, new Date(st.due));
  assert.ok(st.stability > before);
});

test("lapse collapses stability", () => {
  const f = make();
  let st = f.review(null, 3);
  st = f.review(st, 3, new Date(st.due));
  const before = st.stability;
  st = f.review(st, 1, new Date(st.due));
  assert.ok(st.stability < before);
  assert.equal(st.lapses, 1);
});

test("higher target retention yields shorter intervals", () => {
  assert.ok(make(0.97).ni(50) < make(0.9).ni(50));
});
