const fs = require('fs');
const filePath = 'c:/Users/Raymond/Documents/LMSA Main/LMSA2/app/src/main/assets/LMSA/js/chat-service.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `            // Extract and process smart replies
            let extractedSmartReplies = [];
            const messageForExtraction = removeThinkTags(aiMessage);`;

const replacement = `            // Extract and process smart replies
            let extractedSmartReplies = [];
            const messageForExtraction = removeThinkTags(aiMessage);
            console.log('REGENERATE AI MESSAGE:', aiMessage.substring(Math.max(0, aiMessage.length - 200)));`;

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
