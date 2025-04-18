require("./settings");
const config = require("./settings");
const {
  makeWASocket,
  useMultiFileAuthState,
  Browsers,
  downloadContentFromMessage,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidDecode,
  DisconnectReason,
  makeInMemoryStore,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const { color } = require("./lib/color");
const chalk = require("chalk");
const cfonts = require("cfonts");
const { fucksmg } = require("./lib/msg");
const FileType = require("file-type");
const fs = require("fs");
const path = require("path");
const axios = require("axios"); // Added for getBuffer

// Define getBuffer function
const getBuffer = async (url) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data, "binary");
};

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

async function connectWA() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState("./lib/auth_info_baileys");

  const dragon = makeWASocket({
    version,
    logger: pino({ level: "info" }), // Changed to "info"
    printQRInTerminal: true,
    browser: Browsers.macOS("Desktop"),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
  });

  store.bind(dragon.ev);

  setInterval(() => {
    store.writeToFile("lib/src/store.json");
  }, 10000); // Changed to 10 seconds

  dragon.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    try {
      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        switch (reason) {
          case DisconnectReason.badSession:
            console.log("Bad Session File, Delete and Scan Again.");
            break;
          case DisconnectReason.connectionClosed:
            console.log("Connection Closed, Reconnecting...");
            break;
          case DisconnectReason.connectionLost:
            console.log("Connection Lost, Reconnecting...");
            break;
          case DisconnectReason.connectionReplaced:
            console.log("New Session Opened, Reconnecting...");
            break;
          case DisconnectReason.loggedOut:
            console.log("Logged Out, Delete Session and Scan Again.");
            break;
          case DisconnectReason.restartRequired:
            console.log("Restart Required, Restarting...");
            break;
          case DisconnectReason.timedOut:
            console.log("Connection TimedOut, Reconnecting...");
            break;
          default:
            console.log("Unknown Disconnect Reason:", reason);
        }
        connectWA(); // Reconnect
      }

      if (update.connection === "connecting") {
        console.log(color("🌿 Connecting...", "red"));
      }

      if (update.connection === "open") {
        console.log(color(`🌿 Connected => ` + JSON.stringify(dragon.user, null, 2), "yellow"));

        const generateGradientColors = () => {
          const generateHex = () =>
            `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
          return {
            primary: generateHex(),
            secondary: generateHex(),
            tertiary: generateHex(),
          };
        };

        const displayStyledText = async (text, options = {}) => {
          const colors = generateGradientColors();
          await cfonts.say(text, {
            font: "block",
            colors: [colors.primary, colors.secondary],
            gradient: [colors.primary, colors.secondary, colors.tertiary],
            independentGradient: true,
            transitionGradient: true,
            letterSpacing: 2,
            lineHeight: 1.2,
            space: true,
            maxLength: "0",
            background: "transparent",
            env: "node",
            ...options,
          });
        };

        await displayStyledText("LOD-XXX-MD");
        console.log(chalk.dim("[ ") + chalk.bold("POWERED BY LOD-XXX-MD") + chalk.dim(" ]"));
      }
    } catch (err) {
      console.log("Error in connection.update:", err);
      connectWA();
    }
  });

  dragon.ev.on("creds.update", saveCreds);

  dragon.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0];
      if (!mek.message) return;

      // 👀 React to WhatsApp Status
      if (mek.key?.remoteJid === "status@broadcast") {
        try {
          const me = await dragon.decodeJid(dragon.user.id);
          const emojis = ["👙", "🖕"];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          const participant = mek.key.participant || me;

          await dragon.sendMessage(
            mek.key.remoteJid,
            { react: { key: mek.key, text: randomEmoji } },
            { statusJidList: [participant, me] }
          );
        } catch (err) {
          console.error("Error reacting to status:", err);
        }
        return;
      }

      // 🧠 Message Parsing
      mek.message =
        Object.keys(mek.message)[0] === "ephemeralMessage"
          ? mek.message.ephemeralMessage.message
          : mek.message;

      if (!dragon.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
      if (mek.key.id.startsWith("Dragon") && mek.key.id.length === 16) return;
      if (mek.key.id.startsWith("BAE5")) return;

      await dragon.sendPresenceUpdate("composing", mek.key.remoteJid);

      const m = await fucksmg(dragon, mek, store);

      if (global.message_read) {
        await dragon.readMessages([m.key]);
      }

      require("./fucking")(dragon, m, chatUpdate, store);
    } catch (err) {
      console.error("Error in messages.upsert:", err);
    }
  });

  // Utility Functions
  dragon.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
    } else return jid;
  };

  dragon.sendText = (jid, text, quoted = "", options) =>
    dragon.sendMessage(jid, { text: text, ...options }, { quoted, ...options });

  dragon.getFile = async (PATH, save) => {
    let res;
    let data = Buffer.isBuffer(PATH)
      ? PATH
      : /^https?:\/\//.test(PATH)
      ? await (res = await getBuffer(PATH))
      : fs.existsSync(PATH)
      ? fs.readFileSync(PATH)
      : typeof PATH === "string"
      ? PATH
      : Buffer.alloc(0);

    let type = (await FileType.fromBuffer(data)) || {
      mime: "application/octet-stream",
      ext: ".bin",
    };

    filename = path.join(__dirname, "../lib/src/" + new Date() * 1 + "." + type.ext);
    if (data && save) fs.promises.writeFile(filename, data);
    return {
      res,
      filename,
      size: data.length,
      ...type,
      data,
    };
  };

  dragon.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    const quoted = message.msg ? message.msg : message;
    const mime = (message.msg || message).mimetype || "";
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    const type = await FileType.fromBuffer(buffer);
    const trueFileName = attachExtension ? `${filename}.${type.ext}` : filename;
    fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  dragon.public = true;
}

connectWA();
