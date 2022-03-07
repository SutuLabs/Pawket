import Vue from "vue";
import VueI18n from "vue-i18n";
import enText from "./en.json";
import zhcnText from "./zh-cn.json";

Vue.use(VueI18n);

const languages = {
  en: enText,
  zhcn: zhcnText,
};

const messages = Object.assign(languages);

const defaultLocale = "en";

// Create VueI18n instance with options
const i18n = new VueI18n({
  locale: defaultLocale, // set locale
  messages, // set locale messages
});

export const translate = (key: string):string => {
  if (!key) {
    return '';
  }
  return <string>i18n.t(key)
}

export default i18n;
