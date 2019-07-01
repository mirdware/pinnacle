# Scalar
Scalar nace de la necesidad de crear sistemas escalables, de alto rendimiento y no obstructivos usando los últimos estándares de programación web, lo cual incluye el uso de las ultimas características basadas en [ECMAScript](https://www.ecma-international.org/ecma-262/8.0/index.html).

El desarrollo de aplicaciones con scalar se basa en una arquitectura _CTR_ (Components Templates and Resources).

## Módulos
Un módulo es un objeto javascript que se instancia de la clase Module de scalar, se deben pasar por constructor las dependencias del módulo para luego hacer llamados al método compose.

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

Con el uso de `compose` se crea un componente con las propiedades definidas según los `data-bind` que se encuentran en la plantilla, si un data-bind no se encuentra definido pero si es el valor de un `data-attr` este también se creara como propiedad del componente.

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
Los componentes (Components) son los artefactos más importantes en el uso de scalar, son los encargados de renderizar y conectar los diferentes elementos del sistema, se podría pensar en ellos como los controladores en un sistema _MVC_ (Models, Views and Controllers) clásico.

Un componente en scalar es basicamente una función pura la cual recibe como parámetro la referencia del objeto compuesto dentro de un módulo.

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

Se debe retornar un objeto en donde la llave sea un selector CSS o el nombre de un evento (click, submit, reset, blur, focus, etc), en el primer caso su valor deberá ser otro objeto que cumpla con las mismas características, pero en caso que la llave referencie al nombre de un evento su valor será la función o método a disparar. Todo evento lanzado previene su comportamiento por defecto.

### Métodos del objeto componentizado

Es posible reiniciar cualquier componente a un estado inicial mediante el método `reset`.

```javascript
...
return {
  '.reset': {
    click: () => $.reset()
  }
};
...
```

El método `toJSON` convierte todas las propiedades del elemento en un formato JSON valido para él envió de datos a través de repositorios o cualquier otro medio.

```javascript
...
return {
  submit: () => ($.show ? alert($.toJSON()) : console.log($))
};
...
```

Un componente se puede comunicar con otros mediante el uso de servicios, estos son inyectados al componente mediante el uso de la función `inject` del objeto componentizado.

```javascript
...
return {
  mount: () => $.header = $.inject(Message).msg
}
...
```

Acá podemos ver el uso del evento `mount` este es ejecutado tan pronto inicia el componente y al momento que alguno de los servicias sufra una modificación, por esta razón cualquier escucha sobre los servicios se debe realizar sobre dicho evento.

### Estilos de declaración

Al ser una función javascript pura, es posible usar un componente con varios estilos de programación, al inicio vimos un retorno directo del objeto, pero tambien se puede usar como una función módulo.

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
Las plantillas (Templates) representan la parte más básica del sistema y se divide en dos: plantillas prerenderizadas y plantillas JIT (Just In Time).

Las plantillas prerenderizadas son aquellas que nos son suministradas por el servidor desde el principio, de esta manera se puede garantizar el funcionamiento de la aplicación aun si el cliente no activa JavaScript; en parte scalar debe su nombre a esto, pues la idea es ir escalando la aplicación según las limitantes del cliente (accesibilidad).

Una plantilla scalar debe contener atributos `data-bind` y `data-attr`, los primeros generan un data binding en dos direcciones entre el componente y la plantilla, mientras el segundo setea los atributos del elemento según modificaciones en el componente, por defecto un data-bind se impone (más no sobrescribe el estado inicial) ante un data-attr; pero si existe un data-attr que no exista como data-bind este generara una propiedad dentro del componente para manejar el atributo del elemento.

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

Como se puede observar data-bind es simplemente un enlace a una propiedad del componente, por lo tanto debe tener el formato de una [propiedad javascript](https://developer.mozilla.org/es/docs/Web/JavaScript/Data_structures#Objetos), mientras el data-attr puede tener tantos atributos como se definan, estos se hayan separados por coma `,` y dentro un para clave valor en donde la clave es el atributo a ser modificado y el valor una propiedad del componente que tendrá el control para modificar el atributo en cuestión.

Por otra parte se encuentran las plantillas JIT las hacen uso de características como [template string](https://developer.mozilla.org/es/docs/Web/JavaScript/Referencia/template_strings) y [template tag](https://developer.mozilla.org/es/docs/Web/HTML/Elemento/template) y su función es generar código HTML de manera dinámica.

El soporte para plantillas JIT está aún en una etapa bastante temprana, pero se están haciendo progresos. Su principal uso se encuentra restringido al binding de datos cuando la propiedad de un componente es compleja (principalmente arrays). Para definir cuando una propiedad es compleja se debe definir una etiqueta template dentro del elemento que se está bindiando.

```html
<tbody data-bind="name">
  <template>
    <tr>
      <td class="first">$${first}</td>
      <td>$${last}</td>
    </tr>
  </template>
</tbody>
```

La forma de especificar propiedades dentro de la propiedad compleja es mediante `${}` y no mediante data-bind, otra manera de realizar esta relación es mediante `$${}` la diferencia es que el uso del doble signo escapa html, mientras que el tag de signo sencillo no lo hace.
