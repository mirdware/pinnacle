import './styles/theme.css';
import { Module } from '../scalar';
import Form from './components/Form';
import Test from './components/Test';
import ToDo from './components/ToDo';
import Message from './services/Message';
import VirtualDOM from '../src/view/VirtualDOM';

new Module(Message)
.compose('#square', Test)
.compose('#hello-world', Form)
.compose('#todo', ToDo);

function log(e) {
  console.log(e.target.value);
}

const f = VirtualDOM.create('ul', {style: 'list-style: none'}, 
  VirtualDOM.create('li', {className: 'item', onClick: () => alert('hi!')}, 'item 1'),
  VirtualDOM.create('li', {className: 'item'},
    VirtualDOM.create('input', {type: 'checkbox', checked: true}),
    VirtualDOM.create('input', {type: 'text', onInput: log})
  ),
  VirtualDOM.create('li', {}, 'text')
);

const g = VirtualDOM.create('ul', {style: 'list-style: none'},
  VirtualDOM.create('li', {className: 'item item2', onClick: () => alert('hola!')}, 'item 1'),
  VirtualDOM.create('li', {style: 'background: red'},
    VirtualDOM.create('input', {type: 'checkbox', checked: false}),
    VirtualDOM.create('input', {type: 'text', onInput: log})
  ),
  VirtualDOM.create('li', {}, 'text')
);

const $root = document.getElementById('root');
const $reload = document.getElementById('reload');

const dom = new VirtualDOM($root, f);
$reload.addEventListener('click', () => dom.patch(g));