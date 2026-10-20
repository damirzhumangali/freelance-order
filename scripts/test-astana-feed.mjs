import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASTANA_SOURCE_URL, astanaOrder, classifyAstanaCard, collectAstanaOrders,
  deadlineExpiresAt, htmlText, parseAstanaDetail, parseAstanaListing,
  parseInclusiveDeadline,
} from "../lib/astana-html.ts";

const card = {
  url: "https://astanahub.com/ru/tech_task/test-site",
  title: "Создание официального сайта продукта",
  brief: "Нужен сайт продукта и адаптивные страницы.",
  client: "ТОО Тест", domain: "Веб-разработка", deadline: "2026-10-26", applicationCount: 2,
};

function listing(cards = [card], next = "") {
  return `<html><div class="load-content">${cards.map((item) => `<a href="${new URL(item.url).pathname}" class="techtask-card load-item"><div class="left"><h2>${item.title}</h2><p>${item.brief}</p></div><div class="right"><div class="card-author"><h4>${item.client}</h4></div><div class="tech-list-item"><p>Прием решений до</p><p><b>${item.deadline.split("-").reverse().join(".")} (включительно)</b></p></div><div class="tech-list-item"><p>Область задачи </p><span>${item.domain}</span></div><div class="tech-list-item"><p>Количество заявок</p><p>${item.applicationCount}</p></div></div></a>`).join("")}</div>${next ? `<div class="next-load"><a href="${next}"></a></div>` : ""}</html>`;
}

function detail(item = card, amount = "0", location = "Только РК") {
  return `<html><div class="card card-tech-task"><div class="card-hd"><div class="card-tech-info"><div class="tech-tash-location">${location}</div><h3>Сумма: <b class="ntprice">${amount}</b></h3><h3>Количество заявок: <b>${item.applicationCount}</b></h3></div><h2>${item.title}</h2></div><div class="card-bd">Технические требования</div></div></html>`;
}

test("listing extracts source facts, decodes entities and validates native pagination", () => {
  const result = parseAstanaListing(listing([{ ...card, title: "Сайт &quot;Orbit&quot;", client: "ТОО &amp; Co" }], "?page=2&amp;status=success"), ASTANA_SOURCE_URL);
  assert.equal(result.cards[0].title, 'Сайт "Orbit"');
  assert.equal(result.cards[0].client, "ТОО & Co");
  assert.equal(result.cards[0].deadline, "2026-10-26");
  assert.equal(result.cards[0].applicationCount, 2);
  assert.equal(new URL(result.nextUrl).searchParams.get("page"), "2");
  assert.equal(htmlText('<svg>garbage</svg><p>Сайт&nbsp;и&#32;приложение</p>'), "Сайт и приложение");
});

test("inclusive deadline expires only at the start of the following Kazakhstan day", () => {
  assert.equal(parseInclusiveDeadline("29.10.26 (включительно)"), "2026-10-29");
  assert.equal(parseInclusiveDeadline("31.02.26"), null);
  assert.equal(deadlineExpiresAt("2026-10-29"), Date.parse("2026-10-29T19:00:00.000Z"));
  assert.ok(Date.parse("2026-10-29T18:59:59.999Z") < deadlineExpiresAt("2026-10-29"));
});

test("scope excludes infra and generic AI, includes site creation, mobile, web modules and bots only with web admin", () => {
  assert.equal(classifyAstanaCard(card)?.category, "website");
  assert.equal(classifyAstanaCard({ title: "Разработка веб-модуля цифрового журнала", brief: "Интерфейс журнала транспорта" })?.category, "app");
  assert.equal(classifyAstanaCard({ title: "Разработка и развертывание AI-агента", brief: "Преобразовать прототип в веб-приложение" })?.category, "app");
  assert.equal(classifyAstanaCard({ title: "Разработка приложения iOS", brief: "Приложение для клиентов" })?.category, "app");
  assert.equal(classifyAstanaCard({ title: "Telegram-бот школы", brief: "Нужна простая веб-админ-панель" })?.category, "app");
  assert.equal(classifyAstanaCard({ title: "Telegram-бот школы", brief: "Отвечать на вопросы в чате" }), null);
  assert.equal(classifyAstanaCard({ title: "Разработка инфраструктуры дата-центра", brief: "Поддержка инфраструктуры" }), null);
  assert.equal(classifyAstanaCard({ title: "Universal AI Agent Factory", brief: "Архитектурный прототип модели" }), null);
  assert.equal(classifyAstanaCard({ title: "Android-прошивка точки мониторинга", brief: "Загрузка модели" }), null);
  assert.equal(classifyAstanaCard({ title: "Тестирование на проникновение веб-приложения", brief: "Пентест" }), null);
});

test("detail preserves actual application count, never guesses currency or country", () => {
  const result = parseAstanaDetail(detail(card, "225000"), card);
  assert.equal(result.countryCode, "KZ");
  assert.equal(result.applicationCount, 2);
  assert.match(result.budget, /225\s000 \(валюта не указана\)/);
  assert.equal(parseAstanaDetail(detail(card), card).budget, "Бюджет не указан");
  assert.equal(parseAstanaDetail(detail(card, "0", "Все страны"), card).countryCode, undefined);
  const order = astanaOrder(card, classifyAstanaCard(card), "2026-10-20T08:00:00Z", result);
  assert.equal(order.source, "Astana Hub");
  assert.equal(order.sourceUrl, card.url);
  assert.equal(order.postedAt, undefined);
  assert.equal(order.contactUrl, undefined);
  assert.equal(order.acceptingUntil, "2026-10-26");
});

test("changed layout, missing facts, hostile links and pagination fail closed", () => {
  assert.throws(() => parseAstanaListing("<html>Cloudflare challenge</html>", ASTANA_SOURCE_URL), /SOURCE_LAYOUT_CHANGED/);
  assert.throws(() => parseAstanaListing(listing().replace("Количество заявок", "unknown"), ASTANA_SOURCE_URL), /SOURCE_LAYOUT_CHANGED/);
  assert.throws(() => parseAstanaListing(listing().replace('href="/ru/tech_task/test-site"', 'href="https://example.com/data"'), ASTANA_SOURCE_URL), /SOURCE_LINK_CHANGED/);
  assert.throws(() => parseAstanaListing(listing([card], "?page=2"), ASTANA_SOURCE_URL), /SOURCE_PAGINATION_CHANGED/);
  assert.throws(() => parseAstanaDetail(detail().replace(card.title, "Другая задача"), card), /SOURCE_DETAIL_CHANGED/);
  const empty = '<div class="service-favorite__empty service-favorite__not-found"><h2>Нет технологические задачи</h2><p>По установленным фильтрам нет результатов</p></div>';
  assert.deepEqual(parseAstanaListing(empty, ASTANA_SOURCE_URL).cards, []);
});

test("collector deduplicates native pages, excludes expired tasks and aborts partial upstream failure", async () => {
  const expired = { ...card, url: "https://astanahub.com/ru/tech_task/expired-site", deadline: "2026-10-19" };
  const seen = [];
  const fetchPage = async (url) => {
    seen.push(url);
    if (url === ASTANA_SOURCE_URL) return listing([card, expired], "?page=2&amp;status=success");
    if (new URL(url).searchParams.get("page") === "2") return listing([card]);
    return detail();
  };
  const result = await collectAstanaOrders(Date.parse("2026-10-20T08:00:00Z"), fetchPage);
  assert.equal(result.length, 1);
  assert.equal(seen.filter((url) => url === card.url).length, 1);
  await assert.rejects(collectAstanaOrders(Date.parse("2026-10-20T08:00:00Z"), async (url) => url === ASTANA_SOURCE_URL ? listing([card], "?page=2&amp;status=success") : Promise.reject(new Error("UPSTREAM_DOWN"))), /UPSTREAM_DOWN/);
});
