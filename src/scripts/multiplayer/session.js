const ws = new WebSocket('ws://localhost:8080');

const noServerWarningElement = document.getElementById("no-server");

const btnCreateElem = document.getElementById("create-game");
btnCreateElem.addEventListener("click", () => createGame());
btnCreateElem.classList.add("disabled");

const btnJoinElem = document.getElementById("join-game");
btnJoinElem.addEventListener("click", () => joinGame());
btnJoinElem.classList.add("disabled");

btnReadyElem = document.getElementById("start-game");
btnReadyElem.classList.add("hidden");

const btnCancelElem = document.getElementById("cancel-game");
btnCancelElem.addEventListener("click", () => cancelSession());
btnCancelElem.classList.add("hidden");

const btnConfirmJoin = document.getElementById("confirm-join");
btnConfirmJoin.classList.add("hidden");

const inputGroup = document.getElementById("join-input");
const inputField = document.getElementById("session-input");
inputField.value = "";

const sessionIdDiv = document.getElementById("session-id");
sessionIdDiv.addEventListener("click", () => copySessionId());
sessionIdDiv.classList.add("hidden");

inputGroup.classList.add("hidden");

ws.onopen = () => {
  console.log('Connected to the server');
  noServerWarningElement.classList.add("hidden");
  btnCreateElem.classList.remove("disabled");
  btnJoinElem.classList.remove("disabled");
};

ws.onclose = () => {
  console.log('Disconnected from the server');
  noServerWarningElement.classList.remove("hidden");
  btnCreateElem.classList.remove("hidden");
  btnJoinElem.classList.remove("hidden");
  btnCreateElem.classList.add("disabled");
  btnJoinElem.classList.add("disabled");

  btnReadyElem.classList.add("hidden");
  btnCancelElem.classList.add("hidden");
  sessionIdDiv.classList.add("hidden");

  btnConfirmJoin.classList.add("hidden");
  inputGroup.classList.add("hidden");
};

var createdSessionId = null;
var joinedSessionId = null;

function createGame () {
  btnReadyElem.classList.add("disabled");
  btnCreateElem.classList.add("hidden");
  btnJoinElem.classList.add("hidden");

  btnReadyElem.classList.remove("hidden");
  btnCancelElem.classList.remove("hidden");
  ws.send(JSON.stringify({ type: "createSession" }));
}

function joinGame() {
  btnReadyElem.classList.add("hidden");
  btnCreateElem.classList.add("hidden");
  btnJoinElem.classList.add("hidden");

  btnCancelElem.classList.remove("hidden");
  btnConfirmJoin.classList.remove("hidden");
  inputGroup.classList.remove("hidden");

  btnConfirmJoin.addEventListener('click', async () => {
    const sessionCode = inputField.value.trim();

    if (sessionCode.length) {
      ws.send(JSON.stringify({ type: "joinSession", code: sessionCode }));
      const joined = await findSession();

      if (joined) {
        btnReadyElem.classList.remove("hidden");
        inputGroup.classList.add("hidden");
        btnConfirmJoin.classList.add("hidden");
        joinedSessionId = sessionCode;
      } else {
        alert("Invalid session");
        joinedSessionId = null;
      }
    }
  });
}

async function findSession() {
  return new Promise((resolve) => {
    const handleMessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'sessionJoined') {
        ws.removeEventListener('message', handleMessage);
        resolve(true);
      } else if (data.type === 'sessionInvalid') {
        ws.removeEventListener('message', handleMessage);
        resolve(false);
      }
    };

    ws.addEventListener('message', handleMessage);
  });
}

function cancelSession () {
  btnReadyElem.classList.add("hidden");
  btnCreateElem.classList.remove("hidden");
  btnJoinElem.classList.remove("hidden");

  btnCancelElem.classList.add("hidden");
  sessionIdDiv.classList.add("hidden");
  btnConfirmJoin.classList.add("hidden");
  inputGroup.classList.add("hidden");

  if (createdSessionId) {
    console.log("Cancelled Session of code: " + createdSessionId);
    ws.send(JSON.stringify({ type: "cancelSession", code: createdSessionId }));
    createdSessionId = null;
  } else if (joinedSessionId) {
    console.log("Left Session of code: " + joinedSessionId);
    ws.send(JSON.stringify({ type: "leaveSession", code: joinedSessionId }));
    joinedSessionId = null;
  }
}

function copySessionId () {
  var sessionIdText = sessionIdDiv.innerText.slice(9);

  navigator.clipboard.writeText(sessionIdText).then(() => {
      const tooltip = document.getElementById("tooltip");
      tooltip.classList.add("show");

      // Hide tooltip after 2 seconds
      setTimeout(() => {
          tooltip.classList.remove("show");
      }, 1500);
  }).catch(err => {
      console.error("Failed to copy text: ", err);
  });
}

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'sessionCreated') {
    createdSessionId = data.code;
    sessionIdDiv.classList.remove("hidden");
    
    sessionIdDiv.children[0].innerText = i18next.t("session_code") + ` ${createdSessionId}`
    ws.removeEventListener('message', () => {});
  }
});