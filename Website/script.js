// Dom Element Selections
const input = document.getElementById('markdown-input');
const output = document.getElementById('preview-output');
const btnClear = document.getElementById('btn-clear');
const btnDownload = document.getElementById('btn-download');
const btnTheme = document.getElementById('btn-theme');
const wordCount = document.getElementById('counter-words');
const charCount = document.getElementById('counter-chars');

// Feature Elements Selections
const btnBold = document.getElementById('btn-bold');
const btnItalic = document.getElementById('btn-italic');
const btnCode = document.getElementById('btn-code');
const btnCopy = document.getElementById('btn-copy');
const btnFocus = document.getElementById('btn-focus');
const workspace = document.getElementById('workspace');
const previewPanel = document.getElementById('preview-panel');

// Default starter text if memory is empty
const templateContent = "# Professional Live Markdown Engine\n\nWelcome to your clean development environment. You can compose documents using raw text logic, which compiles instantly into client-side code structures.\n\n## Extended Engine Features\n\n* **Structured Lists:** Build semantic hierarchies seamlessly.\n* **Code Blocks:** Wrap syntax fields using backticks like `const system = true;`.\n* **Blockquotes:** Accentuate reference documentation easily:\n\n> \"Simplicity is the ultimate sophistication.\" — Leonardo da Vinci\n\n---\n\n### System Configuration Matrix\nPress **Clear Canvas** to start fresh, or click **Export HTML** to download the static structural code output to your computer storage.";

// ========================================================
// RECOVERY STATE IMPLEMENTATION (Loads Cache memory)
// ========================================================
const savedData = localStorage.getItem('savedMarkdown');
if (savedData !== null) {
    input.value = savedData;
} else {
    input.value = templateContent;
}

const activeTheme = localStorage.getItem('preferredTheme');
if (activeTheme === 'light') {
    document.body.classList.add('light-theme');
}

const activeFocusMode = localStorage.getItem('preferredFocusMode');
if (activeFocusMode === 'active') {
    workspace.classList.add('zen-focus-active');
    btnFocus.classList.add('active-btn-state');
    btnFocus.textContent = "👁️ Split View";
}

// ========================================================
// CORE LOGICAL ENGINES
// ========================================================
function compileMarkdown(text) {
    let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let lines = safeText.split(/\r?\n/);
    let htmlLines = [];
    
    let inList = false;
    let inCodeBlock = false;
    let codeBlockContent = [];

    for (let line of lines) {
        let trimmed = line.trim();

        // 1. HANDLE MULTI-LINE CODE BLOCKS (```bash)
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // Close the code block and push the accumulated code lines
                htmlLines.push('<pre><code>' + codeBlockContent.join('\n') + '</code></pre>');
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        // If we are inside a code block, skip all markdown checks and preserve it exactly
        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // 2. HANDLE UNORDERED LIST CLOSURES
        if (inList && !line.startsWith('* ') && !line.startsWith('- ')) {
            htmlLines.push('</ul>');
            inList = false;
        }

        // 3. HORIZONTAL RULES
        if (trimmed === '---') {
            htmlLines.push('<hr>');
            continue;
        }

        // 4. HEADINGS (# to ###)
        if (line.startsWith('### ')) {
            htmlLines.push('<h3>' + line.substring(4) + '</h3>');
            continue;
        }
        if (line.startsWith('## ')) {
            htmlLines.push('<h2>' + line.substring(3) + '</h2>');
            continue;
        }
        if (line.startsWith('# ')) {
            htmlLines.push('<h1>' + line.substring(2) + '</h1>');
            continue;
        }

        // 5. BLOCKQUOTES
        if (line.startsWith('> ')) {
            htmlLines.push('<blockquote>' + line.substring(2) + '</blockquote>');
            continue;
        }

        // 6. UNORDERED LIST ELEMENTS
        if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inList) {
                htmlLines.push('<ul>');
                inList = true;
            }
            htmlLines.push('<li>' + line.substring(2) + '</li>');
            continue;
        }

        // 7. LINE BREAKS AND PARAGRAPHS
        if (trimmed === '') {
            htmlLines.push('<br>');
        } else {
            htmlLines.push('<p>' + line + '</p>');
        }
    }

    if (inList) htmlLines.push('</ul>');
    if (inCodeBlock) htmlLines.push('<pre><code>' + codeBlockContent.join('\n') + '</code></pre>');

    // Recombine lines into a clean string block
    let finalHtml = htmlLines.join('\n');
    
    // Clean string compilation function maps to prevent variable string leaks completely
    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, function(match, p1) { return '<strong>' + p1 + '</strong>'; });
    finalHtml = finalHtml.replace(/\*(.*?)\*/g, function(match, p1) { return '<em>' + p1 + '</em>'; });
    finalHtml = finalHtml.replace(/\`(.*?)\`/g, function(match, p1) { return '<code>' + p1 + '</code>'; });
    finalHtml = finalHtml.replace(/<br>\n<br>/g, '<br>');

    return finalHtml;
}

function calculateMetrics(text) {
    const characterLength = text.length;
    const wordsArray = text.trim().split(/\s+/);
    const wordLength = text.trim() === "" ? 0 : wordsArray.length;

    charCount.textContent = characterLength + " characters";
    wordCount.textContent = wordLength + " words";
}

function processWorkspaceSync() {
    const rawContent = input.value;
    output.innerHTML = compileMarkdown(rawContent);
    calculateMetrics(rawContent);
}

// Quick Formatting Toolbar Inserter Function
function insertMarkdownSyntax(syntaxSymbol) {
    const startPos = input.selectionStart;
    const endPos = input.selectionEnd;
    const originalText = input.value;
    
    const selectedText = originalText.substring(startPos, endPos);
    const newText = originalText.substring(0, startPos) + 
                    syntaxSymbol + selectedText + syntaxSymbol + 
                    originalText.substring(endPos, originalText.length);
                    
    input.value = newText;
    input.focus();
    input.setSelectionRange(startPos + syntaxSymbol.length, endPos + syntaxSymbol.length);
    processWorkspaceSync();
    localStorage.setItem('savedMarkdown', input.value);
}

// ========================================================
// EVENT LISTENERS
// ========================================================
btnBold.addEventListener('click', () => insertMarkdownSyntax('**'));
btnItalic.addEventListener('click', () => insertMarkdownSyntax('*'));
btnCode.addEventListener('click', () => insertMarkdownSyntax('`'));

btnCopy.addEventListener('click', () => {
    const compiledCode = compileMarkdown(input.value);
    navigator.clipboard.writeText(compiledCode).then(() => {
        const originalText = btnCopy.textContent;
        btnCopy.textContent = "Copied! ✓";
        btnCopy.style.background = "#059669";
        btnCopy.style.color = "white";
        
        setTimeout(() => {
            btnCopy.textContent = originalText;
            btnCopy.style.background = "";
            btnCopy.style.color = "";
        }, 2000);
    });
});

btnFocus.addEventListener('click', () => {
    workspace.classList.toggle('zen-focus-active');
    btnFocus.classList.toggle('active-btn-state');
    
    if (workspace.classList.contains('zen-focus-active')) {
        btnFocus.textContent = "👁️ Split View";
        localStorage.setItem('preferredFocusMode', 'active');
    } else {
        btnFocus.textContent = "👁️ Zen Mode";
        localStorage.setItem('preferredFocusMode', 'inactive');
    }
});

btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    if (document.body.classList.contains('light-theme')) {
        localStorage.setItem('preferredTheme', 'light');
    } else {
        localStorage.setItem('preferredTheme', 'dark');
    }
});

input.addEventListener('input', () => {
    processWorkspaceSync();
    localStorage.setItem('savedMarkdown', input.value);
});

btnClear.addEventListener('click', () => {
    input.value = '';
    localStorage.removeItem('savedMarkdown');
    input.focus();
    processWorkspaceSync();
});

btnDownload.addEventListener('click', () => {
    const htmlOutput = "<!DOCTYPE html>\n<html>\n<head>\n<title>Exported Document</title>\n<style\(>\nbody { font-family: sans-serif; line-height: 1.6; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }\nh1,\) h2, h3 { color: #2563eb; font-weight: 600; margin-top: 20px; margin-bottom: 12px; }\(\nblockquote { border-left: 4px solid #cbd5e1; padding-left: 16px; font-style: italic; color: #64748b; }\ncode { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }\npre { background: #1e293b; padding: 16px; border-radius: 8px; color: #f8fafc; overflow-x: auto; }\\)n</style>\n</head>\n<body>\n" + compileMarkdown(input.value) + "\n</body>\n</html>";

    const blob = new Blob([htmlOutput], { type: 'text/html' });
    const temporaryAnchor = document.createElement('a');
    temporaryAnchor.href = URL.createObjectURL(blob);
    temporaryAnchor.download = 'exported_document.html';
    temporaryAnchor.click();
});

// Boot Sync Initialization
processWorkspaceSync();
