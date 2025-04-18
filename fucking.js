require("./settings");
const util = require("util");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);
const os = require("os");
const { getGroupAdmins, sleep } = require("./lib/myfunc");
const { delay } = require("baileys");
const fs = require("fs");
const { getContentType } = require("baileys");
const moment = require("moment-timezone")
const time = moment().tz("Asia/Colombo").format("HH:mm:ss")

module.exports = dragon = async (dragon, m, msg, chatUpdate, store) => {
  try {
    var body =
      m.mtype === "conversation"
        ? m.message.conversation
        : m.mtype === "imageMessage"
        ? m.message.imageMessage.caption
        : m.mtype === "videoMessage"
        ? m.message.videoMessage.caption
        : m.mtype === "extendedTextMessage"
        ? m.message.extendedTextMessage.text
        : m.mtype === "buttonsResponseMessage"
        ? m.message.buttonsResponseMessage.selectedButtonId
        : m.mtype === "listResponseMessage"
        ? m.message.listResponseMessage.singleSelectReply.selectedRowId
        : m.mtype === "InteractiveResponseMessage"
        ? JSON.parse(
            m.message.interactiveResponseMessage.nativeFlowResponseMessage
              .paramsJson
          )?.id
        : m.mtype === "templateButtonReplyMessage"
        ? m.message.templateButtonReplyMessage.selectedId
        : m.mtype === "messageContextInfo"
        ? m.message.buttonsResponseMessage?.selectedButtonId ||
          m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
          m.message.InteractiveResponseMessage.NativeFlowResponseMessage ||
          m.text
        : "";
    var budy = typeof m.text == "string" ? m.text : "";
    const from = m.key.remoteJid;
    const args = body.trim().split(/ +/).slice(1);
    const text = (q = args.join(" "));
    const pushname = m.pushName || "Nimesh Piyumal";
    const botNumber = await dragon.decodeJid(dragon.user.id);

    const pric = /^#.¦|\\^/.test(body) ? body.match(/^#.¦|\\^/gi) : prefix;
    const dragonbody = body.startsWith(pric);
    const isCommand = dragonbody
      ? body.replace(pric, "").trim().split(/ +/).shift().toLowerCase()
      : "";

    const isCreator = [botNumber, ...global.owner_number]
      .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
      .includes(m.sender);

    const groupMetadata = m.isGroup
      ? await dragon.groupMetadata(m.chat).catch((e) => {})
      : "";
    const participants = m.isGroupp ? await groupMetadata.participants : "";
    const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : "";
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;

    if (!dragon.public) {
      if (isCreator && !m.key.fromMe) return;
    }

    //async function reply(task) {
    // return dragon.sendMessage(from, { text: task, contextInfo:{
    // forwardingScore: 9999999,
    // isForwarded: true  }}, { quoted: m })
    // }

    const fs = require('fs');

  

    // fake qute

    const ai = {
      key: {  remoteJid: "status@broadcast", participant: "0@s.whatsapp.net" },
      message: { extendedTextMessage: { text: body, } },
    };

  


   async function reply(task) {
        return dragon.sendMessage(from, { text: task, contextInfo:{
     forwardingScore: 9999999, 
       isForwarded: true  }}, { quoted: ai })
   }
  

    switch (isCommand) {

      

     
       

       
      case "jid":
        {
          reply(from);
        }
        break;

        case "alive":
        {
          reply(`❮ MOTHER FACKER ☬ ❯`);
        }
        break;

      
  case "xvideo":
    case "xv": {
      try {
        await dragon.sendMessage(from, {
          react: { text: `🍆`, key: m.key },
        });

        if (!text) return reply("❗ Please enter the video name.");
        const search = await axios.get(`https://apis.davidcyriltech.my.id/search/xvideo?text=${text}`);
    
        let caption = `「 *Xvideo Downloader* 」\n\nSearch Results:\n\n` +
          search.data.result.slice(0, 5).map((item, index) => 
            `${index + 1}. ${item.title}`).join('\n') +
          `\n\n> Reply with the number (1-5) of the video you want to download`;
    
        const waitMsg = await dragon.sendMessage(from, 
          { text: "⏳ Processing your request..." }, 
          { quoted: ai }
        );
    
        const sentMessage = await dragon.sendMessage(from, {
          image: { url: 'https://files.catbox.moe/ym74xc.jfif' },
          caption: caption,
          contextInfo: {
            forwardingScore: 9,
            isForwarded: true,
          },
        }, { quoted: ai });
    
        const messageListener = async (chatUpdate) => {
          try {
            const mek = chatUpdate.messages[0];
            if (!mek?.message?.extendedTextMessage?.contextInfo || 
                mek.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
              return;
            }
    
            const selectedNum = mek.message.extendedTextMessage.text.trim();
            if (!['1','2','3','4','5'].includes(selectedNum)) {
              await dragon.sendMessage(from, {
                react: { text: `❌`, key: mek.key },
              });
              return reply("Please select a valid number (1-5)");
            }
    
            const index = parseInt(selectedNum) - 1;
            const selectedVideo = search.data.result[index];
    
            // React to show processing
            await dragon.sendMessage(from, {
              react: { text: `⏳`, key: mek.key },
            });
    
            const processingMsg = await dragon.sendMessage(
              from, 
              { text: `📥 Downloading: ${selectedVideo.title}` },
              { quoted: mek }
            );
    
            try {
              const { data: videoData } = await axios.get(
                `https://apis.davidcyriltech.my.id/xvideo?url=${selectedVideo.url}`
              );
    
              // Update to uploading status
              await dragon.sendMessage(from, {
                edit: processingMsg.key,
                text: `📤 Uploading: ${videoData.title}`
              });
    
              // Send the video
              await dragon.sendMessage(
                from,
                {
                  video: {
                    url: videoData.download_url,
                    mimetype: "video/mp4"
                  },
                  caption: `✅ ${videoData.title}`,
                  fileName: `${videoData.title}.mp4`,
                  contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    externalAdReply: {
                      title: videoData.title,
                      body: "Powerd By LOD-XXX-MD",
                      thumbnailUrl: videoData.thumbnail || 'https://files.catbox.moe/ym74xc.jfif',
                      mediaType: 1
                    }
                  }
                },
                { quoted: mek }
              );
    
              // React with success
              await dragon.sendMessage(from, {
                react: { text: `✅`, key: mek.key },
              });
    
            } catch (error) {
              console.error("Download error:", error);
              await dragon.sendMessage(from, {
                text: `❌ Failed to download video: ${error.message}`,
                quoted: mek
              });
              await dragon.sendMessage(from, {
                react: { text: `❌`, key: mek.key },
              });
            }
    
          } catch (error) {
            console.error("Listener error:", error);
          }
        };
    
        // Add listener without auto-removal
        dragon.ev.on("messages.upsert", messageListener);
    
        // Remove wait message after 30 seconds if no response
        setTimeout(async () => {
          try {
            await dragon.sendMessage(from, { delete: waitMsg.key });
          } catch (e) {
            console.log("Could not delete wait message");
          }
        }, 30000);
    
      } catch (error) {
        console.error("Initial error:", error);
        await dragon.sendMessage(from, {
          text: "❌ Error processing your request",
          quoted: m
        });
      }
      break;
    }

    case "xnxx":
case "xnxxvideo":

    if (!text) return reply(`❌ Please provide a Name.`);
 

    try {
        await dragon.sendMessage(from, {
            react: { text: "🎥", key: m.key },
        });

        const response = await axios.get(`https://api.genux.me/api/download/xnxx-download?query=${encodeURIComponent(text)}&apikey=GENUX-SANDARUX`);
        const data = response.data; 

        const wait = await dragon.sendMessage(
            from,
            { text: "Downloading.... " },
            { quoted: m }
        );

        if (!data || !data.result || !data.result.files) {
            return reply("❌ No results found or invalid response structure.");
        }

        await dragon.sendMessage(from, {
            image: { url: data.result.image },
            caption: `💬 *Title*: ${data.result.title}\n\n👀 *Duration*: ${data.result.duration}\n\n🗯 *Description*: ${data.result.description}\n\n💦 *Tags*: ${data.result.tags}`,
            contextInfo: {
                forwardingScore: 10,
                isForwarded: true,
            }
        });

        await dragon.sendMessage(
            from,
            {
                video: { url: data.result.files.high },
                fileName: data.result.title + ".mp4",
                mimetype: "video/mp4",
                caption: "*Done ✅*",
                contextInfo: {
                    forwardingScore: 10,
                    isForwarded: true,
                },
            },
            { quoted: m }
        );

        await dragon.sendMessage(from, {
            text: `*Uploaded✅*`,
            edit: wait.key,
        });

    } catch (error) {
        console.error(error);
        reply("❌ An error occurred while fetching the video.");
    }
    break;


  case "xhamster": {
    try {
      await dragon.sendMessage(from, {
        react: { text: `🍆`, key: m.key },
      });
  
      if (!text) return reply("❗ Please enter the video name.");
  
      const search = await axios.get(`https://api-dark-shan-yt.koyeb.app/search/xhamster?q=${text}&apikey=bbe41021af6d1d32`);
      const video = search.data.data[0];
  
      if (!video) return reply("❌ No results found!");
  
      const caption = `🍑 *Xhamster Downloader*\n\n🎞️ *${video.title.trim()}*\n\n` +
        `🔻 Choose a video quality:\n\n` +
        `1️⃣ 144p\n2️⃣ 240p\n3️⃣ 480p\n\n` +
        `> ✏️ Reply the Number `;
  
      const waitMsg = await dragon.sendMessage(from,
        { text: "⏳ Fetching video info..." },
        { quoted: m }
      );
  
      const sentMessage = await dragon.sendMessage(from, {
        text: caption,
        contextInfo: {
          forwardingScore: 9999,
          isForwarded: true,
        },
      }, { quoted: ai });
  
      const messageListener = async (chatUpdate) => {
        try {
          const mek = chatUpdate.messages[0];
          if (!mek?.message?.extendedTextMessage?.contextInfo ||
              mek.message.extendedTextMessage.contextInfo.stanzaId !== sentMessage.key.id) {
            return;
          }
  
          const selectedNum = mek.message.extendedTextMessage.text.trim();
          if (!['1', '2', '3'].includes(selectedNum)) {
            await dragon.sendMessage(from, {
              react: { text: `❌`, key: mek.key },
            });
            return reply("Please select a valid number (1-3)");
          }
  
          const qualityIndex = parseInt(selectedNum) - 1;
  
          await dragon.sendMessage(from, {
            react: { text: `⏳`, key: mek.key },
          });
  
          const downloadingMsg = await dragon.sendMessage(from, {
            text: `📥 Downloading: ${video.title.trim()}...`,
          }, { quoted: mek });
  
          const dlResponse = await axios.get(`https://api-dark-shan-yt.koyeb.app/download/xhamaster?url=${video.link}&apikey=bbe41021af6d1d32`);
          const downloadOptions = dlResponse.data.data;
          const selectedFile = downloadOptions[qualityIndex];
  
          await dragon.sendMessage(from, {
            edit: downloadingMsg.key,
            text: `📤 Uploading: ${selectedFile.file_quality} Quality...`,
          });
  
          await dragon.sendMessage(from, {
            video: {
              url: selectedFile.link_url,
              mimetype: "video/mp4"
            },
            caption: `✅ *Downloaded:* ${video.title.trim()}\n🎥 *Quality:* ${selectedFile.file_quality}`,
            fileName: `${selectedFile.file_name}`,
            contextInfo: {
              forwardingScore: 999999,
              isForwarded: true,
              externalAdReply: {
                title: video.title,
                body: "Powered by LOD-XXX-MD",
                thumbnailUrl: video.thumbnail || 'https://files.catbox.moe/ym74xc.jfif',
                mediaType: 1
              }
            }
          }, { quoted: mek });
  
          await dragon.sendMessage(from, {
            react: { text: `✅`, key: mek.key },
          });
  
        } catch (error) {
          console.error("Download error:", error);
          await dragon.sendMessage(from, {
            text: `❌ Failed: ${error.message}`,
            quoted: m
          });
          await dragon.sendMessage(from, {
            react: { text: `❌`, key: m.key },
          });
        }
      };
  
      dragon.ev.on("messages.upsert", messageListener);
  
      // Remove "fetching" message after 30s
      setTimeout(async () => {
        try {
          await dragon.sendMessage(from, { delete: waitMsg.key });
        } catch (e) {
          console.log("Could not delete wait message");
        }
      }, 30000);
  
    } catch (error) {
      console.error("Initial error:", error);
      await dragon.sendMessage(from, {
        text: "❌ Error processing your request",
        quoted: m
      });
    }
    break;
  }

  case 'song': {
    try {
        await dragon.sendMessage(from, { react: { text: '🎧', key: m.key }});
        if(!text) return reply("❗ Please enter the song name.");
        
        // Add await and proper template literal
        const response = await axios.get(`https://apis.davidcyriltech.my.id/song?query=${text}`);
        
        const songData = response.data.result;
        
        await dragon.sendMessage(from, { 
            audio: { 
                url: songData.audio.download_url 
            }, 
            fileName: songData.title + '.mp3', 
            mimetype: 'audio/mpeg', 
            contextInfo: {
                forwardingScore: 9999999,
                isForwarded: true,
                externalAdReply: {
                    title: songData.title,
                    body: `Duration: ${songData.duration}`,
                    thumbnailUrl: songData.thumbnail,
                    mediaType: 1,
                    mediaUrl: songData.video_url,
                    sourceUrl: songData.video_url
                }
            }
        }, { quoted: m });

        await dragon.sendMessage(from, { react: { text: `✅`, key: m.key }});
    } catch (e) {
        console.log(e);
        reply(`❗ Error: ${e.message}`);
    }
}
break;
          

    }
  } catch (err) {
    console.log(util.format(err));
    let e = String(err);
  }
};

          
          

    
