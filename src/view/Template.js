import { addListeners } from "../util/stdlib";

const cache = {};

export function create(component, $node, $template) {
  const regex = /\/?\s*>\s+<\s*/g;
  return {
    component,
    $node,
    tpl: $template.innerHTML.trim()
    .replace(regex, '> <'),
    base: $node.innerHTML.trim()
    .replace($template.outerHTML, '')
    .replace(regex, '> <')
  };
}

export function getValue(template) {
  const value = [];
  let keys = template.tpl.match(/\$\{data\.[\w\d\.]*\}/g);
  if (!keys) return value;
  keys = keys.map((data) => (data.replace('${data.', '').replace('}', '')));
  const regex = new RegExp(template.tpl
  .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  .replace(/\\\$\\\{data\\\.[\w\d\.]*\\\}/g, '(.*?)')
  .replace(/\\\$\\\{[^\}]*\\\}/g, '.*?'), 'g');
  let matches;
  while ((matches = regex.exec(template.base)) !== null) {
    const obj = {};
    keys.forEach((key, i) => {
      obj[key] = matches[i + 1];
    });
    value.push(obj);
  }
  return value;
}

export function render(template, param) {
  const { $node, tpl, component } = template;
  let fn = cache[tpl];
  if (!fn){
    fn = cache[tpl] = Function('data,index', 'return `' + tpl + '`');
  }
  template = Array.isArray(param) ? param.map(fn) : fn(param);
  $node.innerHTML = Array.isArray(template) ? template.join('') : template;
  $node.dispatchEvent(new Event('mutate'));
  addListeners($node, component.events, false);
}
