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

export async function LoadFile(path) {
    const response = await fetch(path);
    if (!response.ok) {
        console.error(`[LoadFile] Failed to load: ${path}`);
        return null;
    }
    return await response.json();
}

