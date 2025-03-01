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
  ).then(() => {
    console.log("i18next initialized!");

    let scripts;

    if(game_type == "multiplayer") {
      scripts = [
        "https://www.youtube.com/iframe_api",
        "cards.js",
        "decks.js",
        "abilities.js",
        "factions.js",
        "gwent_mp.js",
        "session.js"
      ];
    } else if(game_type == "singleplayer") {
      scripts = [
        "https://www.youtube.com/iframe_api",
        "cards.js",
        "decks.js",
        "abilities.js",
        "factions.js",
        "gwent_sp.js",
        "singleplayer.js"
      ];
    } else {

    }

    function loadScripts(scripts) {
      scripts.forEach(src => {
        const script = document.createElement("script");
        script.src = src;
        script.type = "text/javascript";
        document.body.appendChild(script);
      });
    }

    loadScripts(scripts);
  });

function updatePageContent() {
  document.querySelectorAll("[data-i18n]").forEach(function (element) {
    const key = element.getAttribute("data-i18n");
    element.innerText = i18next.t(key);
  });
}

function changeLanguage(lng) {
  i18next.changeLanguage(lng, updatePageContent);
}