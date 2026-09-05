// test-mediator-bind.js

import { Mediator } from '../src/shared/mediator.js';


class Component {
    constructor(name) {
        this.name = name;
        this.mediator = new Mediator();
    }
    
    on(msg, cb) {
        return this.mediator.on(msg, cb.bind(this));
    }
    
    emit(msg, payload) {
        this.mediator.emit(msg, payload);
    }
}

// Test bubbling up
const compA = new Component('A');

compA.on('greet', function(payload) {
    console.log(`[${this.name}] received: ${payload}`);
    console.log(`[${this.name}] bubbling up...`);
    this.emit('greet-again', `again: ${payload}`);
});

compA.on('greet-again', function(payload) {
    console.log(`[${this.name}] got bubble: ${payload}`);
});

compA.emit('greet', 'hello');