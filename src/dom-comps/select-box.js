import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;

    const host = document.createElement('select');
    host.style.cssText = 'height: var(--control-height, 28px); padding: var(--control-padding, 4px 12px); border: var(--control-border, 1px solid #ccc); border-radius: var(--control-radius, 4px); font-size: var(--control-font-size, 12px); background:#fff; cursor:pointer; font-family: Segoe UI, Arial, sans-serif;';

    function _addOption(option) {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        host.appendChild(opt);
    }

    function _removeOption(value) {
        const idx_option = findOption(value);
        if (idx_option > -1) host.remove(idx_option);
    }

    function _setLabel(value, label) {
        const idx_option = findOption(value);
        if (idx_option > -1) host[idx_option].textContent = label;
    }

    function findOption(value) {
        for (let i = host.length - 1; i >= 0; i--) {
            if (host[i].value === value) {
                return i;
            }
        }
        return -1;
    }

    args.options.forEach((option) => { _addOption(option); });

    if (args.value !== undefined) {
        host.value = args.value;
    }

    host.addEventListener('change', () => {
        self.emit('change', { value: host.value });
    });

    return {
        getHost() { return host; },
        getInstance() { return { host, _addOption, _removeOption, _setLabel }; }
    };
}

const ISelectBox = ({ host, _addOption, _removeOption, _setLabel }) => ({
    getValue() { return host.value; },
    setValue(value) { host.value = value; },
    addOption(label, value) { _addOption({label, value}); },
    removeOption(value) { _removeOption(value) },
    setLabel(value, label) { _setLabel(value, label) }
});

const info = {
    clsid: 'jscom.dom-comps.select-box',
    name: 'SelectBox',
    description: 'Dropdown selector',
    scheme: {
        options: [{
            label: { type: 'string', required: true },
            value: { type: 'string', required: true }
        }],
        value: { type: 'string', required: false }
    }
};

DOM.register(ctor, (role) => {
    role('SelectBox', ISelectBox, true);
}, info);

export default info.clsid;