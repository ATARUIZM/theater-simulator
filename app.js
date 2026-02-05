
// =========================
// 映画館ごとの設定
// =========================

const PLANS_TOHO = [
    {
    id: "none",
    name: "会員にならない場合",
    annualFee: 0,
    pointRule: "none",
    pointsPer100Yen: 0,
    pointsPerMovie: 0,
    pointsPerFree: Infinity
    },
    {
    id: "tohoOneStd",
    name: "TOHO ONE スタンダード",
    annualFee: 500,
    pointRule: "perYen", // レジ1会計ごとに100円あたり2P
    pointsPer100Yen: 2,
    pointsPerMovie: 0,
    pointsPerFree: 240
    },
    {
    id: "tohoOnePremium",
    name: "TOHO ONE プレミアム",
    annualFee: 3000,
    pointRule: "perYen",
    pointsPer100Yen: 2,
    pointsPerMovie: 0,
    pointsPerFree: 240
    },
    {
    id: "oldToho",
    name: "旧TOHOシネマズ会員サービス",
    annualFee: 300,
    pointRule: "perMovie", // 映画1回鑑賞ごとに1P
    pointsPer100Yen: 0,
    pointsPerMovie: 1,
    pointsPerFree: 6
    }
];

const PLANS_109 = [
    {
    id: "none",
    name: "会員にならない場合",
    annualFee: 0,
    pointRule: "none",
    pointsPer100Yen: 0,
    pointsPerMovie: 0,
    pointsPerFree: Infinity
    },
    {
    id: "cinema109",
    name: "109シネマズ シネマポイントカード",
    // 実際は入会金1,000円・年会費無料だが、
    // ここでは1年分のシミュレーションとして1,000円を年会費相当で計上
    annualFee: 500,
    pointRule: "perMovie", // 映画1回鑑賞ごとに1P
    pointsPer100Yen: 0,
    pointsPerMovie: 1,
    pointsPerFree: 6
    }
];

const BRAND_CONFIGS = {
    toho: {
    name: "TOHOシネマズ",
    defaults: {
        priceNormal: 2000,
        priceLate: 1500,
        priceService: 1300,
        priceIMAX: 600,
        concessionAmount: 860,
        goodsAmount: 1000
    },
    plans: PLANS_TOHO
    },
    cinema109: {
    name: "109シネマズ",
    defaults: {
        // ベースは2D一般1,900円 + IMAX追加700円などを想定
        priceNormal: 2000,
        priceLate: 1500,
        priceService: 1300,
        priceIMAX: 700,
        concessionAmount: 1000,
        goodsAmount: 1000
    },
    plans: PLANS_109
    }
};

// =========================
// 初期化
// =========================

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initScrollAnimations();
    initLivePreview();
    initInputAnimations();

    // 初期表示時にTOHOデフォルトをセット
    applyBrandDefaults(getSelectedBrand());

    // 初回のリアルタイム計算
    setTimeout(updateLivePreview, 100);
});

// =========================
// パーティクル背景
// =========================

function initParticles() {
    const container = document.createElement('div');
    container.className = 'particles';
    document.body.appendChild(container);

    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        createParticle(container, i);
    }
}

function createParticle(container, index) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const colors = ['#6366f1', '#f59e0b', '#22c55e', '#818cf8'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (15 + Math.random() * 20) + 's';
    particle.style.animationDelay = (index * 0.5) + 's';
    particle.style.width = (3 + Math.random() * 4) + 'px';
    particle.style.height = particle.style.width;

    container.appendChild(particle);
}

// =========================
// スクロールアニメーション
// =========================

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // カードを監視
    document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
    });
}

// =========================
// ライブプレビュー
// =========================

let livePreviewElement = null;
let isPreviewVisible = false;

function initLivePreview() {
    // プレビューパネルを作成
    livePreviewElement = document.createElement('div');
    livePreviewElement.className = 'live-preview';
    livePreviewElement.innerHTML = `
        <div class="live-preview-header">
            <span class="live-preview-title">リアルタイム計算</span>
            <button class="live-preview-close" onclick="toggleLivePreview()">&times;</button>
        </div>
        <div class="live-preview-content">
            <div class="live-preview-row">
                <span class="live-preview-label">年間鑑賞数</span>
                <span class="live-preview-value" id="preview-movies">0本</span>
            </div>
            <div class="live-preview-row">
                <span class="live-preview-label">チケット支出</span>
                <span class="live-preview-value" id="preview-ticket">0円</span>
            </div>
            <div class="live-preview-row">
                <span class="live-preview-label">総支出（税込）</span>
                <span class="live-preview-value" id="preview-total">0円</span>
            </div>
            <div class="live-preview-divider"></div>
            <div class="live-preview-row">
                <span class="live-preview-label">最安プラン</span>
                <span class="live-preview-value highlight" id="preview-best">-</span>
            </div>
            <div class="live-preview-row">
                <span class="live-preview-label">お得額</span>
                <span class="live-preview-value highlight" id="preview-savings">0円</span>
            </div>
        </div>
    `;
    document.body.appendChild(livePreviewElement);

    // 入力フィールドの変更を監視
    const inputs = document.querySelectorAll('input[type="number"], input[type="radio"]');
    inputs.forEach(input => {
        input.addEventListener('change', updateLivePreview);
        input.addEventListener('input', debounce(updateLivePreview, 150));
    });

    // 少し遅れてプレビューを表示
    setTimeout(() => {
        livePreviewElement.classList.add('show');
        isPreviewVisible = true;
    }, 1000);
}

function toggleLivePreview() {
    isPreviewVisible = !isPreviewVisible;
    if (isPreviewVisible) {
        livePreviewElement.classList.add('show');
    } else {
        livePreviewElement.classList.remove('show');
    }
}

function updateLivePreview() {
    const brand = getSelectedBrand();
    const input = readInputs();
    const results = calculateAllPlans(input, brand);

    // 最安プランを見つける
    const best = results.reduce((acc, cur) =>
        cur.effectiveCost < acc.effectiveCost ? cur : acc
    );
    const nonMember = results.find(r => r.planId === 'none');
    const savings = nonMember ? nonMember.effectiveCost - best.effectiveCost : 0;

    // アニメーション付きで値を更新
    animateValue('preview-movies', input.totalMovies, '本');
    animateValue('preview-ticket', input.ticketTotal, '円', true);
    animateValue('preview-total', input.ticketTotal + input.concessionTotal + input.goodsTotal, '円', true);

    document.getElementById('preview-best').textContent =
        best.planId === 'none' ? '会員不要' : best.name.replace(/シネマズ|シネマ/g, '');

    animateValue('preview-savings', Math.max(0, savings), '円', true);
}

// =========================
// 入力フィールドアニメーション
// =========================

function initInputAnimations() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        // ラッパーで囲む
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // フォーカス時のリップルエフェクト
        input.addEventListener('focus', () => {
            wrapper.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            wrapper.classList.remove('focused');
        });
    });
}

// =========================
// カウントアップアニメーション
// =========================

function animateValue(elementId, endValue, suffix = '', format = false) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent.replace(/[^0-9-]/g, '')) || 0;
    const duration = 300;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // イージング関数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);

        if (format) {
            element.textContent = currentValue.toLocaleString('ja-JP') + suffix;
        } else {
            element.textContent = currentValue + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function countUp(element, endValue, duration = 1000, suffix = '') {
    const startValue = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // イージング
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);
        element.textContent = currentValue.toLocaleString('ja-JP') + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// =========================
// ローディング表示
// =========================

function showLoading() {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">計算中...</div>
        `;
        document.body.appendChild(overlay);
    }

    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// =========================
// ユーティリティ
// =========================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =========================
// ページ制御
// =========================

const pageInput = document.getElementById("page-input");
const pageResult = document.getElementById("page-result");
const btnCalc = document.getElementById("btnCalc");
const btnBack = document.getElementById("btnBack");
const btnRecalc = document.getElementById("btnRecalc");

function showPage(id) {
    pageInput.classList.remove("active");
    pageResult.classList.remove("active");

    if (id === "input") {
        pageInput.classList.add("active");
        // プレビューを表示
        if (livePreviewElement) {
            setTimeout(() => {
                livePreviewElement.classList.add('show');
                isPreviewVisible = true;
            }, 300);
        }
    } else {
        pageResult.classList.add("active");
        // プレビューを非表示
        if (livePreviewElement) {
            livePreviewElement.classList.remove('show');
            isPreviewVisible = false;
        }

        // 結果ページのカードをアニメーション
        setTimeout(() => {
            document.querySelectorAll('#page-result .card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, index * 150);
            });
        }, 100);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

btnBack.addEventListener("click", () => showPage("input"));
btnRecalc.addEventListener("click", () => showPage("input"));

function getSelectedBrand() {
    const node = document.querySelector('input[name="brand"]:checked');
    return node ? node.value : "toho";
}

function applyBrandDefaults(brand) {
    const cfg = BRAND_CONFIGS[brand];
    if (!cfg) return;
    const d = cfg.defaults;
    document.getElementById("priceNormal").value = d.priceNormal;
    document.getElementById("priceLate").value = d.priceLate;
    document.getElementById("priceService").value = d.priceService;
    document.getElementById("priceIMAX").value = d.priceIMAX;
    document.getElementById("concessionAmount").value = d.concessionAmount;
    document.getElementById("goodsAmount").value = d.goodsAmount;

    // プレビューを更新
    updateLivePreview();
}

// 映画館選択変更でデフォルトを切り替え
const brandRadios = document.querySelectorAll('input[name="brand"]');
brandRadios.forEach(r => {
    r.addEventListener("change", () => {
    const b = getSelectedBrand();
    applyBrandDefaults(b);
    });
});

btnCalc.addEventListener("click", () => {
    showLoading();

    setTimeout(() => {
        const brand = getSelectedBrand();
        const input = readInputs();
        const results = calculateAllPlans(input, brand);
        renderResults(input, results, brand);
        hideLoading();
        showPage("result");
    }, 600);
});

// =========================
// 入力値読み取り
// =========================

function readNumber(id) {
    const v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? 0 : v;
}

function readFreq(name) {
    const node = document.querySelector(`input[name="${name}"]:checked`);
    if (!node) return 0;
    const v = parseInt(node.value, 10);
    return isNaN(v) ? 0 : v;
}

function readInputs() {
    // 映画回数
    const countNormal = readNumber("countNormal");
    const countLate = readNumber("countLate");
    const countService = readNumber("countService");
    const totalMovies = countNormal + countLate + countService;

    // IMAX回数（通常のうち何回かがIMAX）
    const rawIMAX = readNumber("countIMAX");
    const imaxCount = Math.max(0, Math.min(rawIMAX, countNormal));

    // 料金設定
    const priceNormal = readNumber("priceNormal");
    const priceLate = readNumber("priceLate");
    const priceService = readNumber("priceService");
    const priceIMAX = readNumber("priceIMAX");

    const concessionAmount = readNumber("concessionAmount");
    const goodsAmount = readNumber("goodsAmount");

    // コンセ / 物販頻度（ラジオ）
    const concessionFreq = readFreq("concessionFreq"); // 0,1,2,3,4
    const goodsFreq = readFreq("goodsFreq");

    // コンセッション会計回数
    let concessionTimes = 0;
    if (concessionFreq === 1) {
    concessionTimes = totalMovies;
    } else if (concessionFreq > 1) {
    concessionTimes = Math.floor(totalMovies / concessionFreq);
    }

    // 物販会計回数
    let goodsTimes = 0;
    if (goodsFreq === 1) {
    goodsTimes = totalMovies;
    } else if (goodsFreq > 1) {
    goodsTimes = Math.floor(totalMovies / goodsFreq);
    }

    // チケット内訳
    const normal2dCount = countNormal - imaxCount; // IMAXでない通常
    const ticketCostNormal2D = normal2dCount * priceNormal;
    const ticketCostNormalIMAX = imaxCount * (priceNormal + priceIMAX);
    const ticketCostLate = countLate * priceLate;
    const ticketCostService = countService * priceService;

    const ticketTotal =
    ticketCostNormal2D +
    ticketCostNormalIMAX +
    ticketCostLate +
    ticketCostService;

    const concessionTotal = concessionTimes * concessionAmount;
    const goodsTotal = goodsTimes * goodsAmount;

    return {
    // 回数
    countNormal,
    countLate,
    countService,
    totalMovies,
    imaxCount,
    normal2dCount,
    // 料金
    priceNormal,
    priceLate,
    priceService,
    priceIMAX,
    concessionAmount,
    goodsAmount,
    // 頻度・回数
    concessionFreq,
    goodsFreq,
    concessionTimes,
    goodsTimes,
    // 支出
    ticketTotal,
    ticketCostNormal2D,
    ticketCostNormalIMAX,
    ticketCostLate,
    ticketCostService,
    concessionTotal,
    goodsTotal
    };
}

// =========================
// 計算ロジック
// =========================

function calculateForPlan(input, plan) {
    const ticketSpend = input.ticketTotal;
    const concessionSpend = input.concessionTotal;
    const goodsSpend = input.goodsTotal;
    const baseCost = ticketSpend + concessionSpend + goodsSpend + plan.annualFee;

    // ポイント内訳
    let ticketPoints = 0;
    let concessionPoints = 0;
    let goodsPoints = 0;

    if (plan.pointRule === "perYen") {
    // TOHO ONE：レジごとの1会計単位で計算
    const unit = plan.pointsPer100Yen;

    // 映画レジ：1鑑賞 = 1会計
    const movieUnits =
        input.normal2dCount * Math.floor(input.priceNormal / 100) +
        input.imaxCount * Math.floor((input.priceNormal + input.priceIMAX) / 100) +
        input.countLate * Math.floor(input.priceLate / 100) +
        input.countService * Math.floor(input.priceService / 100);

    ticketPoints = movieUnits * unit;

    // コンセッションレジ
    concessionPoints =
        input.concessionTimes *
        Math.floor(input.concessionAmount / 100) *
        unit;

    // 物販レジ
    goodsPoints =
        input.goodsTimes *
        Math.floor(input.goodsAmount / 100) *
        unit;
    } else if (plan.pointRule === "perMovie") {
    // 旧TOHO / 109シネマズ：映画鑑賞レジのみ1回鑑賞ごとに1P
    ticketPoints = input.totalMovies * plan.pointsPerMovie;
    concessionPoints = 0;
    goodsPoints = 0;
    } else {
    ticketPoints = 0;
    concessionPoints = 0;
    goodsPoints = 0;
    }

    const totalPoints = ticketPoints + concessionPoints + goodsPoints;

    // 無料鑑賞回数
    const freeTickets =
    plan.pointsPerFree === Infinity
        ? 0
        : Math.floor(totalPoints / plan.pointsPerFree);

    // 無料鑑賞は「通常料金」で換算（簡易）
    const freeTicketValue = freeTickets * input.priceNormal;

    const effectiveCost = baseCost - freeTicketValue;

    return {
    planId: plan.id,
    name: plan.name,
    annualFee: plan.annualFee,
    ticketSpend,
    concessionSpend,
    goodsSpend,
    baseCost,
    ticketPoints,
    concessionPoints,
    goodsPoints,
    totalPoints,
    freeTickets,
    freeTicketValue,
    effectiveCost
    };
}

function calculateAllPlans(input, brand) {
    const plans = (BRAND_CONFIGS[brand] || BRAND_CONFIGS["toho"]).plans;
    const results = plans.map(plan => calculateForPlan(input, plan));
    const noMember = results.find(r => r.planId === "none");
    const baseline = noMember ? noMember.effectiveCost : null;

    return results.map(r => {
    const diff = baseline !== null ? baseline - r.effectiveCost : 0;
    return {
        ...r,
        diffFromNoMember: diff
    };
    });
}

// =========================
// 表示系
// =========================

function fmtYen(num) {
    return Math.round(num).toLocaleString("ja-JP", {
    maximumFractionDigits: 0
    }) + "円";
}

function fmtNumber(num) {
    return num.toLocaleString("ja-JP");
}

function renderResults(input, results, brand) {
    const tbody = document
    .getElementById("resultTable")
    .querySelector("tbody");
    tbody.innerHTML = "";

    const brandName = (BRAND_CONFIGS[brand] || BRAND_CONFIGS["toho"]).name;

    // 一番安いプランをハイライト
    const minEffective = Math.min(...results.map(r => r.effectiveCost));
    const non = results.find(r => r.planId === "none");

    results.forEach((r, index) => {
    const tr = document.createElement("tr");
    if (r.effectiveCost === minEffective && r.planId !== "none") {
        tr.classList.add("result-highlight");
    }
    tr.innerHTML = `
        <td>${r.name}${
        r.effectiveCost === minEffective && r.planId !== "none"
            ? '<span class="badge badge-best">最安</span>'
            : ""
        }</td>
        <td><span class="count-up" data-value="${r.annualFee}" data-suffix="円">${fmtYen(r.annualFee)}</span></td>
        <td><span class="count-up" data-value="${r.ticketSpend}" data-suffix="円">${fmtYen(r.ticketSpend)}</span></td>
        <td><span class="count-up" data-value="${r.concessionSpend}" data-suffix="円">${fmtYen(r.concessionSpend)}</span></td>
        <td><span class="count-up" data-value="${r.goodsSpend}" data-suffix="円">${fmtYen(r.goodsSpend)}</span></td>
        <td><span class="count-up" data-value="${r.baseCost}" data-suffix="円">${fmtYen(r.baseCost)}</span></td>
        <td><span class="count-up" data-value="${r.ticketPoints}">${fmtNumber(r.ticketPoints)}</span></td>
        <td><span class="count-up" data-value="${r.concessionPoints}">${fmtNumber(r.concessionPoints)}</span></td>
        <td><span class="count-up" data-value="${r.goodsPoints}">${fmtNumber(r.goodsPoints)}</span></td>
        <td><span class="count-up" data-value="${r.totalPoints}">${fmtNumber(r.totalPoints)}</span></td>
        <td><span class="count-up" data-value="${r.freeTickets}" data-suffix="回">${fmtNumber(r.freeTickets)}回</span></td>
        <td><span class="count-up" data-value="${r.freeTicketValue}" data-suffix="円">${fmtYen(r.freeTicketValue)}</span></td>
        <td><span class="count-up" data-value="${r.effectiveCost}" data-suffix="円">${fmtYen(r.effectiveCost)}</span></td>
        <td>${
        (r.diffFromNoMember >= 0 ? "+" : "") +
        fmtYen(r.diffFromNoMember)
        }</td>
    `;
    tbody.appendChild(tr);

    // 行のアニメーション
    setTimeout(() => {
        tr.classList.add('visible');

        // カウントアップアニメーション
        tr.querySelectorAll('.count-up').forEach(el => {
            const value = parseInt(el.dataset.value) || 0;
            const suffix = el.dataset.suffix || '';
            countUp(el, value, 800, suffix);
        });
    }, 200 + index * 100);
    });

    const best = results.reduce((acc, cur) =>
    cur.effectiveCost < acc.effectiveCost ? cur : acc
    );

    const summary = document.getElementById("resultSummary");
    summary.innerHTML = `
    対象映画館：<strong>${brandName}</strong><br>
    年間の鑑賞本数は
    <strong>${fmtNumber(input.totalMovies)}本</strong>
    （通常 ${fmtNumber(input.countNormal)} / レイト ${fmtNumber(
    input.countLate
    )} / サービスデー ${fmtNumber(input.countService)}）です。<br>
    そのうち、IMAXで観る回数は
    <strong>${fmtNumber(input.imaxCount)}本</strong>
    （追加料金 ${fmtYen(input.priceIMAX)} / 回）として計算しています。<br><br>
    ・チケット支出：<strong>${fmtYen(input.ticketTotal)}</strong><br>
    ・コンセッション支出：<strong>${fmtYen(
        input.concessionTotal
    )}</strong>（${fmtNumber(
    input.concessionTimes
    )}会計）<br>
    ・物販支出：<strong>${fmtYen(input.goodsTotal)}</strong>（${fmtNumber(
    input.goodsTimes
    )}会計）<br><br>
    会員にならない場合の実質支払額は
    <strong>${fmtYen(non.effectiveCost)}</strong>。<br>
    最も安くなるのは
    <strong>${best.name}</strong> で、実質支払額は
    <strong>${fmtYen(best.effectiveCost)}</strong>。<br>
    非会員と比べて
    <strong>${
        (best.diffFromNoMember >= 0 ? "約" : "約−") +
        fmtYen(Math.abs(best.diffFromNoMember))
    }</strong>
    お得になります。
    `;
}
