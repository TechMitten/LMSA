// Script to fix the removeThinkTags function in utils.js
const fs = require('fs');
const path = require('path');

const utilsPath = 'c:\Users\Raymond\Documents\LMSA Main\LMSA2\app\src\main\assets\LMSA\js\utils.js';

// Read the current file
let content = fs.readFileSync(utilsPath, 'utf8');

// Define the new removeThinkTags function
const newFunction = `export function removeThinkTags(text) {
    if (!text) return text;

    // Make a copy of the text to avoid modifying the original
    let cleanedText = String(text);

    // Strategy: Remove ALL thinking content aggressively, keeping only actual response
    // Step 1: Remove complete think tag pairs (normal format)
    cleanedText = cleanedText.replace(/