const {
  proto,
  delay,
  generateWAMessage,
  areJidsSameUser,
  getContentType,
  downloadContentFromMessage
} = require("baileys");
const axios  = require("axios");

async function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

async function getSizeMedia(path) {
  return new Promise((resolve, reject) => {
    if (/http/.test(path)) {
      axios.get(path).then((res) => {
        let length = parseInt(res.headers["content-length"]);
        let size = bytesToSize(length, 3);
        if (!isNaN(length)) resolve(size);
      });
    } else if (Buffer.isBuffer(path)) {
      let length = Buffer.byteLength(path);
      let size = bytesToSize(length, 3);
      if (!isNaN(length)) resolve(size);
    } else {
      reject("I dont know what the error is");
    }
  });
}


async function fucksmg(dragon, m, store) {
  const gotabaya = await dragon.decodeJid(dragon.user.id);
  if (!m) return m;
  let M = proto.WebMessageInfo;
  try {
    if (m.key) {
      m.id = m.key.id;
      m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
      m.chat = m.key.remoteJid;
      m.fromMe = m.key.fromMe;
      m.isGroup = m.chat.endsWith("@g.us");
      m.sender = dragon.decodeJid(
        (m.fromMe && dragon.user.id) ||
          m.participant ||
          m.key.participant ||
          m.chat ||
          ""
      );
      if (m.isGroup) {
        m.metadata = m.isGroup
          ? (await dragon.groupMetadata(m.chat).catch((_) => [{}])) || [{}]
          : [{}];
        m.admins =
          m.metadata && m.metadata.participants
            ? await m.metadata.participants
                .filter((e) => e.admin !== null)
                .map((e) => e.id)
            : [];
        m.isAdmin = m.admins ? m.admins.includes(m.sender) : false;
        m.participant = m.key.participant || "";
        m.isBotAdmin = m.admins ? m.admins.includes(gotabaya) : false;
      }
    }

    if (m.message) {
      m.mtype = getContentType(m.message);
      m.msg =
        m.mtype == "viewOnceMessage"
          ? m.message[m.mtype].message[
              getContentType(m.message[m.mtype].message)
            ]
          : m.message[m.mtype];
      m.body =
        m.message.conversation ||
        m.msg.caption ||
        m.msg.selectedId ||
        m.msg.text ||
        (m.mtype == "listResponseMessage" &&
          m.msg.singleSelectReply.selectedRowId) ||
        (m.mtype == "buttonsResponseMessage" && m.msg.selectedButtonId) ||
        (m.mtype == "viewOnceMessage" && m.msg.caption) ||
        m.text;

      let quoted = (m.quoted = m.msg.contextInfo
        ? m.msg.contextInfo.quotedMessage
        : null);
      m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];

      if (m.quoted) {
        let type = Object.keys(m.quoted)[0];
        m.quoted = m.quoted[type];
        if (["productMessage"].includes(type)) {
          type = Object.keys(m.quoted)[0];
          m.quoted = m.quoted[type];
        }
        if (typeof m.quoted === "string") m.quoted = { text: m.quoted };
        m.quoted.mtype = type;
        m.quoted.id = m.msg.contextInfo.stanzaId;
        m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
        m.quoted.isBaileys = m.quoted.id
          ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16
          : false;
        m.quoted.sender = dragon.decodeJid(m.msg.contextInfo.participant);
        m.quoted.fromMe = m.quoted.sender === dragon.decodeJid(dragon.user.id);
        m.quoted.text =
          m.quoted.text ||
          m.quoted.caption ||
          m.quoted.conversation ||
          m.quoted.contentText ||
          m.quoted.selectedDisplayText ||
          m.quoted.title ||
          "";
        m.quoted.mentionedJid = m.msg.contextInfo
          ? m.msg.contextInfo.mentionedJid
          : [];
        m.getQuotedObj = m.getQuotedMessage = async () => {
          if (!m.quoted.id) return false;
          let q = await store.loadMessage(m.chat, m.quoted.id, dragon);
          return exports.smsg(dragon, q, store);
        };
      }
    }

    m.text =
      m.msg.text ||
      m.msg.caption ||
      m.message.conversation ||
      m.msg.contentText ||
      m.msg.selectedDisplayText ||
      m.msg.title ||
      m.msg.selectedId ||
      "";
    m.reply = (text, chatId = m.chat, options = {}) =>
      Buffer.isBuffer(text)
        ? dragon.sendMedia(chatId, text, "file", "", m, { ...options })
        : dragon.sendText(chatId, text, m, { ...options });
    m.copy = () => exports.smsg(dragon, M.fromObject(M.toObject(m)));
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) =>
      dragon.copyNForward(jid, m, forceForward, options);
  } catch (err) {
    console.error("Error in message serialization:", err);
  }

  return m;
}

module.exports = { fucksmg, getSizeMedia };
