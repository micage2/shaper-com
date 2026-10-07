export async function loadFragment(file) {
    const resp = await fetch(file);
    if (!resp.ok)
        throw new Error(`Failed to load template: ${file}`);

    const html = await resp.text();

    return makeFragment(html);
}

export function makeFragment(str) {
    const div = document.createElement('div');
    const fragment = document.createDocumentFragment();

    div.innerHTML = str;

    while (div.firstChild) {
        fragment.appendChild(div.firstChild);
    }

    return fragment;
}

export async function LoadStyle(htmlfile) {
    const resp = await fetch(htmlfile);
    if (!resp.ok) {
        console.log('❌', 'Failed to load template', htmlfile);
        return;
    }

    const div = document.createElement('div');
    div.innerHTML = await resp.text();

    // hoist <style> once per file
    const style = div.querySelector('style');
    if (style && !document.getElementById(style.id)) {
        style.id = style.id || `${Math.random().toString(36).slice(2)}`;
        document.head.appendChild(style);
    }
}

export async function LoadFile(path) {
    const response = await fetch(path);
    if (!response.ok) {
        console.error(`[LoadFile] Failed to load: ${path}`);
        return null;
    }
    return await response.json();
}

export async function loadSheet(file) {
    const sheet = new CSSStyleSheet();

    const response = await fetch(file);
    const cssText = await response.text();

    await sheet.replace(cssText);

    return sheet;
}
