# Scalar
Scalar nace de la necesidad de crear sistemas escalables, de alto rendimiento y no obstructivos usando los últimos estándares de programación web, lo cual incluye el uso de las ultimas características basadas en [ECMAScript](https://www.ecma-international.org/ecma-262/8.0/index.html).

El desarrollo de aplicaciones con scalar se basa en componentes no obstructivos, lo cual quiere decir que no se generan directamente desde javascript si no que deben ser definidos en el HTML y luego usados desde un módulo.

## Módulos
Un módulo es un objeto javascript que se instancia de la clase Module de scalar, se deben proveer por constructor las dependencias para luego crear cada uno de los componentes mediante el método `compose`, esto se logra enviando como primer parámetro el selector del elemento y como segundo la función o clase conductual.

```javascript
import { Module } from '../scalar';
import Form from './components/Form';
import Test from './components/Test';
import ToDo from './components/ToDo';
import Message from './services/Message';

new Module(Message)
.compose('#square', Test)
.compose('#hello-world', Form)
.compose('#todo', ToDo);
```

Las clases o funciones conductuales son aquellas que tienen como propiedades las definiciones de `data-bind` y `data-attr` hayados en la plantilla, estas propiedades tienen un enlace con la plantilla que varia de uno a doble sentido según sea el caso.

```html
<form id="hello-world">
  <input type="text" data-bind="name" disabled />
  <label><input type="checkbox" data-bind="show" checked /> ¿Mostrar alert?</label>
  <div data-bind="show"></div>
  <textarea data-bind="name"></textarea><br/>
  <select data-bind="select">
    <option value="h">Hola</option>
    <option value="m">Mundo</option>
  </select>
  <input type="text" name="select" data-bind="select"><br/>
  <label><input type="radio" name="sexo" data-bind="sexo" value="F" checked /> Femenino</label>
  <label><input type="radio" name="sexo" data-bind="sexo" value="M"> Masculino</label><br/>
  <input type="password" data-bind="password" /> <input type="text" data-bind="password" /><br/>
  <input type="file" data-bind="file" /><br/>
  <input type="submit" />
  <input type="reset" /><br/>
  <input type="button" value="Fill data inside" class="fill" />
</form>
```

## Componentes
Existen dos maneras de generar un componentes, la primera es extendiendo de la clase Component de escalar en la que se debe establecer el método listen, el cual retorna un `behavioral object`(Objeto conductual) con el comportamiento del componente. Cuando la clase es instanciada mediante Module::compose se genera un `compound object`(objeto compuesto) que contiene las propiedades enlazadas a la plantilla y los métodos propios del componente.

```javascript
export default class ToDo extends Component {
  listen() {
    return {
      submit: () => add(this),
      '.close': {
        click: (e) => remove(this, e)
      },
      '.check': {
        click: (e) => crossOutItem(e)
      },
      '#clean': {
        click: () => this.tasks = []
      }
    };
  }
}
```

La segunda manera de definir un componente es mediante `behavioral function`(función conductual), esta es una función pura en javascript que retorna las acciones y comportamiento del componente; la función recibe como argumento un objeto compuesto y retorna un objeto conductual.

```javascript
export default ($) => ({
  submit: (e) => {
    if (!$.task) return;
    $.tasks.push($.task);
    $.task = "";
  },
  '.close': {
    click: (e) => {
      const index = e.target.parentNode.dataset.index;
      $.tasks.splice(index, 1);
    }
  },
  '#clean': {
    click: () => $.tasks = []
  }
});
```

Al ser una función javascript pura es posible usar diferentes estilos de programación. En el ejemplo anterior vimos un retorno directo del objeto, pero tambien se puede usar como una función módulo.

```javascript
export default ($) => {
  function remove(e) {
    const index = e.target.parentNode.dataset.index;
    $.tasks.splice(index, 1);
  }

  function add() {
    if (!$.task) return;
    $.tasks.push($.task);
    $.task = "";
  }

  return {
    submit: (e) => add,
    '.close': {
      click: (e) => remove
    },
    '#clean': {
      click: () => $.tasks = []
    }
  };
};
```

Incluso es posible usar las últimas características de ECMAScript para encapsular llamadas a otras funciones.

```javascript
function remove($, e) {
    const index = e.target.parentNode.dataset.index;
    $.tasks.splice(index, 1);
}

function add($) {
    if (!$.task) return;
    $.tasks.push($.task);
    $.task = "";
}

export default ($) => ({
  submit: (e) => add($),
  '.close': {
    click: (e) => remove($, e)
  },
  '#clean': {
    click: () => $.tasks = []
  }
});
```

### Definición del objeto conductual

El resultado de un componente siempre debe ser el comportamiento del mismo, para este fin se debe proveer un objeto que contenga como llave un selector CSS o el nombre de un evento (click, submit, reset, blur, focus, etc), en el primer caso su valor deberá ser otro objeto conductual y en el segundo debera contener la función o método a ejecutar.

```javascript
{
  submit: (e) => add($),
  '.close': {
    click: (e) => remove($, e)
  },
  '#clean': {
    click: () => $.tasks = []
  }
}
```
Por defecto las funciones o métodos tienen un comportamiento de burbuja, si se desea forzar a la captura se debe anteponer el signo `_` al nombre del evento.

```javascript
{
    mount: () => message.my = $.my,
    '.first': {
      _click: paint
    }
  }
```

En este último ejemplo podemos observar el uso del evento especial `mount`, este es ejecutado tan pronto inicia el componente y es ideal para asignar objetos a servicios, al pasar por referencia cualquier modificación a estos objetos se ve reflejado en el componente.

Todo evento lanzado previene su comportamiento por defecto a no ser que explicitamente se defina lo contrario devolviendo `true` desde la función.

### Métodos del objeto compuesto
Es posible reiniciar cualquier componente a un estado inicial mediante el método `reset`, se debe tener en cuenta que las propiedades representadas por un objeto no pueden ser restablecidos a su estado inicial ya que su valor es referenciado.

```javascript
...
return {
  '.reset': {
    click: () => $.reset()
  }
};
...
```

El método `toJSON` convierte todas las propiedades del objeto a un formato JSON valido para el envió de datos a través de repositorios o cualquier otro medio.

```javascript
...
return {
  submit: () => ($.show ? alert($.toJSON()) : console.log($))
};
...
```

Un componente se puede comunicar con otros mediante servicios, estos son inyectados con el uso de la función `inject`.

```javascript
...
return {
  mount: () => $.inject(Message).my = $.my
}
...
```

## Repositorios
El uso de los repositorios se liga usualmente a los recursos (Resources), pues estos artefactos se encargan de obtener información desde el servidor, claro que se puede usar como origen de datos cualquier cosa, incluso el mismo [localStorage](https://developer.mozilla.org/es/docs/Web/API/Storage/LocalStorage), pero lo normal es que se use una API Rest o GraphQL. Para utilizar un recurso basta con instanciar un objeto de la clase Resource que provee la librería.

```javascript
import { Resource } from 'scalar';

const user = new Resource('response.json');
```

Ya con el objeto se pueden invocar sus métodos get, post, put, delete y request, este último se usa para crear una petición personalizada (PATCH, OPTIONS, HEAD). Hasta acá no difiere mucho de lo que se puede hacer con la [API fetch](https://developer.mozilla.org/es/docs/Web/API/Fetch_API), pero también es posible extender la clase para realizar peticiones más personalizadas.

```javascript
import { Resource } from 'scalar';

class ServerConnection extends Resource {
  constructor(path) {
    super('http://localhost:8080/' + path);
    this.headers = {
      Authorization: "Basic YWxhZGRpbjpvcGVuc2VzYW1l"
    }
  }
}
```

A parte de sobrescribir propiedades como observamos en el ejemplo anterior con los headers, también es posible utilizar del sistema de inversión para usar un solo objeto durante todo el ciclo de vida de la aplicación, solo basta con proveer esta clase y scalar se encarga del resto.

## Plantillas
Las plantillas (Templates) representan la parte más básica del sistema y se pueden clasificar en: prerenderizadas y JIT (Just In Time).

### Prerenderizadas
Las plantillas prerenderizadas son aquellas suministradas por el servidor y hacen parte integral del cuerpo de la petición, de esta manera se puede garantizar el funcionamiento de la aplicación aún si el cliente no activa JavaScript; en parte la idea de la libreria es ir _"escalando"_ la aplicación según las limitantes del cliente (accesibilidad).

Una plantilla scalar debería contener atributos `data-bind` y `data-attr`, los primeros generan un enlace en dos direcciones entre el compound object y la plantilla, mientras el segundo modifica los atributos del elemento según se modifique alguna propiedad solo en este sentido, por defecto un data-bind se impone (más no sobrescribe el estado inicial) ante un data-attr; pero si existe un data-attr que no exista como data-bind este generara una propiedad dentro del componente el cual manejara el atributo del elemento.

```html
<div id="square">
  <span data-attr="className: open" class="open"></span>
  <table>
    <thead>
      <tr>
        <th>Color</th>
        <th>Meta</th>
      </tr>
    </thead>
    <tbody data-bind="name"></tbody>
    <tfoot><a href="#" class="reset">Reset</a></tfoot>
  </table>
</div>
```

Como se puede observar data-bind es simplemente un enlace a una propiedad del componente, por lo tanto debe tener el formato de una [propiedad javascript](https://developer.mozilla.org/es/docs/Web/JavaScript/Data_structures#Objetos), mientras el data-attr puede tener tantos atributos separados por `,` como se desee, un atributo es un par clave valor en donde la clave es el nombre del atributo y el valor una propiedad del componente que manejará los cambios de estado.

Cuando se desea declarar un objeto desde el sistema de plantillas este debe incluirse con separación de `.`.

```html
<h2 data-bind="my.msg" style="color: #fff">Mensaje inicial</h2>
```

### JIT
El soporte para plantillas JIT está aún en una etapa bastante temprana, pero se están haciendo progresos. Su principal uso se encuentra restringido al enlace de datos cuando la propiedad de un componente es compleja (principalmente arrays) y su función es generar código HTML de manera dinámica. Una propiedad es definida como compleja cuando dentro se haya una [template tag](https://developer.mozilla.org/es/docs/Web/HTML/Elemento/template).

```html
<tbody data-bind="name">
  <template>
    <tr>
      <td class="first">$${data.first}</td>
      <td>$${data.last}</td>
    </tr>
  </template>
</tbody>
```

Es posible interpolar código javaScript mediante el uso de la notación [template string](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/template_strings) `${}`, si se usa el simbolo `$${}` se escapan las etiquetas que se viasualizan en pantalla; dentro del template es posible acceder a dos propiedades `index` y `data`, la primera indica el indice del array y la segunda la información contenida en el mismo, esto puede cambiar cuando se implemente virtual DOM en proximas versiones.
