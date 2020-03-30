import * as Privy from '../util/Wrapper';
import * as Node from './Node';
import * as Attribute from './Attribute';

const getFunctionHandler = (property, root) => ({
  apply: (target, thisArg, argumentsList) => {
    const res = Reflect.apply(target, thisArg, argumentsList);
    set(property, root);
    return res;
  }
});
const getPropertyHandler = (property, root) => ({
  set: (target, prop, value) => {
    root = root || target;
    if (value instanceof Promise) {
      return value.then((data) => {
        if (Reflect.set(target, prop, data)) return set(property, root);
      });
    }
    if (Reflect.set(target, prop, value)) {
      return set(property, root);
    }
  },
  get: (target, prop, receiver) => {
    const value = Reflect.get(target, prop, receiver);
    if (value) {
      const constructor = value.constructor;
      root = root || target;
      if (constructor === Function) {
        return new Proxy(
          value.bind(target),
          getFunctionHandler(property, root)
        );
      }
      if (constructor === Object || constructor === Array) {
        return new Proxy(
          value,
          getPropertyHandler(property, root)
        );
      }
    }
    return value;
  }
});

function changeContent(property, value) {
  const state = Object.assign({}, property.value);
  property.value = value;
  property.nodes.forEach((node) => Node.execute(node, state, value));
  property.attributes.forEach((attr) => Attribute.execute(property, attr, value));
  return true;
}

function addOverloap(component, property, name) {
  component = Privy.get(component);
  const prop = component.properties[name];
  prop.over.push(property);
  property.over.push(prop);
  Object.assign(component.events, property.parent.events);
}

function findComponent($node, components, property, name) {
  if ($node.parentNode) {
    const parentNode = $node.parentNode;
    if (parentNode.dataset && parentNode.dataset.component){
      const uuid = parentNode.dataset.component;
      if (components[uuid][name]) {
        addOverloap(components[uuid], property, name);
      }
    }
    findComponent($node.parentNode, components, property, name);
  }
}

export function create(component, name) {
  const parent = Privy.get(component);
  const property = {
    component,
    parent,
    value: '',
    nodes: [],
    attributes: [],
    over: []
  };
  findComponent(parent.$node, parent.module.components, property, name);
  return property;
}

export function get(property) {
  const { value } = property;
  if (typeof value === 'object') {
    if (property.observable !== value) {
      property.proxy = new Proxy(
        value,
        getPropertyHandler(property)
      );
      property.observable = value;
    }
    return property.proxy;
  }
  return value;
}

export function set(property, value = '') {
  property.over.forEach((prop) => prop.value = value);
  return value instanceof Promise ?
  value.then((data) => changeContent(property, data)) :
  changeContent(property, value);
}

export function addNode(property, $node, prop) {
  property.nodes.push(Node.create(property, $node, prop));
}

export function addAttribute(property, name, $element, prop, exp) {
  property.attributes.push(Attribute.create(property, name, $element, prop, exp));
}
