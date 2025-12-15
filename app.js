
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
    } else {
    pageResult.classList.add("active");
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
}

// 映画館選択変更でデフォルトを切り替え
const brandRadios = document.querySelectorAll('input[name="brand"]');
brandRadios.forEach(r => {
    r.addEventListener("change", () => {
    const b = getSelectedBrand();
    applyBrandDefaults(b);
    });
});

// 初期表示時にTOHOデフォルトをセット
applyBrandDefaults(getSelectedBrand());

btnCalc.addEventListener("click", () => {
    const brand = getSelectedBrand();
    const input = readInputs();
    const results = calculateAllPlans(input, brand);
    renderResults(input, results, brand);
    showPage("result");
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

    results.forEach(r => {
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
        <td>${fmtYen(r.annualFee)}</td>
        <td>${fmtYen(r.ticketSpend)}</td>
        <td>${fmtYen(r.concessionSpend)}</td>
        <td>${fmtYen(r.goodsSpend)}</td>
        <td>${fmtYen(r.baseCost)}</td>
        <td>${fmtNumber(r.ticketPoints)}</td>
        <td>${fmtNumber(r.concessionPoints)}</td>
        <td>${fmtNumber(r.goodsPoints)}</td>
        <td>${fmtNumber(r.totalPoints)}</td>
        <td>${fmtNumber(r.freeTickets)}回</td>
        <td>${fmtYen(r.freeTicketValue)}</td>
        <td>${fmtYen(r.effectiveCost)}</td>
        <td>${
        (r.diffFromNoMember >= 0 ? "+" : "") +
        fmtYen(r.diffFromNoMember)
        }</td>
    `;
    tbody.appendChild(tr);
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
