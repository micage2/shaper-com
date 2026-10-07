import { DomRegistry as DOM } from '../dom-registry.js';


/**
 * @param {Object} args
 * @property {{label: string, value: string}[]} args.options
 * @property {string} args.value
 * 
 *
 * {{ options: {label: string, value: string}[], value: string }} props
 */
function ctor(args = {}) {
    const self = this;

    const host = document.createElement('select');
    host.style.cssText = `
        height: var(--control-height, 28px);
        padding: var(--control-padding, 4px 12px);
        border-color: var(--border, #378);
        border-radius: var(--control-radius, 4px);
        font-size: var(--control-font-size, 12px);
        background: var(--bg, #333);
        cursor: pointer;
        font-family: Segoe UI, Arial, sans-serif;
    `;

    function _addOption(option) {
        /** @type {HTMLOptionElement} */
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        host.appendChild(opt);

        // this silently sets the selectedOptions
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
            const option = host[i];
            // @ts-ignore
            if (option.value === value) {
                return i;
            }
        }
        return -1;
    }

    args.options?.forEach((option) => { _addOption(option); });

    host.addEventListener('change', (ev) => {
        self.emit('changed', {
            value: host.value,
            label: host.options[host.selectedIndex].label
        });
    });

    if (args.value !== undefined) {
        host.value = args.value;

        // have to delay emission, because listeners aren't wired yet
        setTimeout(() => {
            this.emit('changed', { value: host.value });
        }, 1);
    }

    return {
        getHost() { return host; },
        getInstance() { return { host, _addOption, _removeOption, _setLabel }; }
    };
}

const ISelectBox = ({ host, _addOption, _removeOption, _setLabel }) => ({
    getValue() { return host.value; },
    setValue(value) {
        host.value = value;
    },
    getSelected() {
        const [s] = host.selectedOptions;
        return s ? ({ label: s.label, value: s.value }) : {};
    },
    addOption(label, value) {
        let flag = false;
        if (host.selectedIndex < 0)
            flag = true;

        _addOption({label, value});

        if (flag) {
            console.log('❓', '[Selector]', 'autoselect, this might be a mistake');
            this.emit('changed', {label, value});
        }
    },
    addOptionObj(option) {
        let flag = false;
        if (host.selectedIndex < 0)
            flag = true;

        _addOption(option);

        if (flag) {
            console.log('❓', '[Selector]', 'autoselect, this might be a mistake, select:', option.label);
            this.emit('changed', option);
        }
    },
    removeOption(value) { _removeOption(value) },
    setLabel(value, label) { _setLabel(value, label) },
    focus() {
        host.focus();
        return this;
    }
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