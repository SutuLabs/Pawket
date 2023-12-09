import Vue from "vue";
import VueI18n from "vue-i18n";
import enText from "./en.json";
import zhcnText from "./zh-cn.json";
import ruText from "./ru.json";
import ukText from "./uk.json";
import idText from "./id.json";
import trText from "./tr.json";
import zhtwText from "./zh-tw.json";
import itText from "./it.json";
import svText from "./sv.json";
import jaText from "./ja.json";

Vue.use(VueI18n);

const languages = {
  en: enText,
  zhcn: zhcnText,
  ru: ruText,
  uk: ukText,
  id: idText,
  tr: trText,
  zhtw: zhtwText,
  it: itText,
  sv: svText,
  ja: jaText,
};

export const languageList: Map<string, string> = new Map<string, string>([
  ["en", "English"],
  ["zhcn", "简体中文"],
]);

export const debugLanguageList: Map<string, string> = new Map<string, string>([
  ["en", "English"],
  ["zhcn", "简体中文"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["id", "Bahasa Indonesia"],
  ["tr", "Türkçe"],
  ["zhtw", "繁體中文"],
  ["it", "Italiano"],
  ["sv", "Svenska"],
  ["ja", "日本語"],
]);

const messages = Object.assign(languages);

const defaultLocale = "en";

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: defaultLocale, // set locale
  messages, // set locale messages
});

export const tc = (key: VueI18n.Path, choice?: VueI18n.Choice, values?: VueI18n.Values): string => {
  return i18n.tc(key, choice, values);
};

export default i18n;
