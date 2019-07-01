import { generateUUID } from './util/stdlib';
import Component from './observable/Component';

const getHandler = (observers) => ({
  set: (obj, prop, value) => {
    const execution = Reflect.set(obj, prop, value);
    observers.forEach((fn) => fn());
    return execution;
  }
});

function provide(provider, classes) {
  if (!provider.uuid) {
    const uuid = generateUUID();
    provider.uuid = uuid;
    classes[uuid] = provider;
  }
}

export default class Module {
  constructor(...providers) {
    this.observers = [];
    this.classes = {};
    this.instances = {};
    providers.forEach((provider) => provide(provider, this.classes));
  }

  inject(component) {
    const uuid = component.uuid;
    if (this.classes[uuid]) {
      const component = new this.classes[uuid]();
      component.uuid = uuid;
      this.instances[uuid] = new Proxy(component, getHandler(this.observers));
      delete this.classes[uuid];
    }
    return this.instances[uuid];
  }

  compose(selector, events) {
    const nodes = document.querySelectorAll(selector);
    for (let i = 0, node; node = nodes[i]; i++) {
      new Component(node, events, this);
    }
    return this;
  }
}