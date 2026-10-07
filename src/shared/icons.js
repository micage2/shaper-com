
const Path = (d) => `<path d="${d}"/>`;
const Line = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const PLine = (points) => `<polyline points="${points}"/>`;

const icons = {
    load: [
        Path("M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z")
    ],
    save: [
        Path("M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"),
        PLine("13 2 13 9 20 9")
    ],

    ass: [
        Path("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"),
        PLine("7 10 12 15 17 10"),
        Line(12, 15, 12, 3)
    ],

    missing: [
        Line(12, 15, 12, 3)
    ]
}

function svgdoc(children) {
    const collected = children.join();
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${collected}
    </svg>`;
}

export function GetSVGIcon(name) {
    const d = icons[name];
    return d ? svgdoc(d) : svgdoc(icons.missing);
}