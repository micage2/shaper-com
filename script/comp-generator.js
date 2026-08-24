#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function scaffoldComponent(name) {
    if (!name) {
        console.error('Usage: node scaffold-component.js <component-name>');
        process.exit(1);
    }
    
    const kebabName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
    const className = name.charAt(0).toUpperCase() + name.slice(1);
    const clsid = `jscom.dom-comps.${kebabName}`;
    
    const compDir = path.join(__dirname, '..', 'src', 'dom-comps');
    const htmlFile = path.join(compDir, `${kebabName}.html`);
    const jsFile = path.join(compDir, `${kebabName}.js`);
    
    // Check if files already exist
    if (fs.existsSync(htmlFile) || fs.existsSync(jsFile)) {
        console.error(`Component already exists: ${kebabName}`);
        process.exit(1);
    }
    
    // HTML template
    const htmlTemplate = `<div class="container">
    <slot></slot>
</div>
<style>
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }
    .container {
        width: 100%;
        height: 100%;
    }
</style>`;
    
    // JS template
    const jsTemplate = `import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/${kebabName}.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    // Access internal elements
    // const container = shadow.querySelector('.container');
    
    return {
        getHost() { return host; },
        getInstance() { return {}; }
    };
}

const I${className} = (self) => ({
    // Interface methods
});

const info = {
    clsid: '${clsid}',
    name: '${className}',
    description: ''
};

DOM.register(ctor, (role) => {
    role('${className}', (self) => I${className}(self), true);
}, info);

export default info.clsid;`;
    
    // Write files
    fs.writeFileSync(htmlFile, htmlTemplate);
    fs.writeFileSync(jsFile, jsTemplate);
    
    console.log(`Created component: ${kebabName}`);
    console.log(`  HTML: ${htmlFile}`);
    console.log(`  JS:   ${jsFile}`);
}

scaffoldComponent(process.argv[2]);
