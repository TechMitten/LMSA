const fs = require('fs');
const filePath = 'c:/Users/Raymond/Documents/LMSA Main/LMSA2/app/src/main/assets/LMSA/js/chat-service.js';
let content = fs.readFileSync(filePath, 'utf8');

// The original lines:
//         // Extract and process smart replies
//         let extractedSmartReplies = [];
//         const smartRepliesMatch = aiMessage.match(/<smart_replies>([\s\S]*?)<\/smart_replies>/);

const targetText = `        // Extract and process smart replies
        let extractedSmartReplies = [];
        const smartRepliesMatch = aiMessage.match(/<smart_replies>([\\s\\S]*?)<\\/smart_replies>/);`;

const replacementText = `        // Extract and process smart replies
        let extractedSmartReplies = [];
        // Remove think tags from the message first so we don't accidentally extract smart replies generated inside the thinking block
        const messageForExtraction = removeThinkTags(aiMessage);
        // Also match without the closing tag in case the model cut off
        const smartRepliesMatch = messageForExtraction.match(/<smart_replies>([\\s\\S]*?)(?:<\\/smart_replies>|$)/);`;

content = content.replace(targetText, replacementText);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched successfully");
