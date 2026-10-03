/* =========================================================
   病嬌指數 × 傲嬌指數|LOVE LAB 屬性鑑定特輯 — script.js
   純前端、零依賴、離線可用(娛樂用心理測驗)
   結構:題庫(questions.js)/ 等級 → 抽題引擎 →(Node 匯出)→ 瀏覽器 UI
   題庫規模:各 250 題,每回隨機抽出 QUIZ_LENGTH 題,跨場次避開最近出過的題目
   ========================================================= */

'use strict';

/* ---------- 抽題設定 ---------- */
const QUIZ_LENGTH = 15;        // 每回出題數
const RECENT_LIMIT = 75;       // localStorage 記住的最近出題 id 上限(約 5 場)
const LS_KEY = 'lovelab.recent.v1';

/* ---------- 選項與測驗基本資料 ----------
   兩個測驗皆採 5 選 1 同意度量表,計分方式完全一致:
   0 非常同意 / 1 同意 / 2 普通 / 3 不同意 / 4 非常不同意
   越同意 → 該屬性指數越高
------------------------------------------ */
const OPTION_LABELS = ['非常同意', '同意', '普通', '不同意', '非常不同意'];

const TEST_META = {
  yandere:  { name: '病嬌指數', no: '特集 01', glyph: '♥', theme: 'yandere' },
  tsundere: { name: '傲嬌指數', no: '特集 02', glyph: '❀', theme: 'tsundere' },
};

/* ---------- 等級設定(每個測驗 6 級,依 percent 由低到高,雜誌專欄口吻)---------- */
const LEVELS = {
  yandere: [
    {
      min: 0,
      name: '純情白紙級 🕊',
      text: '鑑定完畢:你的戀愛濃度接近蒸餾水,清澈、無雜質、零添加。對方已讀不回,你的結論是「大概在忙吧」,然後倒頭就睡,連吃醋都需要別人教。本專欄誠摯建議:偶爾在意一下也是情趣,你欠戀愛一點醋意。',
    },
    {
      min: 21,
      name: '微糖在意級 👀',
      text: '你在意的證據確鑿:那則動態你看了三遍,嘴上卻說「朋友而已嘛」。放心,這個濃度剛剛好——在意得含蓄,在乎得體面,屬於本誌最推薦的安全劑量,請放心繼續暗戀。',
    },
    {
      min: 41,
      name: '醋意釀造級 🍋',
      text: '表面波瀾不驚,內心的連續劇已經播到第二季完結篇。你的醋意正在穩定發酵,風味漸佳。溫馨提醒:醋要一點一點加,加過頭會蓋掉感情原本的味道,還會把主角薰跑。',
    },
    {
      min: 61,
      name: '濃縮佔有級 ⚠',
      text: '佔有慾濃度正式超標。對方所有社群的更新習慣你如數家珍,並堅持這叫「基本常識」。深呼吸——愛是信任,不是全天候衛星監控,雖然你真的很想裝一台。',
    },
    {
      min: 81,
      name: '糖漿淹沒級 💗',
      text: '你的愛已經釀成高濃度糖漿,甜到讓人逃不出手心。「世界上只剩我們兩個就好了」這種台詞你是真心說得出口。建議把這份執著拿去考研究所,上榜率百分之百。',
    },
    {
      min: 96,
      name: '病嬌殿堂級 👑',
      text: '恭喜登頂,你已是本誌鑑定史上的傳說。你的愛如颱風登陸,氣勢驚人、無處可躲,連編劇都想直接簽下你當主角。溫馨提醒:牽好手就夠了,不用把人藏起來——只要你今天心情好的話。',
    },
  ],
  tsundere: [
    {
      min: 0,
      name: '直球天使級 😇',
      text: '鑑定完畢:你的心思全寫在臉上,像自帶字幕,喜歡就說、感動就哭。傲嬌是什麼?能吃嗎?這種坦率在少女漫畫裡活不過第一集,卻是現實中的稀有物種,請務必珍惜。',
    },
    {
      min: 21,
      name: '微彆扭級 🗣',
      text: '你只是誠實,頂多說話直了一點。被稱讚時你會說「謝謝」,而不是「哼,你的眼光終於變好了」。本專欄建議:偶爾嘴硬一下,魅力值說不定直接加十分,不妨實驗看看。',
    },
    {
      min: 41,
      name: '嘴硬心軟級 🍬',
      text: '傲嬌的雛形確認出現!嘴上說「麻煩死了」,身體卻誠實地留了座位、帶了飲料。「我才沒有特意等你」的使用頻率正在穩定上升中,敬請持續觀察,預後良好。',
    },
    {
      min: 61,
      name: '本格傲嬌級 🎀',
      text: '經典場面天天上演:訊息打了又刪、刪了又打,最後只回一個「嗯」。你的心意像一顆洋蔥,需要剛好懂你的人來剝,不然對方只會被辣得眼淚直流,還不知道自己錯過什麼。',
    },
    {
      min: 81,
      name: '高段嘴硬級 🍑',
      text: '你的嘴硬已經練到爐火純青,連自己都騙得過:「我對他一點意思都沒有」,然後默默記住他全部的喜好。本專欄告訴你一個秘密:坦白從寬,搞不好對方等你這句話已經等了八百話。',
    },
    {
      min: 96,
      name: '傲嬌殿堂級 👑',
      text: '恭喜登頂,你就是傲嬌教科書本尊!「哼,別誤會了」是開場白,臉紅是必殺技,動畫製作組看到你會直接發主角合約。偷偷說:直球一下,你會發現世界突然變得超好攻略。',
    },
  ],
};

/* ---------- 題庫取得(瀏覽器由 questions.js 掛全域;Node 走 require)---------- */
function loadBank() {
  if (typeof QUESTION_BANK !== 'undefined') return QUESTION_BANK;
  if (typeof module !== 'undefined' && module.exports) {
    return require('./questions.js').QUESTION_BANK;
  }
  return { yandere: [], tsundere: [] };
}
const BANK = loadBank();

/* ---------- 計分 ----------
   answers:與本場題目等長的陣列,元素為所選選項索引(0–4)
   每題得分 = (4 - 所選索引) / 4 × 100
   總指數 = 本場全部題目平均後四捨五入 → 0–100
------------------------------------------ */
function calcPercent(answers) {
  const total = answers.length;
  if (!total) return 0;
  const sum = answers.reduce((acc, a) => acc + (4 - a), 0);
  return Math.round((sum / (4 * total)) * 100);
}

/* 依 percent 取得等級(LEVELS 各項 min 遞增,取最後一個 min ≤ percent 的項) */
function getLevel(testKey, percent) {
  const list = LEVELS[testKey];
  let result = list[0];
  for (const lv of list) {
    if (percent >= lv.min) result = lv;
  }
  return result;
}

/* ---------- 抽題引擎 ----------
   Fisher-Yates 洗牌(回傳新陣列,不改原題庫) */
function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* 讀取最近出過的題目 id(避免跨場次重複);讀不到就當作沒有紀錄 */
function getRecentIds(testKey) {
  try {
    if (typeof localStorage === 'undefined') return new Set();
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return new Set(raw[testKey] || []);
  } catch (err) {
    return new Set();
  }
}

/* 把本場出過的題目 id 併入紀錄,總量超過上限時保留最新的;寫入失敗靜默忽略 */
function pushRecentIds(testKey, ids) {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    const merged = Array.from(new Set([...(raw[testKey] || []), ...ids]));
    raw[testKey] = merged.slice(-RECENT_LIMIT);
    localStorage.setItem(LS_KEY, JSON.stringify(raw));
  } catch (err) {
    /* file:// 或隱私模式等情境拿不到 localStorage,退化為純隨機即可 */
  }
}

/* 抽出本場題目:優先避開最近出過的;可用的題目不足時再放行全部題庫 */
function drawQuestions(testKey, n) {
  const bank = BANK[testKey] || [];
  const recent = getRecentIds(testKey);
  let pool = bank.filter((q) => !recent.has(q.id));
  if (pool.length < n) pool = bank.slice();
  return shuffle(pool).slice(0, Math.min(n, bank.length));
}

/* ---------- 匯出(供 Node 單元測試使用;瀏覽器環境無作用)---------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPTION_LABELS, TEST_META, LEVELS, BANK,
    QUIZ_LENGTH, RECENT_LIMIT, LS_KEY,
    calcPercent, getLevel, shuffle, getRecentIds, pushRecentIds, drawQuestions,
  };
}

/* =========================================================
   瀏覽器 UI 邏輯(Node 環境會自動跳過這整段)
   ========================================================= */
if (typeof document !== 'undefined') {

  const $ = (sel) => document.querySelector(sel);

  const pages = document.querySelectorAll('.page');
  const particlesEl = $('#particles');

  const quizLabel = $('#quiz-label');
  const quizCounter = $('#quiz-counter');
  const quizBankNote = $('#quiz-bank-note');
  const progressBar = $('#progress-bar');
  const questionArea = $('#question-area');
  const questionText = $('#question-text');
  const optionsEl = $('#options');
  const btnPrev = $('#btn-prev');

  const resultEyebrow = $('#result-eyebrow');
  const resultLabel = $('#result-label');
  const resultPercent = $('#result-percent');
  const scaleMarker = $('#scale-marker');
  const resultStamp = $('#result-stamp');
  const resultLevel = $('#result-level');
  const resultColumn = document.querySelector('.column');
  const resultDiagnosis = $('#result-diagnosis');
  const resultSample = $('#result-sample');

  /* 測驗狀態:session 為本場抽出的題目、index 為目前題號(0 起)、answers 紀錄每題所選索引 */
  const state = { testKey: null, session: [], index: 0, answers: [], advancing: false };

  let stampTimer = null;
  let columnTimer = null;

  /* ---------- 主題與粒子背景 ---------- */
  const PARTICLES = {
    home:     ['♥', '❀', '♪', '✧'],
    yandere:  ['♥', '❀', '✧'],
    tsundere: ['❀', '♪', '✧'],
  };

  function setTheme(theme) {
    document.body.className = 'theme-' + theme;
    initParticles(theme);
  }

  function initParticles(theme) {
    const set = PARTICLES[theme] || PARTICLES.home;
    particlesEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.textContent = set[i % set.length];
      p.style.left = (6 + Math.random() * 88) + '%';
      p.style.fontSize = (11 + Math.random() * 12) + 'px';
      p.style.animationDuration = (16 + Math.random() * 14) + 's';
      p.style.animationDelay = (-Math.random() * 30) + 's'; // 負延遲讓符號一開場就散布在畫面各處
      p.style.opacity = (0.05 + Math.random() * 0.08).toFixed(2); // 極淡,不搶版面
      particlesEl.appendChild(p);
    }
  }

  /* ---------- 頁面切換 ---------- */
  function showPage(id) {
    pages.forEach((p) => p.classList.toggle('active', p.id === id));
    window.scrollTo(0, 0);
  }

  /* ---------- 測驗流程 ---------- */
  function startTest(key) {
    state.testKey = key;
    state.session = drawQuestions(key, QUIZ_LENGTH);
    state.index = 0;
    state.answers = [];
    state.advancing = false;
    setTheme(TEST_META[key].theme);
    renderQuestion('forward');
    showPage('page-quiz');
  }

  /* 渲染目前題目(direction:'forward' 從右滑入,'back' 從左滑入) */
  function renderQuestion(direction) {
    const total = state.session.length;
    const meta = TEST_META[state.testKey];

    quizLabel.textContent = meta.no + '・' + meta.name;
    quizCounter.textContent = 'Q' + String(state.index + 1).padStart(2, '0') + ' / Q' + String(total).padStart(2, '0');
    quizBankNote.textContent = '本回目・從 ' + BANK[state.testKey].length + ' 題題庫隨機抽出';
    progressBar.style.width = (state.index / total) * 100 + '%';

    questionText.textContent = state.session[state.index].text;

    optionsEl.innerHTML = '';
    OPTION_LABELS.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';

      const key = document.createElement('span');
      key.className = 'option-key';
      key.textContent = String.fromCharCode(65 + i); // A B C D E

      const txt = document.createElement('span');
      txt.textContent = label;

      btn.appendChild(key);
      btn.appendChild(txt);
      if (state.answers[state.index] === i) btn.classList.add('selected');
      btn.addEventListener('click', () => selectOption(i));
      optionsEl.appendChild(btn);
    });

    btnPrev.disabled = state.index === 0;

    // 轉場:移除動畫類別 → 強制重繪 → 重新加上,讓動畫每次都重播
    questionArea.classList.remove('q-in', 'q-in-back');
    void questionArea.offsetWidth;
    questionArea.classList.add(direction === 'back' ? 'q-in-back' : 'q-in');
  }

  /* 選答:標記選項 → 進度條推進 → 短暫停留後自動前進 */
  function selectOption(i) {
    if (state.advancing) return;
    state.advancing = true;
    state.answers[state.index] = i;

    Array.prototype.forEach.call(optionsEl.children, (btn, bi) => {
      btn.classList.toggle('selected', bi === i);
    });

    const total = state.session.length;
    progressBar.style.width = ((state.index + 1) / total) * 100 + '%';

    setTimeout(() => {
      state.advancing = false;
      if (state.index < total - 1) {
        state.index += 1;
        renderQuestion('forward');
      } else {
        showResult();
      }
    }, 420);
  }

  /* 回上一題(第一題時按鈕為 disabled) */
  function goPrev() {
    if (state.advancing || state.index === 0) return;
    state.index -= 1;
    renderQuestion('back');
  }

  /* ---------- 結果頁 ---------- */
  function showResult() {
    const meta = TEST_META[state.testKey];
    const percent = calcPercent(state.answers);
    const level = getLevel(state.testKey, percent);

    // 本場結束:記下出過的題目 id,之後的場次優先避開
    pushRecentIds(state.testKey, state.session.map((q) => q.id));

    // 清掉上一輪的定時器,避免快速重測時舊動畫干擾
    clearTimeout(stampTimer);
    clearTimeout(columnTimer);

    setTheme(meta.theme);
    resultEyebrow.textContent = '― ' + meta.no + ' 鑑定結果 ―';
    resultLabel.textContent = '你的' + meta.name + '為';

    // 百分比數字歸零,準備跳動
    resultPercent.textContent = '0';

    // 刻度尺指針:先瞬間歸零 → 強制重繪 → 再過渡到目標值
    scaleMarker.style.transition = 'none';
    scaleMarker.style.left = '0%';
    void scaleMarker.getBoundingClientRect();
    scaleMarker.style.transition = '';
    requestAnimationFrame(() => {
      scaleMarker.style.left = percent + '%';
    });

    // 判定標籤與鑑定文先隱藏,依時間軸依序登場
    resultStamp.classList.remove('show');
    resultColumn.classList.remove('show');
    resultLevel.textContent = '';
    resultDiagnosis.textContent = '';
    resultSample.textContent = '';
    void resultStamp.offsetWidth;

    showPage('page-result');
    animateCountUp(resultPercent, percent, 1400);

    stampTimer = setTimeout(() => {
      resultLevel.textContent = '判定:' + level.name;
      resultStamp.classList.add('show');
    }, 1000);

    columnTimer = setTimeout(() => {
      resultDiagnosis.textContent = level.text;
      resultSample.textContent = '本回樣本:' + state.session.length + ' 題(題庫總數 ' + BANK[state.testKey].length + ' 題・每回隨機出卷)';
      resultColumn.classList.add('show');
    }, 1300);
  }

  /* 百分比數字 0 → target 跳動(easeOutCubic) */
  function animateCountUp(el, target, duration) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 事件綁定 ---------- */
  document.querySelectorAll('.feature').forEach((card) => {
    card.addEventListener('click', () => startTest(card.dataset.test));
  });

  $('#btn-back-home').addEventListener('click', () => {
    setTheme('home');
    showPage('page-home');
  });

  btnPrev.addEventListener('click', goPrev);

  $('#btn-retry').addEventListener('click', () => startTest(state.testKey));

  $('#btn-other').addEventListener('click', () => {
    startTest(state.testKey === 'yandere' ? 'tsundere' : 'yandere');
  });

  $('#btn-home').addEventListener('click', () => {
    setTheme('home');
    showPage('page-home');
  });

  /* ---------- 初始化 ---------- */
  setTheme('home');

  // 刊頭右側放上今天日期,雜誌發行感
  (function setIssueDate() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    $('#issue-date').textContent =
      now.getFullYear() + '.' + pad(now.getMonth() + 1) + '.' + pad(now.getDate()) + ' VOL.01';
  })();

  /* 測試輔助 API(方便自動化驗證與快速作答) */
  window.__quiz = {
    state,
    startTest,
    selectOption,
    showResult,
    goPrev,
    calcPercent,
    getLevel,
    drawQuestions,
    getRecentIds,
    pushRecentIds,
  };
}
