import i18next from 'https://cdn.jsdelivr.net/npm/i18next@21.6.10/+esm';
import i18nextHttpBackend from 'https://cdn.jsdelivr.net/npm/i18next-http-backend@1.4.0/+esm';
import i18nextBrowserLanguageDetector from 'https://cdn.jsdelivr.net/npm/i18next-browser-languagedetector@6.1.3/+esm';

i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init(
    {
      fallbackLng: "en",
      debug: true,
      backend: {
        loadPath: "./locales/{{lng}}/translation.json",
      },
      detection: {
        order: ['navigator'],
        lookupFromPathIndex: 0,
        caches: ['localStorage', 'cookie'],
      }
    },
    function () {
      updatePageContent();
    }
  );

function updatePageContent() {
  document.querySelectorAll("[data-i18n]").forEach(function (element) {
    const key = element.getAttribute("data-i18n");
    element.innerText = i18next.t(key);
  });
}

function changeLanguage(lng) {
  i18next.changeLanguage(lng, updatePageContent);
}

export default i18next;
export { changeLanguage };