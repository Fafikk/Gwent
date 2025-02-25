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
